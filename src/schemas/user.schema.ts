import { z } from 'zod';

// Schema for user registration and login
export const registerSchema = z.object({
  email: z.string().email('Invalid email address').trim(),
  password: z.string().nonempty('Password is required'),
  first_name: z.string().nonempty('First name is required'),
  last_name: z.string().nonempty('Last name is required'),
  roleId: z.number().nonnegative("Invalid Role"),
  referred_by: z.string()
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim(),
  password: z.string().nonempty('Password is required'),
})