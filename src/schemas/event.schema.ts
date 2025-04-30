import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().min(3),                // Nama event min 3 karakter
  location: z.string().min(3),            // Lokasi min 3 karakter
  start_date: z.string().datetime(),      // Format ISO datetime
  end_date: z.string().datetime(),        // Format ISO datetime
  seats: z.number().int().positive(),     // Kursi harus bilangan bulat positif
  price: z.number().nonnegative(),        // Harga tidak boleh negatif
  description: z.string().min(10),        // Deskripsi min 10 karakter
  category: z.string(),                   // Kategori event
  image_url: z.string().url().optional(), // URL gambar (opsional)
});