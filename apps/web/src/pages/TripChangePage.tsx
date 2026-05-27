import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MemberShell } from '@/components/MemberShell.js';
import { fetchBookingById } from '@/features/bookings/booking.api.js';
import { useChangeSearch, useConfirmChange } from '@/features/trips/useTrips.js';
import { formatPrice } from '@/lib/flightUtils.js';
import type { ChangeOffer, ChangeSearchResult } from '@/features/trips/trips.api.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-KW', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatDuration(mins: number | undefined) {
  if (!mins) return null;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ── Change amount badge ────────────────────────────────────────────────────────

function ChangeBadge({ amount, currency }: { amount: number; currency: string }) {
  if (amount === 0) {
    return <span className="text-[12px] font-semibold text-green bg-green-tint px-2 py-0.5 rounded-full">Free change</span>;
  }
  if (amount < 0) {
    return (
      <span className="text-[12px] font-semibold text-green bg-green-tint px-2 py-0.5 rounded-full">
        Refund {formatPrice(Math.abs(amount), currency)}
      </span>
    );
  }
  return (
    <span className="text-[12px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      +{formatPrice(amount, currency)} extra
    </span>
  );
}

// ── Offer card ────────────────────────────────────────────────────────────────

function OfferCard({
  offer,
  selected,
  onSelect,
}: {
  offer: ChangeOffer;
  selected: boolean;
  onSelect: () => void;
}) {
  const slice = offer.slices[0];
  if (!slice) return null;
  const seg = slice.segments[0];

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left border rounded-xl p-4 transition-all duration-150 ${
        selected
          ? 'border-green bg-green-tint/30 shadow-sm'
          : 'border-line bg-white hover:border-green/40 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Airline badge */}
        <div className="w-9 h-9 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-green">{seg?.airlineCode ?? '??'}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Route + time */}
          <div className="flex items-center gap-2 text-[14px] font-bold text-navy">
            <span>{slice.origin}</span>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-muted flex-shrink-0">
              <path d="M1 7h12M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{slice.destination}</span>
          </div>
          <p className="text-[12px] text-muted mt-0.5">
            {formatDateTime(slice.departureAt)}
            {slice.durationMinutes && ` · ${formatDuration(slice.durationMinutes)}`}
            {slice.stops > 0 && ` · ${slice.stops} stop${slice.stops > 1 ? 's' : ''}`}
            {slice.stops === 0 && ' · Non-stop'}
          </p>
          {slice.segments.length > 0 && (
            <p className="text-[11px] text-muted mt-0.5">
              {slice.segments.map((s) => s.flightNumber).join(' · ')}
              {seg && ` · ${seg.airlineName}`}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <ChangeBadge amount={offer.changeTotalAmount} currency={offer.changeTotalCurrency} />
          {selected && (
            <span className="text-[11px] font-semibold text-green">Selected ✓</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Review panel ──────────────────────────────────────────────────────────────

function ReviewPanel({
  offer,
  bookingId,
  onBack,
}: {
  offer: ChangeOffer;
  bookingId: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [acknowledged, setAcknowledged] = useState(false);
  const { mutate: confirm, isPending, error } = useConfirmChange(bookingId);

  const slice = offer.slices[0];
  const hasExtraCharge = offer.changeTotalAmount > 0;
  const hasRefund = offer.changeTotalAmount < 0;

  function handleConfirm() {
    confirm(
      { offerId: offer.id },
      {
        onSuccess: (result) => {
          navigate(`/trips/${bookingId}/change/confirmed`, { state: result, replace: true });
        },
      },
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-[15px] font-semibold text-navy">Review change</h2>

      {/* New flight */}
      {slice && (
        <div className="bg-surface border border-line rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">New flight</p>
          <div className="flex items-center gap-2 text-[14px] font-bold text-navy">
            <span>{slice.origin}</span>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-muted">
              <path d="M1 7h12M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{slice.destination}</span>
          </div>
          <p className="text-[13px] text-muted">{formatDateTime(slice.departureAt)}</p>
          {slice.durationMinutes && (
            <p className="text-[12px] text-muted">
              Duration: {formatDuration(slice.durationMinutes)} · {slice.stops === 0 ? 'Non-stop' : `${slice.stops} stop${slice.stops > 1 ? 's' : ''}`}
            </p>
          )}
        </div>
      )}

      {/* Pricing summary */}
      <div className={`rounded-xl border px-4 py-3 space-y-1 ${
        hasExtraCharge ? 'bg-amber-50 border-amber-100' :
        hasRefund ? 'bg-green-tint border-green/20' :
        'bg-surface border-line'
      }`}>
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-navy">
            {hasExtraCharge ? 'Extra charge' : hasRefund ? 'Refund due' : 'No cost'}
          </p>
          <p className="text-[16px] font-bold text-navy">
            {offer.changeTotalAmount !== 0
              ? formatPrice(Math.abs(offer.changeTotalAmount), offer.changeTotalCurrency)
              : '—'}
          </p>
        </div>
        <p className="text-[11px] text-muted">
          {hasExtraCharge
            ? 'Our team will be in touch about collecting the additional charge.'
            : hasRefund
            ? 'A refund will be issued to your original payment method within 5–10 business days.'
            : 'This change has no additional cost.'}
        </p>
      </div>

      {/* Acknowledgement */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded accent-green flex-shrink-0"
        />
        <span className="text-[13px] text-navy leading-relaxed">
          I understand this change is permanent and will replace my current itinerary
        </span>
      </label>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600">
          {(error as { message?: string }).message ?? 'Change failed — please try again'}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={handleConfirm}
          disabled={!acknowledged || isPending}
          className="w-full py-3 rounded-xl text-[14px] font-semibold bg-green text-white hover:bg-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? 'Confirming change…' : 'Confirm change'}
        </button>
        <button
          onClick={onBack}
          disabled={isPending}
          className="w-full py-2.5 rounded-xl text-[13px] text-muted hover:text-navy transition-colors"
        >
          Back to offers
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function TripChangePage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  const { data: booking, isPending: bookingPending } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBookingById(bookingId!),
    enabled: !!bookingId,
  });

  const [departureDate, setDepartureDate] = useState('');
  const [sliceIndex, setSliceIndex] = useState(0);
  const [searchResult, setSearchResult] = useState<ChangeSearchResult | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<ChangeOffer | null>(null);

  const { mutate: search, isPending: searching, error: searchError } = useChangeSearch(bookingId);

  const slices = booking?.offerSnapshot?.slices ?? [];
  const hasReturn = slices.length > 1;

  function handleSearch() {
    if (!departureDate) return;
    setSearchResult(null);
    setSelectedOffer(null);
    search(
      { departureDate, sliceIndex },
      { onSuccess: setSearchResult },
    );
  }

  return (
    <MemberShell>
      <div className="max-w-lg space-y-5">
        {/* Back link */}
        <Link
          to={`/trips/${bookingId}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-navy transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to trip
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Change flight</h1>
          <p className="text-muted text-sm mt-0.5">Select a new date to see available flights</p>
        </div>

        {/* Current itinerary */}
        {!bookingPending && slices.length > 0 && (
          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-line bg-surface">
              <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">Current itinerary</p>
            </div>
            <div className="divide-y divide-line">
              {slices.map((s, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-navy">
                    <span>{s.origin}</span>
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" className="text-muted">
                      <path d="M1 7h12M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{s.destination}</span>
                  </div>
                  <p className="text-[12px] text-muted ml-1">{formatDateTime(s.departureAt)}</p>
                  <span className="ml-auto text-[11px] font-medium text-muted">
                    {hasReturn ? (i === 0 ? 'Outbound' : 'Return') : 'One way'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search form */}
        <div className="bg-white border border-line rounded-xl p-5 space-y-4">
          {hasReturn && (
            <div>
              <p className="text-[13px] font-semibold text-navy mb-2">Which flight to change?</p>
              <div className="flex gap-2">
                {slices.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setSliceIndex(i); setSearchResult(null); setSelectedOffer(null); }}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                      sliceIndex === i
                        ? 'bg-navy text-white'
                        : 'bg-surface border border-line text-navy hover:border-navy/30'
                    }`}
                  >
                    {i === 0 ? 'Outbound' : 'Return'}
                    <span className="block text-[10px] font-normal opacity-70 mt-0.5">
                      {s.origin} → {s.destination}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-navy mb-1.5">New departure date</label>
            <input
              type="date"
              value={departureDate}
              min={todayIso()}
              onChange={(e) => { setDepartureDate(e.target.value); setSearchResult(null); setSelectedOffer(null); }}
              className="w-full border border-line rounded-xl px-4 py-2.5 text-[14px] text-navy focus:outline-none focus:border-green transition-colors"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={!departureDate || searching}
            className="w-full py-2.5 rounded-xl text-[14px] font-semibold bg-navy text-white hover:bg-navy/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {searching ? 'Searching…' : 'Search flights'}
          </button>
        </div>

        {/* Search error */}
        {searchError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 space-y-2">
            <p className="text-[13px] font-semibold text-red-700">Cannot change online</p>
            <p className="text-[13px] text-red-600">
              {(searchError as { message?: string }).message ?? 'This booking cannot be changed online.'}
            </p>
            <a
              href={`https://wa.me/96500000000?text=${encodeURIComponent(`Hi, I need help changing booking ${booking?.bookingRef ?? bookingId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-green font-medium underline"
            >
              Contact us on WhatsApp
            </a>
          </div>
        )}

        {/* Offers list */}
        {searchResult && !selectedOffer && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-navy">
                Available flights ({searchResult.offers.length})
              </h2>
              <p className="text-[12px] text-muted">
                {searchResult.origin} → {searchResult.destination}
              </p>
            </div>

            {searchResult.offers.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-line rounded-xl">
                <p className="text-muted text-sm">No flights found for this date.</p>
                <p className="text-muted text-[12px] mt-1">Try a different date.</p>
              </div>
            ) : (
              searchResult.offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  selected={false}
                  onSelect={() => setSelectedOffer(offer)}
                />
              ))
            )}
          </div>
        )}

        {/* Review panel */}
        {selectedOffer && (
          <ReviewPanel
            offer={selectedOffer}
            bookingId={bookingId!}
            onBack={() => setSelectedOffer(null)}
          />
        )}
      </div>
    </MemberShell>
  );
}
