import { z } from 'zod';
import { passwordSchema, phoneSchema, NationalityEnum, CabinClassEnum, TravelFrequencyEnum, TravelPurposeEnum } from './auth.schema.js';

// ─── Profile update ───────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  firstName:   z.string().min(2).max(50).trim().optional(),
  lastName:    z.string().min(2).max(50).trim().optional(),
  dob: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    if (isNaN(date.getTime())) return false;
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    return date <= eighteenYearsAgo;
  }, { message: 'You must be at least 18 years old' }),
  nationality: NationalityEnum.optional(),
  phone:       phoneSchema.optional(),
  city:        z.string().min(1).max(100).trim().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// ─── Travel preferences update ────────────────────────────────────────────────

export const UpdatePreferencesSchema = z.object({
  homeAirport:      z.string().length(3, 'Enter a 3-letter IATA code').toUpperCase().optional(),
  preferredCabin:   CabinClassEnum.optional(),
  travelFrequency:  TravelFrequencyEnum.optional(),
  travelPurpose:    TravelPurposeEnum.optional(),
});

export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;

// ─── Change password (logged-in) ──────────────────────────────────────────────

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
