import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z
    .string()
    .min(64, 'JWT_ACCESS_SECRET must be at least 64 characters — generate with crypto.randomBytes(64).toString("hex")'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(64, 'JWT_REFRESH_SECRET must be at least 64 characters — generate with crypto.randomBytes(64).toString("hex")'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  JWT_REFRESH_TTL_REMEMBER_ME: z.string().default('30d'),

  DUFFEL_ACCESS_TOKEN: z.string().min(1, 'DUFFEL_ACCESS_TOKEN is required'),
  DUFFEL_LIVE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // ── Stripe ──────────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_PUBLISHABLE_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),

  // ── AWS SES ─────────────────────────────────────────────────────────────────
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  SES_FROM_EMAIL: z.string().default('support@corporateregistryservices.ca'),
  SES_REPLY_TO: z.string().default('support@corporateregistryservices.ca'),

  COOKIE_DOMAIN: z.string().default('localhost'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

function loadEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌  Invalid environment variables:\n');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();

export type Env = typeof env;
