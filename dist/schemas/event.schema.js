"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventUpdateSchema = exports.eventSchema = void 0;
const zod_1 = require("zod");
exports.eventSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Event name must be at least 3 characters"),
    location: zod_1.z.string().min(3, "Location must be at least 3 characters"),
    start_date: zod_1.z.coerce.date({
        required_error: "Start date is required",
        invalid_type_error: "Invalid start date format",
    }),
    end_date: zod_1.z.coerce.date({
        required_error: "End date is required",
        invalid_type_error: "Invalid end date format",
    })
        .refine((date) => date > new Date(), "End date must be in the future"),
    seats: zod_1.z.number().int().positive("Seats must be a positive integer"),
    price: zod_1.z.number().nonnegative("Price cannot be negative"),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1, "Category is required"),
    image_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.null()]).optional(),
}).refine((data) => data.end_date > data.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
});
const baseEventSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Event name must be at least 3 characters"),
    location: zod_1.z.string().min(3, "Location must be at least 3 characters"),
    start_date: zod_1.z.coerce.date({
        required_error: "Start date is required",
        invalid_type_error: "Invalid start date format",
    }),
    end_date: zod_1.z.coerce.date({
        required_error: "End date is required",
        invalid_type_error: "Invalid end date format",
    }).refine((date) => date > new Date(), "End date must be in the future"),
    seats: zod_1.z.number().int().positive("Seats must be a positive integer"),
    price: zod_1.z.number().nonnegative("Price cannot be negative"),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1, "Category is required"),
    image_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.null()]).optional(),
}).refine((data) => data.end_date > data.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
});
exports.eventUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Event name must be at least 3 characters"),
    location: zod_1.z.string().min(3, "Location must be at least 3 characters"),
    start_date: zod_1.z.coerce.date({
        required_error: "Start date is required",
        invalid_type_error: "Invalid start date format",
    }),
    end_date: zod_1.z.coerce.date({
        required_error: "End date is required",
        invalid_type_error: "Invalid end date format",
    }).refine((date) => date > new Date(), "End date must be in the future"),
    seats: zod_1.z.number().int().positive("Seats must be a positive integer"),
    price: zod_1.z.number().nonnegative("Price cannot be negative"),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1, "Category is required"),
    image_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.null()]).optional(),
}).refine((data) => data.end_date > data.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
});
