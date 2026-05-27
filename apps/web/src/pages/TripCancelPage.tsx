import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MemberShell } from '@/components/MemberShell.js';
import { fetchBookingById } from '@/features/bookings/booking.api.js';
import { useCancellationQuote, useConfirmCancellation } from '@/features/trips/useTrips.js';
import { formatPrice } from '@/lib/flightUtils.js';
import type { CancellationResult } from '@/features/trips/trips.api.js';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Refund breakdown ───────────────────────────────────────────────────────────

function RefundBreakdown({
  farePaid,
  refundAmount,
  penalty,
  currency,
  isUnknown,
}: {
  farePaid: number;
  refundAmount: number | null;
  penalty: number;
  currency: string;
  isUnknown: boolean;
}) {
  if (isUnknown) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1">
        <p className="text-[13px] font-semibold text-amber-800">Refund amount unknown</p>
        <p className="text-[12px] text-amber-700">
          The airline could not confirm the refund amount at this time. If a refund is owed, our team will process it manually after cancellation.
        </p>
      </div>
    );
  }

  const isNonRefundable = refundAmount === 0;

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-line bg-surface">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">Refund summary</p>
      </div>
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex justify-between text-[13px]">
          <span className="text-muted">Fare paid</span>
          <span className="font-semibold text-navy">{formatPrice(farePaid, currency)}</span>
        </div>
        {penalty > 0 && (
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Cancellation penalty</span>
            <span className="font-semibold text-red-500">− {formatPrice(penalty, currency)}</span>
          </div>
        )}
        <div className="h-px bg-line" />
        <div className="flex justify-between">
          <span className="text-[14px] font-semibold text-navy">
            {isNonRefundable ? 'Refund' : 'You will receive'}
          </span>
          <span className={`text-[16px] font-bold ${isNonRefundable ? 'text-red-500' : 'text-green'}`}>
            {isNonRefundable ? 'None' : formatPrice(refundAmount ?? 0, currency)}
          </span>
        </div>
        {isNonRefundable && (
          <p className="text-[11px] text-muted">This is a non-refundable fare.</p>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function TripCancelPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [acknowledged, setAcknowledged] = useState(false);

  const { data: booking, isPending: bookingPending } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBookingById(bookingId!),
    enabled: !!bookingId,
  });

  const {
    data: quote,
    isPending: quotePending,
    error: quoteError,
  } = useCancellationQuote(bookingId);

  const { mutate: confirm, isPending: confirming } = useConfirmCancellation(bookingId!);

  function handleConfirm() {
    confirm(undefined, {
      onSuccess: (result: CancellationResult) => {
        navigate(`/trips/${bookingId}/cancel/confirmed`, { state: result, replace: true });
      },
    });
  }

  const isLoading = bookingPending || quotePending;
  const outbound = booking?.offerSnapshot?.slices?.[0];
  const currency = booking?.currency ?? 'KWD';

  // Quote error — action not allowed or API failure
  if (!isLoading && quoteError) {
    const msg = (quoteError as { message?: string }).message ?? 'This booking cannot be cancelled online.';
    return (
      <MemberShell>
        <div className="max-w-lg space-y-5">
          <BackLink bookingId={bookingId!} />
          <div className="bg-white border border-line rounded-xl p-6 space-y-4">
            <h1 className="text-xl font-bold text-navy">Cannot cancel online</h1>
            <p className="text-[13px] text-muted">{msg}</p>
            <p className="text-[13px] text-muted">
              Please contact us on WhatsApp for assistance with this booking.
            </p>
            <WhatsAppButton bookingRef={booking?.bookingRef ?? bookingId!} />
          </div>
        </div>
      </MemberShell>
    );
  }

  const ackLabel = quote?.refundAmount === 0
    ? 'I understand this fare is non-refundable and no refund will be issued'
    : 'I understand this cancellation is permanent and cannot be undone';

  return (
    <MemberShell>
      <div className="max-w-lg space-y-5">
        <BackLink bookingId={bookingId!} />

        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Cancel booking</h1>
          <p className="text-muted text-sm mt-0.5">Review the refund details before confirming</p>
        </div>

        {/* Flight summary */}
        {isLoading ? (
          <div className="h-20 bg-line rounded-xl animate-pulse" />
        ) : outbound ? (
          <div className="bg-white border border-line rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-tint flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-green">
                {booking?.offerSnapshot?.airlineCode ?? '??'}
              </span>
            </div>
            <div>
              <p className="text-[15px] font-bold text-navy">
                {outbound.origin} → {outbound.destination}
              </p>
              <p className="text-[12px] text-muted">
                {formatDate(outbound.departureAt)} · {booking?.offerSnapshot?.airline}
              </p>
            </div>
          </div>
        ) : null}

        {/* Refund breakdown */}
        {isLoading ? (
          <div className="h-40 bg-line rounded-xl animate-pulse" />
        ) : quote ? (
          <RefundBreakdown
            farePaid={booking?.totalAmount ?? 0}
            refundAmount={quote.refundAmount}
            penalty={quote.penalty}
            currency={quote.refundCurrency ?? currency}
            isUnknown={quote.isRefundUnknown}
          />
        ) : null}

        {/* Timeline notice */}
        {!isLoading && quote && !quote.isRefundUnknown && (quote.refundAmount ?? 0) > 0 && (
          <div className="flex gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue-500 flex-shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <p className="text-[12px] text-blue-700">
              Refunds typically take <strong>5–10 business days</strong> to appear on your original payment method.
            </p>
          </div>
        )}

        {/* Acknowledge + confirm */}
        {!isLoading && quote && (
          <div className="bg-white border border-line rounded-xl p-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-green flex-shrink-0"
              />
              <span className="text-[13px] text-navy leading-relaxed">{ackLabel}</span>
            </label>

            <button
              onClick={handleConfirm}
              disabled={!acknowledged || confirming}
              className="w-full py-3 rounded-xl text-[14px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {confirming ? 'Cancelling…' : 'Confirm cancellation'}
            </button>

            <Link
              to={`/trips/${bookingId}`}
              className="block text-center text-[13px] text-muted hover:text-navy transition-colors"
            >
              Keep my booking
            </Link>
          </div>
        )}
      </div>
    </MemberShell>
  );
}

