"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventSchema = void 0;
const zod_1 = require("zod");
exports.eventSchema = zod_1.z.object({
    name: zod_1.z.string().min(3), // Nama event min 3 karakter
    location: zod_1.z.string().min(3), // Lokasi min 3 karakter
    start_date: zod_1.z.string().datetime(), // Format ISO datetime
    end_date: zod_1.z.string().datetime(), // Format ISO datetime
    seats: zod_1.z.number().int().positive(), // Kursi harus bilangan bulat positif
    price: zod_1.z.number().nonnegative(), // Harga tidak boleh negatif
    description: zod_1.z.string().min(10), // Deskripsi min 10 karakter
    category: zod_1.z.string(), // Kategori event
    image_url: zod_1.z.string().url().optional(), // URL gambar (opsional)
});
