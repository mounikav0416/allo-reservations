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
    return NextResponse.json({ error: 'Reservation expired or released' }, { status: 410 });
  }

  if (reservation.status !== 'PENDING') {
    return NextResponse.json({ error: 'Reservation cannot be confirmed' }, { status: 400 });
  }

  if (reservation.expiresAt.getTime() < Date.now()) {
    await releaseExpiredReservations();
    return NextResponse.json({ error: 'Reservation expired' }, { status: 410 });
  }

  const confirmed = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.stock.updateMany({
      where: {
        id: reservation.stockId,
        reserved: { gte: reservation.quantity },
      },
      data: {
        reserved: { decrement: reservation.quantity },
        total: { decrement: reservation.quantity },
      },
    });

    if (updateResult.count === 0) {
      throw new Error('STOCK_CONFLICT');
    }

    return tx.reservation.update({
      where: { id: reservation.id },
      data: { status: 'CONFIRMED' },
      include: { product: true, warehouse: true },
    });
  });

  return NextResponse.json({
    id: confirmed.id,
    productName: confirmed.product.name,
    sku: confirmed.product.sku,
    warehouseName: confirmed.warehouse.name,
    quantity: confirmed.quantity,
    status: confirmed.status,
    expiresAt: confirmed.expiresAt.toISOString(),
  });
}
