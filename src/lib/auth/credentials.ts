import { z } from 'zod'

export const credentialsSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Password is required'),
  next: z
    .string()
    .trim()
    .refine((value) => value.startsWith('/') && !value.startsWith('//'), {
      message: 'Invalid redirect path',
    })
    .default('/requests'),
})
