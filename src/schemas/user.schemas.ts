import { z } from 'zod';

// Schema for user registration and login
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').trim(),
  password: z.string().nonempty('Password is required'),
  first_name: z.string().nonempty('First name is required'),
  last_name: z.string().nonempty('Last name is required'),
  roleID: z.number().nonnegative("Invalid Role")
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim(),
  password: z.string().nonempty('Password is required'),
})