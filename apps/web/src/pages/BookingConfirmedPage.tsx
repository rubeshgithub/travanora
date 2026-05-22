import { useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchBookingById } from '@/features/bookings/booking.api.js';
import { formatPrice, formatDuration } from '@/lib/flightUtils.js';
import { Logo } from '@/components/Logo.js';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Main page ──────────────────────────────────────────────────────────────────

const POLL_TIMEOUT_MS = 60_000; // stop polling after 60 s

export function BookingConfirmedPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const mountedAt = useRef(Date.now());
  const prevStatus = useRef<string | undefined>(undefined);

  const { data: booking, isPending, error, refetch } = useQuery({
    queryKey: ['booking-confirmed', bookingId],
    queryFn: () => fetchBookingById(bookingId!),
    enabled: !!bookingId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  // Toast once when booking reaches confirmed — works whether the webhook
  // fired before we landed or while we were polling on this page.
  useEffect(() => {
    if (booking?.status === 'confirmed') {
      const key = `booking-toast-${bookingId}`;
      if (!sessionStorage.getItem(key)) {
        toast.success('Your booking is confirmed!', { duration: 6000 });
        sessionStorage.setItem(key, '1');
      }
    }
    prevStatus.current = booking?.status;
  }, [booking?.status, bookingId]);

  // Poll every 2 s while pending, stop after 60 s timeout
  useEffect(() => {
    if (!bookingId || booking?.status !== 'pending_payment') return;

    const intervalId = setInterval(() => {
      if (Date.now() - mountedAt.current > POLL_TIMEOUT_MS) {
        clearInterval(intervalId);
        return;
      }
      refetch();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [bookingId, booking?.status, refetch]);

  if (isPending) return <Shell><LoadingDots text="Loading your booking…" /></Shell>;
  if (error || !booking) {
    return (
      <Shell>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-3xl mb-3">✈️</p>
          <h3 className="font-semibold text-navy mb-1">Could not load your booking</h3>
          <p className="text-muted text-sm mb-4">{error?.message ?? 'Booking not found'}</p>
          <Link to="/" className="btn-primary text-sm px-5 py-2">Back to search</Link>
        </div>
      </Shell>
    );
  }

  // Redirect if the booking flow was skipped entirely
  if (booking.status === 'draft') {
    navigate(`/book/${booking.duffelOfferId}`, { replace: true });
    return null;
  }

  // Processing state — webhook hasn't fired yet (or timed out)
  if (booking.status === 'pending_payment') {
    const timedOut = Date.now() - mountedAt.current > POLL_TIMEOUT_MS;
    return (
      <Shell>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          {timedOut ? (
            <>
              <p className="text-3xl mb-4">⏳</p>
              <h3 className="font-semibold text-navy mb-2">Still processing…</h3>
              <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
                Your payment was received but the booking is taking longer than usual to confirm.
                Check back in a moment — your booking reference will appear in{' '}
                <Link to="/me/bookings" className="text-navy font-medium underline">My Bookings</Link> once ready.
              </p>
              <button
                type="button"
                onClick={() => { mountedAt.current = Date.now(); refetch(); }}
                className="btn-primary text-sm px-5 py-2"
              >
                Check again
              </button>
            </>
          ) : (
            <>
              <LoadingDots text="Processing your payment…" />
              <p className="text-muted text-sm mt-4">
                This usually takes a few seconds. Please don&apos;t close this page.
              </p>
            </>
          )}
        </div>
      </Shell>
    );
  }

  // Booking failed after payment
  if (booking.status === 'payment_succeeded_booking_failed') {
    return (
      <Shell>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">Payment received, but booking failed</h2>
          <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
            Your payment was processed successfully, but we couldn&apos;t confirm your flight reservation.
            Our team has been notified and will contact you shortly. Your reference: <span className="font-mono font-semibold text-navy">#{String(booking.id).slice(-8).toUpperCase()}</span>
          </p>
          <a href={`mailto:support@travanora.com?subject=Booking%20Failed%20${String(booking.id).slice(-8)}`} className="btn-primary text-sm px-5 py-2">
            Contact support
          </a>
        </div>
      </Shell>
    );
  }

  const snapshot = booking.offerSnapshot;
  const isMember = booking.discountPercent > 0 && booking.memberDiscount > 0;

  return (
    <Shell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* ── Success banner ─────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-tint border border-green/20 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14l6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green" style={{ stroke: 'var(--color-green, #22c55e)' }} />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Booking confirmed!</h1>
          <p className="text-muted text-sm mt-1">A confirmation email has been sent to <span className="font-medium text-navy">{booking.contactEmail ?? booking.passengers[0]?.email}</span></p>
        </div>

        {/* ── Booking reference ───────────────────────────────────────────── */}
        <div className="bg-green-tint/50 border border-green/20 rounded-card p-5 text-center mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">Booking Reference</p>
          <p className="text-3xl font-black text-navy tracking-widest font-mono">{booking.bookingRef}</p>
        </div>

        {/* ── Flight details ─────────────────────────────────────────────── */}
        {snapshot && (
          <div className="bg-white border border-line rounded-card p-5 mb-5">
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

        {/* ── Price summary ──────────────────────────────────────────────── */}
        <div className="bg-white border border-line rounded-card p-5 mb-5">
          <p className="text-[12px] font-bold uppercase tracking-wide text-muted mb-3">Payment summary</p>
          <div className="space-y-2 text-[13px]">
            {isMember && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted">Original price</span>
                  <span className="text-navy line-through opacity-60">{formatPrice(booking.publicPrice, booking.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green font-medium">Member discount ({booking.discountPercent}%)</span>
                  <span className="text-green font-medium">−{formatPrice(booking.memberDiscount, booking.currency)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-semibold text-[15px] pt-1 border-t border-line/60">
              <span className="text-navy">Total paid</span>
              <span className="text-navy">{formatPrice(booking.totalAmount, booking.currency)}</span>
            </div>
          </div>
        </div>

        {/* ── Passengers ────────────────────────────────────────────────── */}
        {booking.passengers.length > 0 && (
          <div className="bg-white border border-line rounded-card p-5 mb-5">
            <p className="text-[12px] font-bold uppercase tracking-wide text-muted mb-3">
              {booking.passengers.length === 1 ? 'Passenger' : `Passengers (${booking.passengers.length})`}
            </p>
            <div className="space-y-2">
              {booking.passengers.map((pax, i) => (
                <div key={i} className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-navy capitalize">
                    {pax.title}. {pax.firstName} {pax.lastName}
                  </span>
                  <span className="text-muted capitalize">{pax.type ?? 'adult'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/me/bookings" className="btn-ghost flex-1 py-3 text-[14px] text-center">
            View all bookings
          </Link>
          <Link to="/" className="btn-primary flex-1 py-3 text-[14px] text-center">
            Search more flights
          </Link>
        </div>
      </div>
    </Shell>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-bold text-navy tracking-tighter">Travanora</span>
        </Link>
      </header>
      {children}
    </div>
  );
}

function LoadingDots({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10">
      {[0, 150, 300].map((d) => (
        <span key={d} className="w-2.5 h-2.5 rounded-full bg-green animate-pulse-green" style={{ animationDelay: `${d}ms` }} />
      ))}
      <span className="text-muted text-sm ml-2">{text}</span>
    </div>
  );
}
