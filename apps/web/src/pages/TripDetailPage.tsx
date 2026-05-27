import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MemberShell } from '@/components/MemberShell.js';
import { fetchBookingById, type BookingSliceV2 } from '@/features/bookings/booking.api.js';
import { useConditions, useRefundLedger } from '@/features/trips/useTrips.js';
import { formatPrice } from '@/lib/flightUtils.js';
import type { TripConditions, RefundLedgerEntry } from '@/features/trips/trips.api.js';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-KW', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Slice card ─────────────────────────────────────────────────────────────────

function SliceCard({ slice, label }: { slice: BookingSliceV2; label?: string }) {
  return (
    <div className="border border-line rounded-xl overflow-hidden">
      {label && (
        <div className="px-4 py-2.5 bg-surface border-b border-line">
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">{label}</p>
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-navy tracking-tight">{slice.origin}</p>
            <p className="text-[11px] text-muted">{formatDateTime(slice.departureAt)}</p>
          </div>
          <div className="flex-1 text-center">
            <div className="flex items-center gap-1">
              <div className="h-px flex-1 bg-line" />
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-muted">
                <path d="M1 7h12M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="h-px flex-1 bg-line" />
            </div>
            {slice.durationMinutes && (
              <p className="text-[11px] text-muted mt-0.5">
                {Math.floor(slice.durationMinutes / 60)}h {slice.durationMinutes % 60}m
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-navy tracking-tight">{slice.destination}</p>
            <p className="text-[11px] text-muted">{formatDateTime(slice.arrivalAt)}</p>
          </div>
        </div>

        {slice.segments && slice.segments.length > 0 && (
          <div className="space-y-2 pt-1">
            {slice.segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-3 text-[13px]">
                <div className="w-7 h-7 rounded-lg bg-green-tint flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-green">{seg.airlineCode}</span>
                </div>
                <p className="font-semibold text-navy">{seg.flightNumber}</p>
                <p className="text-muted">{seg.origin} → {seg.destination}</p>
                <p className="text-muted ml-auto">{formatDateTime(seg.departureAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Conditions panel ───────────────────────────────────────────────────────────

function ConditionPill({ allowed, label }: { allowed: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      allowed ? 'bg-green-tint text-green' : 'bg-red-50 text-red-500'
    }`}>
      {allowed ? '✓' : '✕'} {label}
    </span>
  );
}

function ConditionsPanel({ conditions, currency }: { conditions: TripConditions; currency: string }) {
  const { refundCondition, changeCondition } = conditions;

  const formatPenalty = (
    cond: { allowed: boolean; penaltyAmount: number | null; penaltyCurrency: string | null } | null,
  ) => {
    if (!cond || !cond.allowed) return null;
    if (cond.penaltyAmount == null) return 'Penalty unknown';
    if (cond.penaltyAmount === 0) return 'No penalty';
    return `${formatPrice(cond.penaltyAmount, cond.penaltyCurrency ?? currency)} penalty`;
  };

  return (
    <div className="bg-white border border-line rounded-xl p-5 space-y-3">
      <h2 className="text-[14px] font-semibold text-navy">Fare conditions</h2>
      <div className="flex flex-wrap gap-2">
        <ConditionPill
          allowed={refundCondition?.allowed ?? false}
          label={refundCondition?.allowed ? 'Refundable' : 'Non-refundable'}
        />
        <ConditionPill
          allowed={changeCondition?.allowed ?? false}
          label={changeCondition?.allowed ? 'Changes allowed' : 'No changes'}
        />
      </div>
      <div className="space-y-1">
        {refundCondition?.allowed && (
          <p className="text-[12px] text-muted">
            Cancellation: {formatPenalty(refundCondition) ?? 'Free cancellation'}
          </p>
        )}
        {changeCondition?.allowed && (
          <p className="text-[12px] text-muted">
            Changes: {formatPenalty(changeCondition) ?? 'Free changes'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Refund status strip ────────────────────────────────────────────────────────

const REFUND_STATUS_COPY: Record<string, { label: string; color: string }> = {
  pending:         { label: 'Refund queued',            color: 'text-amber-600 bg-amber-50' },
  processing:      { label: 'Refund processing',        color: 'text-blue-600 bg-blue-50' },
  completed:       { label: 'Refund issued',            color: 'text-green bg-green-tint' },
  failed:          { label: 'Refund failed — contact support', color: 'text-red-600 bg-red-50' },
  manual_required: { label: 'Refund being processed by our team', color: 'text-amber-600 bg-amber-50' },
};

function RefundStrip({ entries, currency }: { entries: RefundLedgerEntry[]; currency: string }) {
  if (entries.length === 0) return null;
  const latest = entries[0]!;
  const { label, color } = REFUND_STATUS_COPY[latest.customerRefundStatus] ?? { label: latest.customerRefundStatus, color: 'text-muted bg-surface' };

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${color} border-current/20`}>
      <div>
        <p className="text-[13px] font-semibold">{label}</p>
        {latest.customerRefundStatus !== 'completed' && (
          <p className="text-[11px] mt-0.5 opacity-80">Refunds typically take 5–10 business days to appear on your card.</p>
        )}
      </div>
      <p className="text-[14px] font-bold flex-shrink-0">
        {formatPrice(latest.customerRefundAmount, latest.customerRefundCurrency ?? currency)}
      </p>
    </div>
  );
}

// ── Actions panel ──────────────────────────────────────────────────────────────

function ActionsPanel({
  bookingId,
  bookingRef,
  conditions,
  status,
}: {
  bookingId: string;
  bookingRef?: string;
  conditions: TripConditions | undefined;
  status: string;
}) {
  const navigate = useNavigate();
  const whatsappUrl = `https://wa.me/96500000000?text=${encodeURIComponent(`Hi, I need help with booking ${bookingRef ?? bookingId}`)}`;

  if (status === 'cancelled') {
    return (
      <div className="bg-white border border-line rounded-xl p-5">
        <p className="text-[13px] text-muted">This booking has been cancelled.</p>
      </div>
    );
  }

  if (status !== 'confirmed' && status !== 'changed') {
    return null;
  }

  const conditionsLoaded = conditions !== undefined;
  const canCancel = conditions?.canCancel ?? false;
  const canChange = conditions?.canChange ?? false;

  return (
    <div className="bg-white border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-[14px] font-semibold text-navy">Manage booking</h2>

      <div className="flex flex-wrap gap-3">
        {/* Cancel */}
        {conditionsLoaded && canCancel ? (
          <button
            onClick={() => navigate(`/trips/${bookingId}/cancel`)}
            className="btn-ghost text-[13px] px-4 py-2.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            Cancel booking
          </button>
        ) : conditionsLoaded && !canCancel ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-[13px] px-4 py-2.5 text-muted"
            title="This fare cannot be cancelled online"
          >
            Request cancellation
          </a>
        ) : (
          <div className="h-9 w-36 bg-line rounded-xl animate-pulse" />
        )}

        {/* Change */}
        {conditionsLoaded && canChange ? (
          <button
            onClick={() => navigate(`/trips/${bookingId}/change`)}
            className="btn-primary text-[13px] px-4 py-2.5"
          >
            Change flight
          </button>
        ) : conditionsLoaded && !canChange ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-[13px] px-4 py-2.5 text-muted"
            title="This fare cannot be changed online"
          >
            Request change
          </a>
        ) : (
          <div className="h-9 w-32 bg-line rounded-xl animate-pulse" />
        )}
      </div>

      {conditionsLoaded && !canCancel && !canChange && (
        <p className="text-[12px] text-muted">
          This fare does not support online changes or cancellations.{' '}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="underline">
            Contact us on WhatsApp
          </a>{' '}
          for assistance.
        </p>
      )}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function TripDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-line rounded w-48" />
      <div className="h-40 bg-line rounded-xl" />
      <div className="h-32 bg-line rounded-xl" />
      <div className="h-24 bg-line rounded-xl" />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function TripDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  const { data: booking, isPending, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBookingById(bookingId!),
    enabled: !!bookingId,
  });

  const { data: conditions } = useConditions(
    booking?.status === 'confirmed' || booking?.status === 'changed' ? bookingId : undefined,
  );

  const { data: refundEntries = [] } = useRefundLedger(bookingId);

  return (
    <MemberShell>
      <div className="space-y-5">
        <Link to="/trips" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-navy transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to trips
        </Link>

        {isPending && <TripDetailSkeleton />}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
            Booking not found or you don&apos;t have access.
          </div>
        )}

        {booking && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-navy tracking-tight">
                  {booking.offerSnapshot?.slices[0]?.origin} → {booking.offerSnapshot?.slices[0]?.destination}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  {booking.bookingRef && (
                    <span className="text-[13px] font-mono text-muted">
                      Ref: <span className="text-navy font-semibold">{booking.bookingRef}</span>
                    </span>
                  )}
                  {booking.pnr && (
                    <span className="text-[13px] font-mono text-muted">
                      PNR: <span className="text-navy font-semibold">{booking.pnr}</span>
                    </span>
                  )}
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    booking.status === 'confirmed' || booking.status === 'changed'
                      ? 'bg-green-tint text-green'
                      : booking.status === 'cancelled'
                      ? 'bg-red-50 text-red-500'
                      : 'bg-surface text-muted'
                  }`}>
                    {booking.status === 'confirmed' ? 'Confirmed'
                      : booking.status === 'changed' ? 'Changed'
                      : booking.status === 'cancelled' ? 'Cancelled'
                      : booking.status}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-bold text-navy">{formatPrice(booking.totalAmount, booking.currency)}</p>
                {booking.memberDiscount > 0 && (
                  <p className="text-[12px] text-green font-medium">
                    Saved {formatPrice(booking.memberDiscount, booking.currency)} ({booking.discountPercent}%)
                  </p>
                )}
              </div>
            </div>

            {/* Refund strip — shown when a refund is in progress or complete */}
            <RefundStrip entries={refundEntries} currency={booking.currency} />

            {/* Slices */}
            {booking.offerSnapshot?.slices?.map((slice, i) => (
              <SliceCard
                key={i}
                slice={slice}
                label={
                  booking.offerSnapshot!.slices.length > 1
                    ? i === 0 ? 'Outbound' : 'Return'
                    : undefined
                }
              />
            ))}

            {/* Passengers */}
            <div className="bg-white border border-line rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-line">
                <h2 className="text-[14px] font-semibold text-navy">Passengers</h2>
              </div>
              <div className="divide-y divide-line">
                {booking.passengers.map((p, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-navy">
                        {(p.firstName?.[0] ?? p.title[0] ?? '?').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-navy">
                        {p.title} {p.firstName} {p.lastName}
                      </p>
                      <p className="text-[12px] text-muted capitalize">
                        {p.type ?? 'adult'}
                        {p.dob && ` · Born ${formatDate(p.dob)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fare conditions */}
            {conditions && <ConditionsPanel conditions={conditions} currency={booking.currency} />}

            {/* Actions */}
            <ActionsPanel
              bookingId={bookingId!}
              bookingRef={booking.bookingRef}
              conditions={conditions}
              status={booking.status}
            />

            {/* Meta */}
            {booking.paidAt && (
              <p className="text-[12px] text-muted text-right">
                Paid {formatDateTime(booking.paidAt)}
                {booking.confirmedAt && ` · Confirmed ${formatDateTime(booking.confirmedAt)}`}
              </p>
            )}
          </>
        )}
      </div>
    </MemberShell>
  );
}
