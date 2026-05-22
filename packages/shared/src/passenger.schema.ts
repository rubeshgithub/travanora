import { z } from 'zod';

// ─── Core enums (moved here from booking.schema — more general home) ──────────

export const TitleEnum = z.enum(['mr', 'ms', 'mrs', 'miss', 'dr']);
export const GenderEnum = z.enum(['m', 'f']);

export type Title = z.infer<typeof TitleEnum>;
export type Gender = z.infer<typeof GenderEnum>;

// ─── Shared preprocessing ─────────────────────────────────────────────────────

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

// ─── Core passenger identity + travel documents ───────────────────────────────
// Shared base for BookingPassengerSchema (booking flow) and SavedPassengerSchema.
// Contains: name, DOB (with basic range validation), gender, nationality, passport fields.
// Does NOT contain: passenger type, contact email/phone (booking-specific).

export const passengerCoreSchema = z.object({
  title: TitleEnum,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD')
    .refine((d) => {
      const dob = new Date(d);
      const now = new Date();
      const ageYears = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return dob < now && ageYears <= 120;
    }, 'Invalid date of birth'),
  gender: GenderEnum,
  nationality: z.string().length(2, 'Use ISO 2-letter country code'),
  passportNumber: z.preprocess(emptyToUndefined, z.string().min(1).max(20).optional()),
  passportExpiry: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  passportIssuingCountry: z.preprocess(emptyToUndefined, z.string().length(2).optional()),
});

export type PassengerCore = z.infer<typeof passengerCoreSchema>;

// ─── Saved passenger ──────────────────────────────────────────────────────────

export const RelationshipEnum = z.enum([
  'self', 'spouse', 'child', 'parent', 'colleague', 'other',
]);
export type Relationship = z.infer<typeof RelationshipEnum>;

export const SavedPassengerSchema = passengerCoreSchema.extend({
  relationship: RelationshipEnum.optional(),
});

export type SavedPassengerInput = z.infer<typeof SavedPassengerSchema>;
