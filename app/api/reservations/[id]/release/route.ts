import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { reservationIdParamSchema } from '@/lib/validation';
import { releaseExpiredReservations } from '@/lib/reservation';

export async function POST(request: Request, { params }: { params: { id?: string } }) {
  const parsed = reservationIdParamSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reservation id' }, { status: 400 });
  }

  await releaseExpiredReservations();

  const reservation = await prisma.reservation.findUnique({
    where: { id: parsed.data.id },
    include: { stock: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  if (reservation.status === 'RELEASED') {
    return NextResponse.json({ error: 'Reservation already released' }, { status: 410 });
  }

  if (reservation.status !== 'PENDING') {
    return NextResponse.json({ error: 'Reservation cannot be released' }, { status: 400 });
  }

  const released = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.stock.updateMany({
      where: {
        id: reservation.stockId,
        reserved: { gte: reservation.quantity },
      },
      data: {
        reserved: { decrement: reservation.quantity },
      },
    });

    if (updateResult.count === 0) {
      throw new Error('STOCK_CONFLICT');
    }

    return tx.reservation.update({
      where: { id: reservation.id },
      data: { status: 'RELEASED' },
      include: { product: true, warehouse: true },
    });
  });

  return NextResponse.json({
    id: released.id,
    productName: released.product.name,
    sku: released.product.sku,
    warehouseName: released.warehouse.name,
    quantity: released.quantity,
    status: released.status,
    expiresAt: released.expiresAt.toISOString(),
  });
}
