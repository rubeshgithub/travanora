import { Types } from 'mongoose';
import { DuffelError } from '@duffel/api';
import { duffel } from '../../lib/duffel.js';
import { logger } from '../../lib/logger.js';
import type { CreateOrderInput, NormalisedOffer } from '@travanora/shared';
import { Booking } from './booking.model.js';
import { AppError } from '../../middleware/error.handler.js';

function roundPrice(n: number): number {
  return Math.round(n * 100) / 100;
}

function placeName(p: { type: string; name: string; city_name?: string }): string {
  return p.type === 'airport' ? (p.city_name ?? p.name) : p.name;
}

function parseDurationToMinutes(iso: string | null | undefined): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return parseInt(match[1] ?? '0', 10) * 60 + parseInt(match[2] ?? '0', 10);
}

function normaliseOffer(raw: Awaited<ReturnType<typeof duffel.offers.get>>['data'], discountPercent: number): NormalisedOffer {
  const publicPrice = parseFloat(raw.total_amount);
  const firstSeg = raw.slices[0]?.segments[0];
  const airlineName = firstSeg?.marketing_carrier?.name ?? 'Unknown';
  const airlineCode = firstSeg?.marketing_carrier?.iata_code ?? '??';

  const slices = raw.slices.map((slice) => ({
    origin: slice.origin.iata_code ?? '',
    originName: placeName(slice.origin),
    destination: slice.destination.iata_code ?? '',
    destinationName: placeName(slice.destination),
    departureAt: slice.segments[0]?.departing_at ?? '',
    arrivalAt: slice.segments[slice.segments.length - 1]?.arriving_at ?? '',
    durationMinutes: parseDurationToMinutes(slice.duration),
    stops: Math.max(0, slice.segments.length - 1),
    segments: slice.segments.map((seg) => ({
      flightNumber: seg.marketing_carrier_flight_number,
      airlineName: seg.marketing_carrier?.name ?? '',
      airlineCode: seg.marketing_carrier?.iata_code ?? '',
      departureAt: seg.departing_at,
      arrivalAt: seg.arriving_at,
      origin: seg.origin.iata_code ?? '',
      destination: seg.destination.iata_code ?? '',
    })),
  }));

  const memberPrice = discountPercent > 0
    ? roundPrice(publicPrice * (1 - discountPercent / 100))
    : publicPrice;
  const savings = roundPrice(publicPrice - memberPrice);

  return {
    id: raw.id,
    airlineName,
    airlineCode,
    slices,
    publicPrice,
    memberPrice,
    savings,
    currency: raw.total_currency,
    cabinClass: 'economy' as NormalisedOffer['cabinClass'],
    passengerCount: raw.passengers?.length ?? 1,
    expiresAt: raw.expires_at ?? undefined,
  };
}

function toE164(phone: string): string {
  // Strip everything except digits and a leading +
  const stripped = phone.replace(/[^\d+]/g, '');
  return stripped.startsWith('+') ? stripped : `+${stripped}`;
}

export async function getOffer(
  offerId: string,
  discountPercent: number,
): Promise<{ offer: NormalisedOffer; isMember: boolean; expiresAt?: string }> {
  logger.info({ offerId }, 'Fetching offer from Duffel');
  const raw = await duffel.offers.get(offerId);
  const offer = normaliseOffer(raw.data, discountPercent);
  return {
    offer,
    isMember: discountPercent > 0,
    expiresAt: raw.data.expires_at ?? undefined,
  };
}

export async function createOrder(
  userId: Types.ObjectId,
  input: CreateOrderInput,
  discountPercent: number,
): Promise<{
  bookingRef: string;
  duffelOrderId: string;
  totalAmount: number;
  savings: number;
  currency: string;
  offer: NormalisedOffer;
}> {
  // Re-fetch offer to get Duffel passenger IDs and validate it hasn't expired
  const rawOffer = await duffel.offers.get(input.offerId);
  const offer = normaliseOffer(rawOffer.data, discountPercent);

  const duffelPassengerIds = rawOffer.data.passengers.map((p) => p.id);
  if (duffelPassengerIds.length === 0) {
    throw new Error('No passengers found on offer');
  }
  if (input.passengers.length !== duffelPassengerIds.length) {
    throw new AppError(
      422,
      'PASSENGER_COUNT_MISMATCH',
      `Offer requires ${duffelPassengerIds.length} passenger(s) but ${input.passengers.length} provided`,
    );
  }

  // What we charge the user (with member discount if applicable)
  const chargedToUser = discountPercent > 0 ? offer.memberPrice : offer.publicPrice;

  // Duffel payment must exactly match the offer's total_amount — our discount is absorbed internally
  const duffelAmount = rawOffer.data.total_amount;
  const duffelCurrency = rawOffer.data.total_currency;

  logger.info({ offerId: input.offerId, userId, passengerCount: input.passengers.length, duffelAmount, chargedToUser }, 'Creating Duffel order');

  let order: Awaited<ReturnType<typeof duffel.orders.create>>;
  try {
    order = await duffel.orders.create({
      type: 'instant',
      selected_offers: [input.offerId],
      passengers: input.passengers.map((p, i) => ({
        id: duffelPassengerIds[i]!,
        title: p.title,
        gender: p.gender,
        given_name: p.given_name,
        family_name: p.family_name,
        born_on: p.born_on,
        email: p.email,
        phone_number: toE164(p.phone_number),
      })),
      payments: [
        {
          type: 'balance',
          amount: duffelAmount,
          currency: duffelCurrency,
        },
      ],
    });
  } catch (err) {
    if (err instanceof DuffelError) {
      logger.error(
        { offerId: input.offerId, errors: err.errors },
        'Duffel order creation failed',
      );
      const fields: Record<string, string> = {};
      for (const e of err.errors) {
        const source = (e as unknown as { source?: { field?: string } }).source;
        const field = source?.field;
        if (field) fields[field] = e.title ?? e.message;
      }
      if (Object.keys(fields).length > 0) {
        throw new AppError(422, 'PASSENGER_VALIDATION_ERROR', 'Passenger details are invalid', { fields });
      }
      throw new AppError(422, 'BOOKING_FAILED', err.errors[0]?.message ?? 'Booking failed');
    }
    throw err;
  }

  const bookingRef = order.data.booking_reference;
  const duffelOrderId = order.data.id;

  logger.info({ bookingRef, duffelOrderId }, 'Duffel order created');

  await Booking.create({
    userId,
    duffelOrderId,
    bookingRef,
    offerId: input.offerId,
    totalAmount: chargedToUser,
    savings: offer.savings,
    currency: offer.currency,
    status: 'confirmed',
    passengers: input.passengers,
    sliceSummary: offer.slices.map((s) => ({
      origin: s.origin,
      destination: s.destination,
      departureAt: s.departureAt,
      arrivalAt: s.arrivalAt,
      airlineName: offer.airlineName,
      airlineCode: offer.airlineCode,
    })),
  });

  return { bookingRef, duffelOrderId, totalAmount: chargedToUser, savings: offer.savings, currency: offer.currency, offer, passengers: input.passengers };
}
