import { z } from 'zod';
import { NormalisedOfferSchema } from './flight.schema.js';

// ─── Passenger ────────────────────────────────────────────────────────────────

export const TitleEnum = z.enum(['mr', 'ms', 'mrs', 'miss', 'dr']);
export const GenderEnum = z.enum(['m', 'f']);

export const PassengerInputSchema = z.object({
  title: TitleEnum,
  given_name: z.string().min(1, 'First name is required').max(50),
  family_name: z.string().min(1, 'Last name is required').max(50),
  born_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .refine((d) => {
      const dob = new Date(d);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      return dob < now && age <= 120;
    }, 'Invalid date of birth'),
  gender: GenderEnum,
  email: z.string().email('Invalid email address'),
  phone_number: z
    .string()
    .min(7, 'Phone number too short')
    .max(20, 'Phone number too long')
    .regex(/^\+?[\d\s\-().]+$/, 'Invalid phone number'),
});

export type PassengerInput = z.infer<typeof PassengerInputSchema>;
export type Title = z.infer<typeof TitleEnum>;
export type Gender = z.infer<typeof GenderEnum>;

// ─── Create order request ─────────────────────────────────────────────────────

export const CreateOrderInputSchema = z.object({
  offerId: z.string().min(1, 'Offer ID is required'),
  passengers: z.array(PassengerInputSchema).min(1, 'At least one passenger required').max(9),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

// ─── Offer fetch response (GET /api/flights/offers/:id) ───────────────────────

export const OfferResponseSchema = z.object({
  offer: NormalisedOfferSchema,
  isMember: z.boolean(),
  expiresAt: z.string().optional(),
});

export type OfferResponse = z.infer<typeof OfferResponseSchema>;

// ─── Booking confirmation (POST /api/flights/orders response) ─────────────────

export const BookingConfirmationSchema = z.object({
  bookingRef: z.string(),
  duffelOrderId: z.string(),
  totalAmount: z.number(),
  savings: z.number(),
  currency: z.string(),
  offer: NormalisedOfferSchema,
  passengers: z.array(PassengerInputSchema),
});

export type BookingConfirmation = z.infer<typeof BookingConfirmationSchema>;

// ─── Phase 2 — Phone length standards by country code ────────────────────────

const PHONE_LENGTHS: Record<string, { min: number; max: number }> = {
  '+1':   { min: 10, max: 10 }, // US, Canada
  '+7':   { min: 10, max: 10 }, // Russia, Kazakhstan
  '+20':  { min: 10, max: 10 }, // Egypt
  '+27':  { min: 9,  max: 9  }, // South Africa
  '+30':  { min: 10, max: 10 }, // Greece
  '+31':  { min: 9,  max: 9  }, // Netherlands
  '+32':  { min: 9,  max: 9  }, // Belgium
  '+33':  { min: 9,  max: 9  }, // France
  '+34':  { min: 9,  max: 9  }, // Spain
  '+36':  { min: 9,  max: 9  }, // Hungary
  '+39':  { min: 9,  max: 11 }, // Italy
  '+40':  { min: 9,  max: 9  }, // Romania
  '+41':  { min: 9,  max: 9  }, // Switzerland
  '+43':  { min: 9,  max: 11 }, // Austria
  '+44':  { min: 10, max: 10 }, // UK
  '+45':  { min: 8,  max: 8  }, // Denmark
  '+46':  { min: 9,  max: 9  }, // Sweden
  '+47':  { min: 8,  max: 8  }, // Norway
  '+48':  { min: 9,  max: 9  }, // Poland
  '+49':  { min: 10, max: 11 }, // Germany
  '+52':  { min: 10, max: 10 }, // Mexico
  '+54':  { min: 10, max: 10 }, // Argentina
  '+55':  { min: 10, max: 11 }, // Brazil
  '+56':  { min: 9,  max: 9  }, // Chile
  '+57':  { min: 10, max: 10 }, // Colombia
  '+60':  { min: 9,  max: 10 }, // Malaysia
  '+61':  { min: 9,  max: 9  }, // Australia
  '+62':  { min: 9,  max: 11 }, // Indonesia
  '+63':  { min: 10, max: 10 }, // Philippines
  '+64':  { min: 8,  max: 9  }, // New Zealand
  '+65':  { min: 8,  max: 8  }, // Singapore
  '+66':  { min: 9,  max: 9  }, // Thailand
  '+81':  { min: 10, max: 10 }, // Japan
  '+82':  { min: 9,  max: 10 }, // South Korea
  '+86':  { min: 11, max: 11 }, // China
  '+90':  { min: 10, max: 10 }, // Turkey
  '+91':  { min: 10, max: 10 }, // India
  '+92':  { min: 10, max: 10 }, // Pakistan
  '+94':  { min: 9,  max: 9  }, // Sri Lanka
  '+98':  { min: 10, max: 10 }, // Iran
  '+212': { min: 9,  max: 9  }, // Morocco
  '+213': { min: 9,  max: 9  }, // Algeria
  '+216': { min: 8,  max: 8  }, // Tunisia
  '+218': { min: 9,  max: 9  }, // Libya
  '+234': { min: 10, max: 10 }, // Nigeria
  '+254': { min: 9,  max: 9  }, // Kenya
  '+880': { min: 10, max: 10 }, // Bangladesh
  '+961': { min: 7,  max: 8  }, // Lebanon
  '+962': { min: 9,  max: 9  }, // Jordan
  '+964': { min: 9,  max: 10 }, // Iraq
  '+965': { min: 8,  max: 8  }, // Kuwait
  '+966': { min: 9,  max: 9  }, // Saudi Arabia
  '+968': { min: 8,  max: 8  }, // Oman
  '+971': { min: 9,  max: 9  }, // UAE
  '+973': { min: 8,  max: 8  }, // Bahrain
  '+974': { min: 8,  max: 8  }, // Qatar
};

function phoneLength(code: string): { min: number; max: number } {
  return PHONE_LENGTHS[code] ?? { min: 6, max: 15 };
}

// Exported so the UI can show the expected digit count next to the field
export function getPhoneLength(countryCode: string): { min: number; max: number } {
  return phoneLength(countryCode);
}

// ─── Phase 2 — Passenger (camelCase, with passport fields) ────────────────────

export const PassengerTypeEnum = z.enum(['adult', 'child', 'infant_without_seat']);

export const BookingPassengerSchema = z.object({
  type: PassengerTypeEnum.default('adult'),
  title: TitleEnum,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  gender: GenderEnum,
  nationality: z.string().length(2, 'Use ISO 2-letter country code'),
  // Empty string → undefined so closing the collapsible without typing doesn't fail
  passportNumber: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().min(1).max(20).optional(),
  ),
  passportExpiry: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ),
  passportIssuingCountry: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().length(2).optional(),
  ),
  email: z.string().email('Invalid email address'),
  phone: z.object({
    countryCode: z.string().min(1, 'Country code required'),
    // Strip spaces/dashes before length check
    number: z.preprocess(
      (v) => (typeof v === 'string' ? v.replace(/\D/g, '') : v),
      z.string().max(15),
    ),
  }).superRefine((ph, ctx) => {
    if (!ph.number) {
      ctx.addIssue({ code: 'custom', message: 'Phone number is required', path: ['number'] });
      return;
    }
    const { min, max } = phoneLength(ph.countryCode);
    if (ph.number.length < min) {
      ctx.addIssue({ code: 'custom', message: `Enter ${min} digits for this country`, path: ['number'] });
    } else if (ph.number.length > max) {
      ctx.addIssue({ code: 'custom', message: `Too many digits — max ${max} for this country`, path: ['number'] });
    }
  }),
}).superRefine((data, ctx) => {
  if (!data.dob || !/^\d{4}-\d{2}-\d{2}$/.test(data.dob)) return;
  const dob = new Date(data.dob);
  const now = new Date();
  if (dob >= now) {
    ctx.addIssue({ code: 'custom', message: 'Date of birth must be in the past', path: ['dob'] });
    return;
  }
  const ageYears = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears > 120) {
    ctx.addIssue({ code: 'custom', message: 'Invalid date of birth', path: ['dob'] });
    return;
  }
  const type = data.type ?? 'adult';
  if (type === 'adult' && ageYears < 12) {
    ctx.addIssue({ code: 'custom', message: 'Adult passengers must be 12 years or older', path: ['dob'] });
  } else if (type === 'child' && (ageYears < 2 || ageYears >= 12)) {
    ctx.addIssue({ code: 'custom', message: 'Child passengers must be 2–11 years old', path: ['dob'] });
  } else if (type === 'infant_without_seat' && ageYears >= 2) {
    ctx.addIssue({ code: 'custom', message: 'Infant passengers must be under 2 years old', path: ['dob'] });
  }
});

