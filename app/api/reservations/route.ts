import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { reservationRequestSchema } from '@/lib/validation';
import { releaseExpiredReservations } from '@/lib/reservation';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = reservationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reservation request' }, { status: 400 });
  }

  await releaseExpiredReservations();

  const stock = await prisma.stock.findUnique({
    where: {
      productId_warehouseId: {
        productId: parsed.data.productId,
        warehouseId: parsed.data.warehouseId,
      },
    },
  });

  if (!stock) {
    return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
  }

  const reservation = await prisma.$transaction(async (tx) => {
    const updated = await tx.stock.updateMany({
      where: {
        id: stock.id,
        reserved: { lte: stock.total - parsed.data.quantity },
      },
      data: {
        reserved: { increment: parsed.data.quantity },
      },
    });

    if (updated.count === 0) {
      throw new Error('INSUFFICIENT');
    }

    return tx.reservation.create({
      data: {
        productId: parsed.data.productId,
        warehouseId: parsed.data.warehouseId,
        stockId: stock.id,
        quantity: parsed.data.quantity,
        expiresAt: new Date(Date.now() + Number(process.env.NEXT_PUBLIC_RESERVATION_TTL_SECONDS ?? 600) * 1000),
      },
    });
  });

  return NextResponse.json({ id: reservation.id }, { status: 201 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
