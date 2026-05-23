import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const [east, west] = await Promise.all([
    prisma.warehouse.create({ data: { name: 'East Warehouse' } }),
    prisma.warehouse.create({ data: { name: 'West Warehouse' } }),
  ]);

  const [productA, productB] = await Promise.all([
    prisma.product.create({ data: { name: 'Allo Backpack', sku: 'ALLO-BACKPACK', description: 'A smart travel backpack with inventory-ready pockets.' } }),
    prisma.product.create({ data: { name: 'Allo Water Bottle', sku: 'ALLO-BOTTLE', description: 'Leakproof bottle suitable for fast-moving commerce.' } }),
  ]);

  await Promise.all([
    prisma.stock.create({ data: { productId: productA.id, warehouseId: east.id, total: 7, reserved: 0 } }),
    prisma.stock.create({ data: { productId: productA.id, warehouseId: west.id, total: 4, reserved: 0 } }),
    prisma.stock.create({ data: { productId: productB.id, warehouseId: east.id, total: 12, reserved: 0 } }),
    prisma.stock.create({ data: { productId: productB.id, warehouseId: west.id, total: 5, reserved: 0 } }),
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
