import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MemberShell } from '@/components/MemberShell.js';
import { useMyBookings } from '@/features/bookings/useMyBookings.js';
import { formatPrice } from '@/lib/flightUtils.js';
import type { MyBooking } from '@/features/bookings/booking.api.js';

type Tab = 'upcoming' | 'past' | 'all';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isUpcoming(booking: MyBooking) {
  const dep = booking.sliceSummary[0]?.departureAt;
  if (!dep) return false;
  return new Date(dep) > new Date();
}

const STATUS_STYLE: Record<string, string> = {
  confirmed:          'bg-green-tint text-green',
  changed:            'bg-blue-50 text-blue-600',
  cancelling:         'bg-amber-50 text-amber-600',
  cancelled:          'bg-red-50 text-red-500',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed:  'Confirmed',
  changed:    'Changed',
  cancelling: 'Cancelling',
  cancelled:  'Cancelled',
};

function TripCard({ booking }: { booking: MyBooking }) {
  const outbound = booking.sliceSummary[0];
  const inbound = booking.sliceSummary[1];
  const upcoming = isUpcoming(booking);
  const isCancelled = booking.status === 'cancelled' || booking.status === 'cancelling';

  return (
    <article className={`bg-white border rounded-card p-5 hover:shadow-card-hover transition-shadow duration-200 ${isCancelled ? 'border-line opacity-75' : 'border-line'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isCancelled ? 'bg-surface border border-line' : 'bg-green-tint border border-green/20'}`}>
              <span className={`text-[11px] font-bold ${isCancelled ? 'text-muted' : 'text-green'}`}>{outbound?.airlineCode ?? '??'}</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-navy">{outbound?.airlineName ?? 'Unknown airline'}</p>
              <p className="text-[11px] text-muted">{inbound ? 'Return' : 'One way'}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {upcoming && !isCancelled && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  Upcoming
                </span>
              )}
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[booking.status] ?? 'bg-surface text-muted'}`}>
                {STATUS_LABEL[booking.status] ?? booking.status}
              </span>
            </div>
          </div>

          {outbound && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-navy">{outbound.origin}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted">
                <path d="M1 7h12M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-bold text-navy">{outbound.destination}</span>
              <span className="text-muted">·</span>
              <span className="text-muted">{formatDate(outbound.departureAt)}</span>
            </div>
          )}
          {inbound && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-navy">{inbound.origin}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted">
                <path d="M1 7h12M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-bold text-navy">{inbound.destination}</span>
              <span className="text-muted">·</span>
              <span className="text-muted">{formatDate(inbound.departureAt)}</span>
            </div>
          )}

          {booking.bookingRef && (
            <p className="text-[12px] text-muted">
              Ref: <span className="font-mono font-semibold text-navy tracking-wide">{booking.bookingRef}</span>
            </p>
          )}
        </div>

        <div className="sm:text-right flex sm:flex-col flex-row items-center sm:items-end justify-between gap-3 flex-shrink-0">
          <div>
            <p className="text-xl font-bold text-navy">{formatPrice(booking.totalAmount, booking.currency)}</p>
            {booking.savings > 0 && (
              <p className="text-[12px] text-green font-medium">
                Saved {formatPrice(booking.savings, booking.currency)}
              </p>
            )}
          </div>
          <Link
            to={`/trips/${booking.id}`}
            className="btn-ghost text-[13px] px-4 py-2 flex-shrink-0"
          >
            View →
          </Link>
        </div>
      </div>
    </article>
  );
}

function TripsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-line rounded-card p-5 animate-pulse">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-lg bg-line flex-shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 bg-line rounded w-40" />
              <div className="h-3 bg-line rounded w-56" />
              <div className="h-3 bg-line rounded w-32" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-5 bg-line rounded w-20" />
              <div className="h-8 bg-line rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TripsPage() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const { data: bookings, isPending, error } = useMyBookings();

  const ACTIVE_STATUSES = ['confirmed', 'cancelling', 'changed', 'cancelled'];
  const all = (bookings ?? []).filter((b) => ACTIVE_STATUSES.includes(b.status));
  const activeOnly = all.filter((b) => b.status !== 'cancelled' && b.status !== 'cancelling');
  const filtered =
    tab === 'upcoming' ? activeOnly.filter(isUpcoming) :
    tab === 'past'     ? activeOnly.filter((b) => !isUpcoming(b)) :
                         all;

  return (
    <MemberShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">My Trips</h1>
          <p className="text-muted text-sm mt-0.5">All your flights</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface border border-line rounded-xl w-fit">
          {(['upcoming', 'past', 'all'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold capitalize transition-colors duration-150 ${
                tab === t
                  ? 'bg-white text-navy shadow-sm border border-line'
                  : 'text-muted hover:text-navy'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isPending && <TripsLoadingSkeleton />}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
            {error.message}
          </div>
        )}

        {!isPending && !error && filtered.length === 0 && (
          <div className="text-center py-16 border border-dashed border-line rounded-card">
            <p className="text-3xl mb-3">✈️</p>
            <h3 className="font-semibold text-navy">
              {tab === 'upcoming' ? 'No upcoming trips' : tab === 'past' ? 'No past trips' : 'No bookings yet'}
            </h3>
            <p className="text-muted text-sm mt-1 mb-5">
              {tab === 'upcoming' ? 'Time to plan your next adventure!' : 'Your travel history will appear here.'}
            </p>
            {tab !== 'past' && (
              <Link to="/" className="btn-primary text-sm px-6 py-2.5">
                Search flights
              </Link>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((b) => (
              <TripCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </MemberShell>
  );
}
