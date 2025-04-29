import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().min(3),
  location: z.string().min(3),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  seats: z.number().int().positive(),
  price: z.number().nonnegative(),
  description: z.string().min(10),
  category: z.string(),
  image_url: z.string().url().optional(),
});