import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBookingById } from '@/features/bookings/useBookingById.js';
import { formatPrice, formatDuration } from '@/lib/flightUtils.js';
import { BookingSidebar } from '@/components/BookingSidebar.js';
import { Logo } from '@/components/Logo.js';
import { COUNTRIES } from '@/lib/countries.js';

function countryName(code?: string) {
  if (!code) return '';
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function BookingReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const { data: booking, isPending, error } = useBookingById(bookingId);

  if (isPending) return <Shell><LoadingDots /></Shell>;
  if (error || !booking) return <Shell><ErrorBlock message={error?.message ?? 'Booking not found'} /></Shell>;

  const snapshot = booking.offerSnapshot;
  const isMember = booking.discountPercent > 0 && booking.memberDiscount > 0;

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button
          type="button"
          onClick={() =>
            navigate(
              booking.duffelOfferId ? `/book/${booking.duffelOfferId}` : '/',
              { state: { draftId: bookingId } },
            )
          }
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy mb-6"
        >
          <ChevronLeft />
          Edit passengers
        </button>

        <StepIndicator current={2} />

        <div className="flex flex-col lg:flex-row gap-6 items-start mt-6">
          {/* ── Left: review details ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Flight details */}
            {snapshot && (
              <div className="bg-white border border-line rounded-card p-5">
                <p className="text-[12px] font-bold uppercase tracking-wide text-muted mb-4">Flight details</p>
                {snapshot.slices.map((slice, i) => (
                  <div key={i}>
                    {i > 0 && <div className="border-t border-line/60 my-4" />}
                    {snapshot.slices.length > 1 && (
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">
                        {i === 0 ? 'Outbound' : 'Return'}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xl font-bold text-navy">{formatTime(slice.departureAt)}</p>
                        <p className="text-[13px] font-semibold text-navy">{slice.originName ?? slice.origin}</p>
                        <p className="text-[11px] text-muted">{slice.origin}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        {slice.durationMinutes != null && (
                          <p className="text-[11px] text-muted">{formatDuration(slice.durationMinutes)}</p>
                        )}
                        <div className="w-full h-px bg-line my-1" />
                        <p className="text-[11px] text-muted">
                          {(slice.stops ?? 0) === 0 ? 'Nonstop' : `${slice.stops} stop${(slice.stops ?? 0) > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-navy">{formatTime(slice.arrivalAt)}</p>
                        <p className="text-[13px] font-semibold text-navy">{slice.destinationName ?? slice.destination}</p>
                        <p className="text-[11px] text-muted">{slice.destination}</p>
                      </div>
                    </div>
                    <p className="text-[12px] text-muted mt-2">{formatDateLong(slice.departureAt)}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line/60">
                  <div className="w-7 h-7 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-green">{snapshot.airlineCode}</span>
                  </div>
                  <span className="text-[13px] text-muted">{snapshot.airline}</span>
                  <span className="ml-auto text-[12px] text-muted capitalize">{snapshot.cabinClass.replace('_', ' ')}</span>
                </div>
              </div>
            )}

            {/* Passenger review */}
            <div className="bg-white border border-line rounded-card p-5">
              <p className="text-[12px] font-bold uppercase tracking-wide text-muted mb-4">
                {booking.passengers.length === 1 ? 'Passenger' : `Passengers (${booking.passengers.length})`}
              </p>
              <div className="space-y-4">
                {booking.passengers.map((pax, i) => (
                  <div key={i} className={`${i > 0 ? 'border-t border-line/60 pt-4' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-navy capitalize">
                          {pax.title}. {pax.firstName} {pax.lastName}
                        </p>
                        <p className="text-[13px] text-muted mt-0.5 capitalize">{pax.type ?? 'adult'}</p>
                      </div>
                      <span className="text-[11px] font-medium text-muted uppercase tracking-wide">
                        {pax.gender === 'm' ? 'Male' : 'Female'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                      {pax.dob && (
                        <InfoRow label="Date of birth" value={formatDateLong(pax.dob)} />
                      )}
                      {pax.nationality && (
                        <InfoRow label="Nationality" value={countryName(pax.nationality)} />
                      )}
                      <InfoRow label="Email" value={pax.email} />
                      {pax.phone && (
                        <InfoRow label="Phone" value={`${pax.phone.countryCode} ${pax.phone.number}`} />
                      )}
                      {pax.passportNumber && (
                        <InfoRow label="Passport" value={pax.passportNumber} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important note */}
            <div className="rounded-lg bg-green-tint/60 border border-green/20 px-4 py-3 text-[13px] text-navy">
              <p className="font-semibold mb-1">Before you pay</p>
              <ul className="space-y-1 text-muted list-disc list-inside">
                <li>All names must exactly match the passport or travel document</li>
                <li>Payment is processed securely via Stripe</li>
                <li>You&apos;ll receive a booking confirmation by email once payment is complete</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    booking.duffelOfferId ? `/book/${booking.duffelOfferId}` : '/',
                    { state: { draftId: bookingId } },
                  )
                }
                className="btn-ghost flex-1 py-3.5 text-[15px]"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <ChevronLeft />
                  Edit passengers
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate(`/book/${bookingId}/payment`)}
                className="btn-primary flex-1 py-3.5 text-[15px]"
              >
                Proceed to payment · {formatPrice(booking.totalAmount, booking.currency)}
              </button>
            </div>
          </div>

          {/* ── Right: sidebar ─────────────────────────────────────────────── */}
          <div className="lg:w-72 flex-shrink-0 w-full">
            {snapshot ? (
              <BookingSidebar
                slices={snapshot.slices}
                airline={snapshot.airline}
                airlineCode={snapshot.airlineCode}
                cabinClass={snapshot.cabinClass}
                publicPrice={booking.publicPrice}
                memberDiscount={booking.memberDiscount}
                totalAmount={booking.totalAmount}
                currency={booking.currency}
                discountPercent={booking.discountPercent}
                passengerCount={booking.passengers.length}
                expiresAt={booking.duffelOfferExpiresAt}
              />
            ) : (
              <div className="sticky top-20 bg-white border border-line rounded-card p-5">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-navy">Total</span>
                  <span className="text-2xl font-bold text-navy">{formatPrice(booking.totalAmount, booking.currency)}</span>
                </div>
                {isMember && (
                  <p className="text-[12px] text-green mt-2 text-center">
                    Includes member discount
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted">{label}:</span>{' '}
      <span className="text-navy font-medium">{value}</span>
    </div>
  );
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Passengers' },
    { n: 2, label: 'Review' },
    { n: 3, label: 'Payment' },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = step.n < current;
        const active = step.n === current;
        return (
          <div key={step.n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${
                  done
                    ? 'bg-green text-amber-ink'
                    : active
                    ? 'bg-navy text-white'
                    : 'bg-line text-muted'
                }`}
              >
                {done ? '✓' : step.n}
              </div>
              <span
                className={`text-[13px] font-medium hidden sm:inline ${
                  active ? 'text-navy' : done ? 'text-green' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-3 h-px w-8 sm:w-12 ${done ? 'bg-green' : 'bg-line'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-bold text-navy tracking-tighter">Travanora</span>
        </Link>
        <span className="text-[12px] text-muted">· Secure checkout</span>
      </header>
      {children}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-3">
      {[0, 150, 300].map((d) => (
        <span key={d} className="w-2.5 h-2.5 rounded-full bg-green animate-pulse-green" style={{ animationDelay: `${d}ms` }} />
      ))}
      <span className="text-muted text-sm ml-2">Loading booking…</span>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
      <p className="text-3xl mb-3">✈️</p>
      <h3 className="font-semibold text-navy mb-1">Could not load your booking</h3>
      <p className="text-muted text-sm mb-4">{message}</p>
      <Link to="/" className="btn-primary text-sm px-5 py-2">Back to search</Link>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
