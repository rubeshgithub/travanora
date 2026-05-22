import { z } from 'zod';

const EnvSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid URL').default('http://localhost:4000'),
});

const result = EnvSchema.safeParse(import.meta.env);
if (!result.success) {
  console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration — check your .env file');
}

export const env = result.data;
