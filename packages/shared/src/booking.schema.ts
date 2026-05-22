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
