import { Link } from 'react-router-dom';
import { MemberShell } from '@/components/MemberShell.js';
import { useDashboard } from '@/features/dashboard/useDashboard.js';
import { useAuth } from '@/features/auth/useAuth.js';
import { formatPrice } from '@/lib/flightUtils.js';
import type { DashboardBooking } from '@/features/dashboard/dashboard.api.js';

const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  gold: 'Gold',
  platinum: 'Platinum',
  corporate: 'Corporate',
};

const TIER_STYLE: Record<string, string> = {
  free: 'bg-green-tint text-green',
  gold: 'bg-amber-50 text-amber-600',
  platinum: 'bg-indigo-50 text-indigo-600',
  corporate: 'bg-navy/10 text-navy',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short' });
}

function NextTripCard({ trip }: { trip: DashboardBooking }) {
  if (!trip.origin || !trip.destination) return null;

  return (
    <div className="bg-navy rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-white/60">Next trip</p>
          {trip.status === 'changed' && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
              Changed
            </span>
          )}
        </div>
        {trip.bookingRef && (
          <span className="text-[11px] font-mono text-white/50">{trip.bookingRef}</span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-3xl font-bold tracking-tight">{trip.origin}</p>
          {trip.departureAt && (
            <p className="text-[11px] text-white/60 mt-0.5">{formatShortDate(trip.departureAt)}</p>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-center gap-1">
            <div className="h-px flex-1 bg-white/20" />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/60 flex-shrink-0">
              <path d="M1 7h12M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="h-px flex-1 bg-white/20" />
          </div>
          {trip.airlineName && (
            <p className="text-[10px] text-white/50">{trip.airlineName}</p>
          )}
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold tracking-tight">{trip.destination}</p>
          {trip.arrivalAt && (
            <p className="text-[11px] text-white/60 mt-0.5">{formatShortDate(trip.arrivalAt)}</p>
          )}
        </div>
      </div>

      {trip.isReturn && (
        <p className="text-[12px] text-white/50 mb-4">Return flight</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">{formatPrice(trip.totalAmount, trip.currency)}</p>
        <Link
          to={`/trips/${trip.id}`}
          className="text-[13px] font-semibold px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
        >
          View details →
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-line rounded-xl p-4">
      <p className="text-[12px] text-muted font-medium">{label}</p>
      <p className="text-2xl font-bold text-navy mt-1 tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-green font-semibold mt-0.5">{sub}</p>}
    </div>
  );
}

function RecentTripRow({ booking }: { booking: DashboardBooking }) {
  return (
    <Link
      to={`/trips/${booking.id}`}
      className="flex items-center gap-4 px-4 py-3.5 hover:bg-surface rounded-xl transition-colors group"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        booking.status === 'cancelled' || booking.status === 'cancelling'
          ? 'bg-surface border border-line'
          : 'bg-green-tint'
      }`}>
        <span className={`text-[11px] font-bold ${
          booking.status === 'cancelled' || booking.status === 'cancelling' ? 'text-muted' : 'text-green'
        }`}>{booking.airlineCode ?? '??'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-navy">
          {booking.origin ?? '?'} → {booking.destination ?? '?'}
        </p>
        <p className="text-[12px] text-muted">
          {booking.departureAt ? formatDate(booking.departureAt) : '—'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[14px] font-semibold text-navy">{formatPrice(booking.totalAmount, booking.currency)}</p>
        {booking.status === 'cancelled' || booking.status === 'cancelling' ? (
          <p className="text-[11px] text-red-500 font-medium">
            {booking.status === 'cancelling' ? 'Cancelling' : 'Cancelled'}
          </p>
        ) : booking.status === 'changed' ? (
          <p className="text-[11px] text-blue-600 font-medium">Changed</p>
        ) : booking.memberDiscount > 0 ? (
          <p className="text-[11px] text-green">Saved {formatPrice(booking.memberDiscount, booking.currency)}</p>
        ) : null}
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted group-hover:text-navy transition-colors flex-shrink-0">
        <path d="M4 7h6M7.5 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function MemberStatusStrip({ tier, discountPercent, joinedAt }: { tier: string; discountPercent: number; joinedAt: string }) {
  return (
    <div className="bg-white border border-line rounded-xl p-4 flex flex-wrap items-center gap-3">
      <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${TIER_STYLE[tier] ?? TIER_STYLE.free}`}>
        {TIER_LABEL[tier] ?? 'Member'} member
      </span>
      {discountPercent > 0 && (
        <p className="text-[13px] text-muted">
          You save <span className="font-semibold text-green">{discountPercent}%</span> on every booking
        </p>
      )}
      <p className="text-[12px] text-muted ml-auto">Member since {formatDate(joinedAt)}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-7 bg-line rounded w-48" />
      <div className="h-44 bg-line rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-24 bg-line rounded-xl" />
        <div className="h-24 bg-line rounded-xl" />
        <div className="h-24 bg-line rounded-xl" />
      </div>
      <div className="h-40 bg-line rounded-xl" />
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isPending, error } = useDashboard();

  return (
    <MemberShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">
            {greeting()}{user ? `, ${user.firstName}` : ''} 👋
          </h1>
          <p className="text-muted text-sm mt-0.5">Welcome to your member dashboard</p>
        </div>

        {isPending && <DashboardSkeleton />}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
            {error.message}
          </div>
        )}

        {data && (
          <>
            {data.nextTrip ? (
              <NextTripCard trip={data.nextTrip} />
            ) : (
              <div className="bg-white border border-dashed border-line rounded-2xl px-6 py-8 text-center">
                <p className="text-3xl mb-2">✈️</p>
                <p className="font-semibold text-navy">No upcoming trips</p>
                <p className="text-muted text-sm mt-1 mb-4">Book your next adventure</p>
                <Link to="/" className="btn-primary text-sm px-5 py-2.5">
                  Search flights
                </Link>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total trips" value={String(data.stats.totalTrips)} />
              <StatCard
                label="Total saved"
                value={data.stats.totalSavedAmount > 0 ? formatPrice(data.stats.totalSavedAmount, 'KWD') : '—'}
                sub={data.stats.totalSavedAmount > 0 ? 'member discount' : undefined}
              />
              <StatCard label="Upcoming" value={String(data.stats.upcomingCount)} />
            </div>

            {data.recentTrips.length > 0 && (
              <div className="bg-white border border-line rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-navy">Recent trips</h2>
                  <Link to="/trips" className="text-[13px] text-green font-medium hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-line">
                  {data.recentTrips.map((b) => (
                    <RecentTripRow key={b.id} booking={b} />
                  ))}
                </div>
              </div>
            )}

            <MemberStatusStrip
              tier={data.member.tier}
              discountPercent={data.member.discountPercent}
              joinedAt={data.member.joinedAt}
            />
          </>
        )}
      </div>
    </MemberShell>
  );
}
