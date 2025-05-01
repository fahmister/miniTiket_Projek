import { z } from "zod";

export const voucherSchema = z.object({
  code: z.string().min(3).max(10),
  discount: z.number().positive(),
  max_usage: z.number().int().positive(),
  expiry_date: z.string().datetime(),
  name: z.string().optional(),
});