function BackLink({ bookingId }: { bookingId: string }) {
  return (
    <Link
      to={`/trips/${bookingId}`}
      className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-navy transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back to trip
    </Link>
  );
}

function WhatsAppButton({ bookingRef }: { bookingRef: string }) {
  const url = `https://wa.me/96500000000?text=${encodeURIComponent(`Hi, I need help cancelling booking ${bookingRef}`)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-primary text-[13px] px-5 py-2.5 inline-flex items-center gap-2"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 1.41.37 2.74 1.01 3.89L0 16l4.25-1.11A7.96 7.96 0 008 16c4.42 0 8-3.58 8-8s-3.58-8-8-8zm3.93 11.14c-.17.49-1 .94-1.38.99-.35.04-.8.06-1.29-.08a11.7 11.7 0 01-1.16-.43C6.3 10.7 4.9 8.8 4.79 8.65c-.11-.15-.9-1.2-.9-2.28s.57-1.62.78-1.84c.2-.22.44-.27.59-.27l.42.01c.14 0 .32-.05.5.38l.63 1.58c.06.15.1.32.01.51l-.22.44-.33.38c-.11.11-.23.23-.1.46.14.23.6.99 1.29 1.6.89.79 1.64 1.03 1.87 1.15.23.11.37.1.5-.06l.72-.85c.13-.17.26-.13.44-.08l1.56.73c.18.09.3.13.34.21.04.07.04.43-.13.92z" />
      </svg>
      Chat on WhatsApp
    </a>
  );
}
