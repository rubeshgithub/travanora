import { z } from 'zod';
import { CabinClassEnum } from './auth.schema.js';

// ─── Search request ───────────────────────────────────────────────────────────

export const IataCodeSchema = z
  .string()
  .length(3, 'Must be a 3-letter IATA airport code')
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'IATA code must be 3 uppercase letters');

export const TripTypeEnum = z.enum(['return', 'one_way', 'multi_city']);

export const FlightSearchSchema = z
  .object({
    origin: IataCodeSchema,
    destination: IataCodeSchema,
    departDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .refine((val) => new Date(val) >= new Date(new Date().toDateString()), {
        message: 'Departure date cannot be in the past',
      }),
    returnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    passengers: z
      .number()
      .int()
      .min(1, 'At least 1 passenger required')
      .max(9, 'Maximum 9 passengers'),
    cabinClass: CabinClassEnum,
    tripType: TripTypeEnum,
  })
  .refine(
    (data) => {
      if (data.tripType === 'return') {
        return !!data.returnDate;
      }
      return true;
    },
    { message: 'Return date is required for round trips', path: ['returnDate'] },
  )
  .refine(
    (data) => {
      if (data.returnDate) {
        return new Date(data.returnDate) > new Date(data.departDate);
      }
      return true;
    },
    { message: 'Return date must be after departure date', path: ['returnDate'] },
  )
  .refine((data) => data.origin !== data.destination, {
    message: 'Origin and destination must be different',
    path: ['destination'],
  });

export type FlightSearchInput = z.infer<typeof FlightSearchSchema>;

// ─── Normalised offer shape returned by our API ───────────────────────────────

export const SliceSchema = z.object({
  origin: z.string(),
  originName: z.string().optional(),
  destination: z.string(),
  destinationName: z.string().optional(),
  departureAt: z.string(),
  arrivalAt: z.string(),
  durationMinutes: z.number(),
  stops: z.number(),
  segments: z.array(
    z.object({
      flightNumber: z.string(),
      airlineName: z.string(),
      airlineCode: z.string(),
      departureAt: z.string(),
      arrivalAt: z.string(),
      origin: z.string(),
      destination: z.string(),
    }),
  ),
});

export const NormalisedOfferSchema = z.object({
  id: z.string(),
  airlineName: z.string(),
  airlineCode: z.string(),
  slices: z.array(SliceSchema),
  publicPrice: z.number(),
  memberPrice: z.number(),
  savings: z.number(),
  currency: z.string(),
  cabinClass: CabinClassEnum,
  passengerCount: z.number().int().min(1).default(1),
  expiresAt: z.string().optional(),
});

export const FlightSearchResponseSchema = z.object({
  offers: z.array(NormalisedOfferSchema),
  isMember: z.boolean(),
  discountPercent: z.number(),
  searchId: z.string(),
});

export type Slice = z.infer<typeof SliceSchema>;
export type NormalisedOffer = z.infer<typeof NormalisedOfferSchema>;
export type FlightSearchResponse = z.infer<typeof FlightSearchResponseSchema>;
