import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { releaseExpiredReservations } from '@/lib/reservation';

export async function GET() {
  await releaseExpiredReservations();

  const products = await prisma.product.findMany({
    include: {
      stocks: {
        include: { warehouse: true },
      },
    },
  });

  const response = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    stocks: product.stocks.map((stock) => ({
      warehouseId: stock.warehouse.id,
      warehouseName: stock.warehouse.name,
      total: stock.total,
      reserved: stock.reserved,
      available: stock.total - stock.reserved,
    })),
  }));

  return NextResponse.json(response);
}
