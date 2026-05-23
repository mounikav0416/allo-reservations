import { prisma } from './db';

export async function releaseExpiredReservations() {
  const pendingExpired = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() },
    },
  });

  if (!pendingExpired.length) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      pendingExpired.map((reservation) =>
        tx.stock.update({
          where: { id: reservation.stockId },
          data: { reserved: { decrement: reservation.quantity } },
        })
      )
    );

    await tx.reservation.updateMany({
      where: { id: { in: pendingExpired.map((reservation) => reservation.id) } },
      data: { status: 'RELEASED' },
    });
  });
}
