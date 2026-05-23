import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { reservationIdParamSchema } from '@/lib/validation';
import { releaseExpiredReservations } from '@/lib/reservation';

export async function GET(request: Request, { params }: { params: { id?: string } }) {
  const parsed = reservationIdParamSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reservation id' }, { status: 400 });
  }

  await releaseExpiredReservations();

  const reservation = await prisma.reservation.findUnique({
    where: { id: parsed.data.id },
    include: { product: true, warehouse: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: reservation.id,
    productName: reservation.product.name,
    sku: reservation.product.sku,
    warehouseName: reservation.warehouse.name,
    quantity: reservation.quantity,
    status: reservation.status,
    expiresAt: reservation.expiresAt.toISOString(),
    availableAfterExpiry: 0,
  });
}
