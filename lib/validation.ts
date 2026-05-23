import { z } from 'zod';

export const reservationRequestSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

export const reservationIdParamSchema = z.object({
  id: z.string().uuid(),
});
