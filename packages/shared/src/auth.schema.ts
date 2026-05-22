import { z } from 'zod';

// ─── Reusable field schemas ───────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const phoneSchema = z.object({
  countryCode: z.enum([
    '+965', // Kuwait
    '+966', // Saudi Arabia
    '+971', // UAE
    '+973', // Bahrain
    '+974', // Qatar
    '+968', // Oman
    '+91',  // India
    '+92',  // Pakistan
    '+44',  // UK
    '+1',   // US
  ]),
  number: z
    .string()
    .min(7, 'Phone number too short')
    .max(10, 'Phone number too long')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
});

// ─── Nationality / cabin enums ────────────────────────────────────────────────

export const NationalityEnum = z.enum([
  'KW', 'SA', 'AE', 'BH', 'QA', 'OM', // GCC
  'IN', 'PK', 'GB', 'US', 'OTHER',
]);

export const CabinClassEnum = z.enum([
  'economy',
  'premium_economy',
  'business',
  'first',
]);

export const TravelFrequencyEnum = z.enum([
  'occasional',
  'frequent',
  'very_frequent',
  'road_warrior',
]);

export const TravelPurposeEnum = z.enum(['business', 'leisure', 'mixed']);

export const MemberTierEnum = z.enum(['free', 'gold', 'platinum', 'corporate']);

// ─── Register ─────────────────────────────────────────────────────────────────

export const RegisterSchema = z
  .object({
    // Personal
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).trim(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).trim(),
    dob: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          if (isNaN(date.getTime())) return false;
          const eighteenYearsAgo = new Date();
          eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
          return date <= eighteenYearsAgo;
        },
        { message: 'You must be at least 18 years old' },
      ),
    nationality: NationalityEnum.optional(),

    // Contact
    email: emailSchema,
    phone: phoneSchema,
    city: z.string().min(1).max(100).trim().default('Kuwait City'),

    // Travel preferences (optional)
    homeAirport: z
      .string()
      .length(3, 'Enter a 3-letter IATA code')
      .toUpperCase()
      .default('KWI'),
    preferredCabin: CabinClassEnum.optional(),
    travelFrequency: TravelFrequencyEnum.optional(),
    travelPurpose: TravelPurposeEnum.optional(),

    // Security
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),

    // Consent
    termsAgreed: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the terms and conditions' }),
    }),
    marketingOptIn: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─── Login ────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Forgot password ──────────────────────────────────────────────────────────

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// ─── API response shapes ──────────────────────────────────────────────────────

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  city: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
});

export const MemberResponseSchema = z.object({
  id: z.string(),
  tier: MemberTierEnum,
  discountPercent: z.number(),
  homeAirport: z.string(),
  preferredCabin: CabinClassEnum.optional(),
  joinedAt: z.string(),
});

export const AuthResponseSchema = z.object({
  user: UserResponseSchema,
  member: MemberResponseSchema,
  accessToken: z.string(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type MemberResponse = z.infer<typeof MemberResponseSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
