import { Link } from 'react-router-dom';
import type { NormalisedOffer } from '@travanora/shared';
import { formatDuration, formatPrice } from '@/lib/flightUtils.js';

interface FlightResultCardProps {
  offer: NormalisedOffer;
  isMember: boolean;
  fareCount: number;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function dayOffset(departure: string, arrival: string): number {
  const depDate = new Date(departure).toDateString();
  const arrDate = new Date(arrival).toDateString();
  if (depDate === arrDate) return 0;
  const diff = new Date(arrival).getTime() - new Date(departure).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function StopsLabel({ stops }: { stops: number }) {
  if (stops === 0) return <span className="text-green font-semibold text-[12px]">Nonstop</span>;
  return (
    <span className="text-muted text-[12px]">
      {stops} stop{stops > 1 ? 's' : ''}
    </span>
  );
}

function AirlineBadge({ code }: { code: string }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0">
      <span className="text-[11px] font-bold text-green tracking-wide">{code}</span>
    </div>
  );
}

export function FlightResultCard({ offer, isMember, fareCount }: FlightResultCardProps) {
  const outbound = offer.slices[0];
  const inbound = offer.slices[1];
  const hasSavings = isMember && offer.savings > 0;
  const displayPrice = isMember ? offer.memberPrice : offer.publicPrice;

  return (
    <article className="card p-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Slices */}
        <div className="flex-1 space-y-3 min-w-0">
          {outbound && (
            <SliceRow slice={outbound} code={offer.airlineCode} name={offer.airlineName} />
          )}
          {inbound && (
            <SliceRow slice={inbound} code={offer.airlineCode} name={offer.airlineName} showDivider />
          )}
        </div>

        {/* Price + action */}
        <div className="flex sm:flex-col flex-row items-center sm:items-end justify-between sm:justify-start sm:min-w-[148px] sm:text-right gap-3 sm:gap-0">
          <div>
            {fareCount > 1 && (
              <p className="text-[12px] text-muted mb-0.5">{fareCount} fares from</p>
            )}
            {hasSavings ? (
              <>
                <p className="text-[13px] text-muted line-through leading-tight">
                  {formatPrice(offer.publicPrice, offer.currency)}
                </p>
                <p className="text-xl font-bold text-navy leading-tight">
                  {formatPrice(offer.memberPrice, offer.currency)}
                </p>
                <span className="badge-saved mt-1 inline-flex">
                  Saved {formatPrice(offer.savings, offer.currency)}
                </span>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-navy leading-tight">
                  {formatPrice(displayPrice, offer.currency)}
                </p>
                {!isMember && (
                  <Link
                    to="/register"
                    className="text-[12px] font-semibold text-green hover:underline mt-0.5 block"
                  >
                    Join free · save 10% →
                  </Link>
                )}
              </>
            )}
          </div>
          <Link
            to={`/book/${offer.id}`}
            className="btn-primary text-[13px] px-5 py-2 mt-0 sm:mt-3 flex-shrink-0 text-center"
          >
            Select →
          </Link>
        </div>
      </div>
    </article>
  );
}

interface SliceRowProps {
  slice: NormalisedOffer['slices'][number];
  code: string;
  name: string;
  showDivider?: boolean;
}

function SliceRow({ slice, code, name, showDivider }: SliceRowProps) {
  const firstSeg = slice.segments[0];
  const lastSeg = slice.segments[slice.segments.length - 1];
  const offset = firstSeg && lastSeg ? dayOffset(firstSeg.departureAt, lastSeg.arrivalAt) : 0;

  return (
    <div>
      {showDivider && <div className="border-t border-line/60 my-3" />}
      <div className="flex items-center gap-3">
        <AirlineBadge code={code} />

        <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Departure */}
          <div className="text-center flex-shrink-0">
            <p className="text-[17px] font-bold text-navy leading-tight">
              {slice.departureAt ? formatTime(slice.departureAt) : '--:--'}
            </p>
            <p className="text-[12px] font-semibold text-navy">{slice.originName ?? slice.origin}</p>
            <p className="text-[11px] text-muted">{slice.origin}</p>
          </div>

          {/* Route line */}
          <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
            <p className="text-[11px] text-muted font-medium">
              {formatDuration(slice.durationMinutes)}
            </p>
            <div className="flex items-center w-full gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-muted/40 flex-shrink-0" />
              <div className="flex-1 h-px bg-line" />
              {slice.stops > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-muted/60 flex-shrink-0" />
              )}
              <div className="flex-1 h-px bg-line" />
              <svg width="7" height="7" viewBox="0 0 7 7" fill="none" className="flex-shrink-0">
                <path
                  d="M0 3.5H7M4 0.5L7 3.5L4 6.5"
                  stroke="#5b6b82"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <StopsLabel stops={slice.stops} />
          </div>

          {/* Arrival */}
          <div className="text-center flex-shrink-0 relative">
            <p className="text-[17px] font-bold text-navy leading-tight">
              {slice.arrivalAt ? formatTime(slice.arrivalAt) : '--:--'}
              {offset > 0 && (
                <sup className="text-[10px] text-amber-500 font-bold ml-0.5">+{offset}</sup>
              )}
            </p>
            <p className="text-[12px] font-semibold text-navy">{slice.destinationName ?? slice.destination}</p>
            <p className="text-[11px] text-muted">{slice.destination}</p>
          </div>
        </div>

        {/* Airline name — lg only */}
        <p className="hidden lg:block text-[11px] text-muted w-20 text-right truncate flex-shrink-0">
          {name}
        </p>
      </div>
    </div>
  );
}