export type BookingPassenger = z.infer<typeof BookingPassengerSchema>;
export type PassengerType = z.infer<typeof PassengerTypeEnum>;

// ─── Phase 2 — Booking draft (POST /api/bookings/draft) ──────────────────────

export const BookingDraftInputSchema = z.object({
  offerId: z.string().min(1, 'Offer ID is required'),
  passengers: z.array(BookingPassengerSchema).min(1).max(9),
  contactEmail: z.string().email('Invalid contact email'),
  contactPhone: z.string().min(7).max(20),
});

export type BookingDraftInput = z.infer<typeof BookingDraftInputSchema>;

export const BookingDraftResponseSchema = z.object({
  bookingId: z.string(),
  totalAmount: z.number(),
  currency: z.string(),
  expiresAt: z.string(),
  publicPrice: z.number(),
  memberDiscount: z.number(),
  discountPercent: z.number(),
});

export type BookingDraftResponse = z.infer<typeof BookingDraftResponseSchema>;

// ─── Phase 2 — Booking status values ─────────────────────────────────────────

export const BookingStatusEnum = z.enum([
  'draft',
  'pending_payment',
  'paid',
  'confirmed',
  'failed',
  'cancelled',
  'payment_succeeded_booking_failed',
]);

export type BookingStatus = z.infer<typeof BookingStatusEnum>;
