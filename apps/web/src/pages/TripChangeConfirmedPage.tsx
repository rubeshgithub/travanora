import { Link, useParams, useLocation } from 'react-router-dom';
import { MemberShell } from '@/components/MemberShell.js';
import { formatPrice } from '@/lib/flightUtils.js';
import type { ChangeResult } from '@/features/trips/trips.api.js';

export function TripChangeConfirmedPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { state } = useLocation() as { state?: ChangeResult };

  // Hard-refresh safe — no state means they navigated directly
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
            <h1 className="text-xl font-bold text-navy">Flight changed</h1>
            <p className="text-[13px] text-muted">Your flight has been successfully changed.</p>
            <Link to={`/trips/${bookingId}`} className="btn-primary text-[13px] px-6 py-2.5 inline-block">
              View updated trip
            </Link>
          </div>
        </div>
      </MemberShell>
    );
  }

  const { changeTotalAmount, currency, isRefund, customerRefundStatus } = state;
  const hasExtraCharge = changeTotalAmount > 0;
  const hasRefund = isRefund && changeTotalAmount < 0;

  const refundCopy =
    customerRefundStatus === 'completed'
      ? 'Your refund has been issued to your original payment method.'
      : customerRefundStatus === 'manual_required'
      ? 'Our team will process your refund and be in touch shortly.'
      : 'Your refund will appear on your original payment method within 5–10 business days.';

  return (
    <MemberShell>
      <div className="max-w-lg space-y-5">
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
            <h1 className="text-2xl font-bold text-navy tracking-tight">Flight changed</h1>
            <p className="text-[13px] text-muted">
              Your new itinerary has been confirmed with the airline.
            </p>
          </div>

          {/* Pricing note */}
          {(hasExtraCharge || hasRefund) && (
            <div className={`rounded-xl border px-5 py-4 space-y-1 ${
              hasExtraCharge ? 'bg-amber-50 border-amber-100' : 'bg-green-tint border-green/20'
            }`}>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-navy">
                  {hasExtraCharge ? 'Additional charge' : 'Refund due'}
                </p>
                <p className="text-[16px] font-bold text-navy">
                  {formatPrice(Math.abs(changeTotalAmount), currency)}
                </p>
              </div>
              <p className="text-[12px] text-muted">
                {hasExtraCharge
                  ? 'Our team will contact you about collecting the additional charge.'
                  : refundCopy}
              </p>
            </div>
          )}

          {changeTotalAmount === 0 && (
            <div className="rounded-xl border border-line bg-surface px-5 py-4">
              <p className="text-[13px] text-muted text-center">This was a free change — no additional charge.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <Link to={`/trips/${bookingId}`} className="btn-primary text-[13px] py-2.5 text-center">
              View updated trip
            </Link>
            <Link to="/trips" className="btn-ghost text-[13px] py-2.5 text-center">
              Back to my trips
            </Link>
          </div>
        </div>
      </div>
    </MemberShell>
  );
}
