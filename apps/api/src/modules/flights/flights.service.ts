import { duffel } from '../../lib/duffel.js';
import { logger } from '../../lib/logger.js';
import type { FlightSearchInput, NormalisedOffer } from '@travanora/shared';

type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

function placeName(p: { type: string; name: string; city_name?: string }): string {
  return p.type === 'airport' ? (p.city_name ?? p.name) : p.name;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_OFFERS = 12;

interface CacheEntry {
  offers: NormalisedOffer[];
  timestamp: number;
  searchId: string;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(input: FlightSearchInput): string {
  return [
    input.origin,
    input.destination,
    input.departDate,
    input.returnDate ?? '',
    input.cabinClass,
    input.passengers,
  ].join('-');
}

function parseDurationToMinutes(iso: string | null | undefined): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return parseInt(match[1] ?? '0', 10) * 60 + parseInt(match[2] ?? '0', 10);
}

function roundPrice(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function searchFlights(
  input: FlightSearchInput,
  discountPercent: number,
): Promise<{ offers: NormalisedOffer[]; searchId: string }> {
  const key = cacheKey(input);
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    logger.debug({ key }, 'Flight search cache hit');
    return { offers: withDiscount(cached.offers, discountPercent), searchId: cached.searchId };
  }

  const slices =
    input.tripType === 'return' && input.returnDate
      ? [
          { origin: input.origin, destination: input.destination, departure_date: input.departDate, arrival_time: null, departure_time: null },
          { origin: input.destination, destination: input.origin, departure_date: input.returnDate, arrival_time: null, departure_time: null },
        ]
      : [{ origin: input.origin, destination: input.destination, departure_date: input.departDate, arrival_time: null, departure_time: null }];

  const passengers = Array.from({ length: input.passengers }, () => ({ type: 'adult' as const }));

  logger.info(
    { origin: input.origin, destination: input.destination, departDate: input.departDate, cabin: input.cabinClass },
    'Calling Duffel offer request',
  );

  // Single call with return_offers: true — no second list call needed
  const offerRequest = await duffel.offerRequests.create({
    slices,
    passengers,
    cabin_class: input.cabinClass as CabinClass,
    return_offers: true,
  });

  const searchId = offerRequest.data.id;
  const rawOffers = (offerRequest.data.offers ?? [])
    .sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
    .slice(0, MAX_OFFERS);

  if (rawOffers.length === 0) {
    logger.info({ searchId }, 'Duffel returned 0 offers');
    return { offers: [], searchId };
  }

  const normalised: NormalisedOffer[] = rawOffers.map((offer) => {
    const publicPrice = parseFloat(offer.total_amount);
    const firstSegment = offer.slices[0]?.segments[0];
    const airlineName = firstSegment?.marketing_carrier?.name ?? 'Unknown';
    const airlineCode = firstSegment?.marketing_carrier?.iata_code ?? '??';

    const normalisedSlices = offer.slices.map((slice) => ({
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

    return {
      id: offer.id,
      airlineName,
      airlineCode: airlineCode ?? '??',
      slices: normalisedSlices,
      publicPrice,
      memberPrice: publicPrice,
      savings: 0,
      currency: offer.total_currency,
      cabinClass: input.cabinClass,
      passengerCount: offer.passengers?.length ?? 1,
      expiresAt: offer.expires_at ?? undefined,
    };
  });

  cache.set(key, { offers: normalised, timestamp: Date.now(), searchId });
  return { offers: withDiscount(normalised, discountPercent), searchId };
}

function withDiscount(offers: NormalisedOffer[], discountPercent: number): NormalisedOffer[] {
  if (discountPercent === 0) return offers;
  return offers.map((offer) => {
    const memberPrice = roundPrice(offer.publicPrice * (1 - discountPercent / 100));
    return { ...offer, memberPrice, savings: roundPrice(offer.publicPrice - memberPrice) };
  });
}
