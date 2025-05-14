import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  start_date: z.coerce.date({
    required_error: "Start date is required",
    invalid_type_error: "Invalid start date format",
  }),
  end_date: z.coerce.date({
    required_error: "End date is required",
    invalid_type_error: "Invalid end date format",
  })
  .refine((date) => date > new Date(), "End date must be in the future"),
  seats: z.number().int().positive("Seats must be a positive integer"),
  price: z.number().nonnegative("Price cannot be negative"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  image_url: z.union([z.string().url(), z.null()]).optional(),
}).refine((data) => data.end_date > data.start_date, {
  message: "End date must be after start date",
  path: ["end_date"],
});

const baseEventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  start_date: z.coerce.date({
    required_error: "Start date is required",
    invalid_type_error: "Invalid start date format",
  }),
  end_date: z.coerce.date({
    required_error: "End date is required",
    invalid_type_error: "Invalid end date format",
  }).refine((date) => date > new Date(), "End date must be in the future"),
  seats: z.number().int().positive("Seats must be a positive integer"),
  price: z.number().nonnegative("Price cannot be negative"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  image_url: z.union([z.string().url(), z.null()]).optional(),
}).refine((data) => data.end_date > data.start_date, {
  message: "End date must be after start date",
  path: ["end_date"],
});

export const eventUpdateSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  start_date: z.coerce.date({
    required_error: "Start date is required",
    invalid_type_error: "Invalid start date format",
  }),
  end_date: z.coerce.date({
    required_error: "End date is required",
    invalid_type_error: "Invalid end date format",
  }).refine((date) => date > new Date(), "End date must be in the future"),
  seats: z.number().int().positive("Seats must be a positive integer"),
  price: z.number().nonnegative("Price cannot be negative"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  image_url: z.union([z.string().url(), z.null()]).optional(),
}).refine((data) => data.end_date > data.start_date, {
  message: "End date must be after start date",
  path: ["end_date"],
});