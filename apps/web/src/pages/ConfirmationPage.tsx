import { useParams, useLocation, Link } from 'react-router-dom';
import type { BookingConfirmation } from '@travanora/shared';
import { useBooking } from '@/features/bookings/useBooking.js';
import type { BookingDetail, BookingPassenger } from '@/features/bookings/booking.api.js';
import { formatPrice, formatDuration } from '@/lib/flightUtils.js';
import { useAuthStore } from '@/features/auth/auth.store.js';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDob(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TITLE_LABEL: Record<string, string> = { mr: 'Mr', ms: 'Ms', mrs: 'Mrs', miss: 'Miss', dr: 'Dr' };

// ── Shared sub-components ────────────────────────────────────────────────────

function SliceRow({
  origin, originName, destination, destinationName,
  departureAt, arrivalAt, durationMinutes, stops, label,
}: {
  origin: string; originName?: string; destination: string; destinationName?: string;
  departureAt: string; arrivalAt: string; durationMinutes?: number; stops?: number; label?: string;
}) {
  return (
    <div>
      {label && <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">{label}</p>}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xl font-bold text-navy">{formatTime(departureAt)}</p>
          <p className="text-[13px] font-semibold text-navy">{originName ?? origin}</p>
          <p className="text-[11px] text-muted">{origin}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          {durationMinutes != null && (
            <p className="text-[11px] text-muted">{formatDuration(durationMinutes)}</p>
          )}
          <div className="w-full h-px bg-line my-1" />
          {stops != null && (
            <p className="text-[11px] text-muted">
              {stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-navy">{formatTime(arrivalAt)}</p>
          <p className="text-[13px] font-semibold text-navy">{destinationName ?? destination}</p>
          <p className="text-[11px] text-muted">{destination}</p>
        </div>
      </div>
      <p className="text-[12px] text-muted mt-2">{formatDate(departureAt)}</p>
    </div>
  );
}

function PassengerCard({ passenger, index, total }: { passenger: BookingPassenger; index: number; total: number }) {
  return (
    <div className="space-y-1.5">
      {total > 1 && (
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Passenger {index + 1}</p>
      )}
      <p className="text-[15px] font-semibold text-navy">
        {TITLE_LABEL[passenger.title] ?? passenger.title} {passenger.given_name} {passenger.family_name}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        <span>DOB: {formatDob(passenger.born_on)}</span>
        <span>{passenger.email}</span>
        <span>{passenger.phone_number}</span>
      </div>
    </div>
  );
}

// ── View built from a fresh BookingConfirmation (just booked) ─────────────────

function ConfirmationFromState({ confirmation }: { confirmation: BookingConfirmation }) {
  const { offer, passengers, totalAmount, currency } = confirmation;
  const isReturn = offer.slices.length > 1;

  return (
    <ConfirmationShell bookingRef={confirmation.bookingRef} status="confirmed">
      {/* Flights */}
      <Section title="Flight details">
        {offer.slices.map((slice, i) => (
          <div key={i}>
            {i > 0 && <div className="border-t border-line/60 my-4" />}
            <SliceRow
              origin={slice.origin}
              originName={slice.originName}
              destination={slice.destination}
              destinationName={slice.destinationName}
              departureAt={slice.departureAt}
              arrivalAt={slice.arrivalAt}
              durationMinutes={slice.durationMinutes}
              stops={slice.stops}
              label={isReturn ? (i === 0 ? 'Outbound' : 'Return') : undefined}
            />
          </div>
        ))}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-green">{offer.airlineCode}</span>
          </div>
          <span className="text-[13px] text-muted">{offer.airlineName}</span>
          <span className="ml-auto text-[12px] text-muted capitalize">{offer.cabinClass.replace('_', ' ')}</span>
        </div>
      </Section>

      {/* Passengers */}
      <Section title={`Passenger${passengers.length > 1 ? 's' : ''}`}>
        <div className="space-y-4">
          {passengers.map((p, i) => (
            <div key={i}>
              {i > 0 && <div className="border-t border-line/60 pt-4" />}
              <PassengerCard passenger={p} index={i} total={passengers.length} />
            </div>
          ))}
        </div>
      </Section>

      {/* Price */}
      <PriceSummary totalAmount={totalAmount} currency={currency} />
    </ConfirmationShell>
  );
}

// ── View built from a fetched BookingDetail (from My Bookings) ────────────────

function ConfirmationFromDetail({ detail }: { detail: BookingDetail }) {
  const { sliceSummary, passengers, totalAmount, publicPrice, memberDiscount, discountPercent, currency, status, paidAt } = detail;
  const isReturn = sliceSummary.length > 1;

  return (
    <ConfirmationShell bookingRef={detail.bookingRef} status={status}>
      {/* Flights */}
      <Section title="Flight details">
        {sliceSummary.map((slice, i) => (
          <div key={i}>
            {i > 0 && <div className="border-t border-line/60 my-4" />}
            <SliceRow
              origin={slice.origin}
              destination={slice.destination}
              departureAt={slice.departureAt}
              arrivalAt={slice.arrivalAt}
              label={isReturn ? (i === 0 ? 'Outbound' : 'Return') : undefined}
            />
          </div>
        ))}
        {sliceSummary[0] && (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-green">{sliceSummary[0].airlineCode}</span>
            </div>
            <span className="text-[13px] text-muted">{sliceSummary[0].airlineName}</span>
          </div>
        )}
      </Section>

      {/* Passengers */}
      <Section title={`Passenger${passengers.length > 1 ? 's' : ''}`}>
        <div className="space-y-4">
          {passengers.map((p, i) => (
            <div key={i}>
              {i > 0 && <div className="border-t border-line/60 pt-4" />}
              <PassengerCard passenger={p} index={i} total={passengers.length} />
            </div>
          ))}
        </div>
      </Section>

      {/* Price */}
      <PriceSummary
        totalAmount={totalAmount}
        publicPrice={publicPrice}
        memberDiscount={memberDiscount}
        discountPercent={discountPercent}
        currency={currency}
        paidAt={paidAt}
      />
    </ConfirmationShell>
  );
}

// ── Shared layout pieces ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-3">{title}</p>
      {children}
    </div>
  );
}

function PriceSummary({
  totalAmount,
  publicPrice,
  memberDiscount,
  discountPercent,
  currency,
  paidAt,
}: {
  totalAmount: number;
  publicPrice?: number;
  memberDiscount?: number;
  discountPercent?: number;
  currency: string;
  paidAt?: string;
}) {
  const hasMemberDiscount = (discountPercent ?? 0) > 0 && (memberDiscount ?? 0) > 0;

  return (
    <div className="border-t border-line pt-4 space-y-2 text-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-3">Payment</p>

      {hasMemberDiscount && publicPrice != null && (
        <>
          <div className="flex justify-between">
            <span className="text-muted">Base fare</span>
            <span className="text-navy line-through opacity-60">{formatPrice(publicPrice, currency)}</span>
          </div>
          <div className="flex justify-between text-green">
            <span>Member discount ({discountPercent}%)</span>
            <span>−{formatPrice(memberDiscount!, currency)}</span>
          </div>
        </>
      )}

      <div className="flex justify-between items-baseline pt-1 border-t border-line/60">
        <span className="font-semibold text-navy">Total paid</span>
        <span className="text-xl font-bold text-navy">{formatPrice(totalAmount, currency)}</span>
      </div>

      {paidAt && (
        <div className="flex justify-between text-muted">
          <span>Payment date</span>
          <span>{new Date(paidAt).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        </div>
      )}

      <div className="flex justify-between text-muted">
        <span>Payment method</span>
        <span>Card</span>
      </div>
    </div>
  );
}

function ConfirmationShell({
  bookingRef, status, children,
}: {
  bookingRef: string; status: string; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-green-tint/30">
      <header className="bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link to="/" className="font-serif italic text-xl font-bold text-navy tracking-tight">Travanora</Link>
        <span className="text-[12px] text-muted">Booking details</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Banner */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            status === 'confirmed'
              ? 'bg-green/10 border-2 border-green'
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            {status === 'confirmed' ? (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M5 14l6 6L23 8" stroke="#00b67a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M8 8l12 12M20 8L8 20" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-navy">
            {status === 'confirmed' ? 'Booking confirmed!' : 'Booking cancelled'}
          </h1>
          <p className="text-muted mt-1 text-sm">Booking reference</p>
          <p className="text-3xl font-bold text-green tracking-widest mt-1">{bookingRef}</p>
        </div>

        <div className="bg-white border border-line rounded-card p-6 space-y-6">
          {children}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Link to="/me/bookings" className="btn-ghost text-sm px-5 py-2.5">My bookings</Link>
          <Link to="/" className="btn-primary text-sm px-6 py-2.5">Search more flights</Link>
        </div>
      </div>
    </div>
  );
}

// ── Page entry point ──────────────────────────────────────────────────────────

export function ConfirmationPage() {
  const { bookingRef } = useParams<{ bookingRef: string }>();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const stateConfirmation = (location.state as { confirmation?: BookingConfirmation } | null)?.confirmation;

  // Only fetch from API when there's no navigation state (e.g., arriving from My Bookings)
  const { data: fetched, isPending, error } = useBooking(
    !stateConfirmation && isAuthenticated ? (bookingRef ?? '') : '',
  );

  if (stateConfirmation) {
    return <ConfirmationFromState confirmation={stateConfirmation} />;
  }

  if (isPending) {
    return (
      <ConfirmationShell bookingRef={bookingRef ?? ''} status="confirmed">
        <div className="flex items-center justify-center gap-3 py-8">
          {[0, 150, 300].map((d) => (
            <span key={d} className="w-2.5 h-2.5 rounded-full bg-green animate-pulse-green" style={{ animationDelay: `${d}ms` }} />
          ))}
          <span className="text-muted text-sm ml-2">Loading booking…</span>
        </div>
      </ConfirmationShell>
    );
  }

  if (error || !fetched) {
    return (
      <ConfirmationShell bookingRef={bookingRef ?? ''} status="confirmed">
        <p className="text-sm text-muted text-center py-6">
          {error?.message ?? 'Booking details not available.'}
        </p>
      </ConfirmationShell>
    );
  }

  return <ConfirmationFromDetail detail={fetched} />;
}
