import { useParams, Link, useLocation } from 'react-router-dom';
import { MemberShell } from '@/components/MemberShell.js';
import { formatPrice } from '@/lib/flightUtils.js';
import type { CancellationResult } from '@/features/trips/trips.api.js';

export function TripCancelConfirmedPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { state } = useLocation() as { state?: CancellationResult };

  // If navigated directly without state (e.g. hard refresh), show a generic message
  if (!state) {
    return (
      <MemberShell>
        <div className="max-w-lg space-y-5">
          <div className="bg-white border border-line rounded-xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-tint flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-navy">Booking cancelled</h1>
            <p className="text-[13px] text-muted">
              Your booking has been cancelled. Check your email for confirmation.
            </p>
            <Link to="/trips" className="btn-primary text-[13px] px-6 py-2.5 inline-block">
              Back to trips
            </Link>
          </div>
        </div>
      </MemberShell>
    );
  }

  const { customerRefundAmount, customerRefundStatus, isManualRefund } = state;
  const hasRefund = customerRefundAmount > 0;

  const refundCopy = isManualRefund
    ? `A refund of ${customerRefundAmount > 0 ? `${customerRefundAmount}` : ''} is being processed by our team. We'll be in touch.`
    : customerRefundStatus === 'completed'
    ? 'Your refund has been issued to your original payment method.'
    : 'Your refund has been initiated and will appear on your original payment method within 5–10 business days.';

  return (
    <MemberShell>
      <div className="max-w-lg space-y-5">
        {/* Success card */}
        <div className="bg-white border border-line rounded-xl p-8 space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-tint flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green">
                <path d="M23 7L11 19l-6-6" />
              </svg>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-navy tracking-tight">Booking cancelled</h1>
            <p className="text-[13px] text-muted">
              Your cancellation has been confirmed with the airline.
            </p>
          </div>

          {/* Refund details */}
          {hasRefund ? (
            <div className={`rounded-xl border px-5 py-4 space-y-1 ${
              isManualRefund
                ? 'bg-amber-50 border-amber-100'
                : 'bg-green-tint border-green/20'
            }`}>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-navy">
                  {isManualRefund ? 'Refund being processed' : 'Refund initiated'}
                </p>
                <p className="text-[16px] font-bold text-navy">
                  {/* We don't have currency here so show the raw amount */}
                  {customerRefundAmount.toFixed(3)}
                </p>
              </div>
              <p className="text-[12px] text-muted">{refundCopy}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-surface px-5 py-4">
              <p className="text-[13px] text-muted text-center">
                This was a non-refundable fare. No refund will be issued.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <Link to="/trips" className="btn-primary text-[13px] py-2.5 text-center">
              Back to my trips
            </Link>
            <Link to="/" className="btn-ghost text-[13px] py-2.5 text-center">
              Search new flights
            </Link>
          </div>
        </div>

        {isManualRefund && (
          <p className="text-[11px] text-muted text-center px-4">
            If you have questions about your refund, contact us on{' '}
            <a
              href={`https://wa.me/96500000000?text=${encodeURIComponent(`Hi, I cancelled booking ${bookingId} and have a question about my refund`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              WhatsApp
            </a>
            .
          </p>
        )}
      </div>
    </MemberShell>
  );
}
