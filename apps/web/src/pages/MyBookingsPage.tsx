import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store.js';
import { useMyBookings } from '@/features/bookings/useMyBookings.js';
import { formatPrice } from '@/lib/flightUtils.js';
import type { MyBooking, MyBookingSlice } from '@/features/bookings/booking.api.js';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatBookedOn(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RouteTag({ slice }: { slice: MyBookingSlice }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-bold text-navy">{slice.origin}</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted flex-shrink-0">
        <path d="M1 7h12M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-bold text-navy">{slice.destination}</span>
      <span className="text-muted">·</span>
      <span className="text-muted">{formatDate(slice.departureAt)}</span>
      <span className="text-muted">·</span>
      <span className="text-muted">{formatTime(slice.departureAt)}</span>
    </div>
  );
}

function BookingCard({ booking }: { booking: MyBooking }) {
  const outbound = booking.sliceSummary[0];
  const inbound = booking.sliceSummary[1];
  const isReturn = !!inbound;

  return (
    <article className="bg-white border border-line rounded-card p-5 hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Left: route + airline */}
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-green">{outbound?.airlineCode ?? '??'}</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-navy">{outbound?.airlineName ?? 'Unknown airline'}</p>
              <p className="text-[11px] text-muted">{isReturn ? 'Return flight' : 'One way'}</p>
            </div>
            <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              booking.status === 'confirmed'
                ? 'bg-green-tint text-green'
                : booking.status === 'payment_succeeded_booking_failed'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-red-50 text-red-500'
            }`}>
              {booking.status === 'confirmed'
                ? 'Confirmed'
                : booking.status === 'payment_succeeded_booking_failed'
                ? 'Action needed'
                : 'Cancelled'}
            </span>
          </div>

          {outbound && <RouteTag slice={outbound} />}
          {inbound && <RouteTag slice={inbound} />}

          <p className="text-[12px] text-muted">
            {booking.bookingRef
              ? <>Ref: <span className="font-mono font-semibold text-navy tracking-wide">{booking.bookingRef}</span><span className="mx-1.5">·</span></>
              : null}
            Booked {formatBookedOn(booking.createdAt)}
          </p>

          {booking.status === 'payment_succeeded_booking_failed' && (
            <p className="text-[12px] text-amber-600 bg-amber-50 rounded px-2 py-1">
              Payment received but booking failed — please contact support.
            </p>
          )}
        </div>

        {/* Right: price + action */}
        <div className="sm:text-right flex sm:flex-col flex-row items-center sm:items-end justify-between gap-3 sm:gap-1 flex-shrink-0">
          <div>
            <p className="text-xl font-bold text-navy leading-tight">
              {formatPrice(booking.totalAmount, booking.currency)}
            </p>
            {booking.savings > 0 && (
              <p className="text-[12px] text-green font-medium mt-0.5">
                Saved {formatPrice(booking.savings, booking.currency)}
              </p>
            )}
          </div>
          {booking.bookingRef && (
            <Link
              to={`/booking/${booking.bookingRef}`}
              className="btn-ghost text-[13px] px-4 py-2 flex-shrink-0"
            >
              View details →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function MyBookingsPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: bookings, isPending, error } = useMyBookings();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-navy tracking-tight">My Bookings</h1>
        <p className="text-muted text-sm mt-1">Your confirmed and past flights</p>
      </div>

      {isPending && <LoadingSkeleton />}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
          {error.message}
        </div>
      )}

      {!isPending && !error && bookings && bookings.length === 0 && (
        <EmptyState />
      )}

      {bookings && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-line rounded-card p-5 animate-pulse">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-lg bg-line flex-shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 bg-line rounded w-40" />
              <div className="h-3 bg-line rounded w-64" />
              <div className="h-3 bg-line rounded w-48" />
              <div className="h-3 bg-line rounded w-32" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-5 bg-line rounded w-20" />
              <div className="h-3 bg-line rounded w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 border border-dashed border-line rounded-card">
      <p className="text-4xl mb-4">✈️</p>
      <h3 className="font-semibold text-navy text-lg">No bookings yet</h3>
      <p className="text-muted text-sm mt-1 mb-5">Book your first flight to see it here.</p>
      <Link to="/" className="btn-primary text-sm px-6 py-2.5">
        Search flights
      </Link>
    </div>
  );
}
