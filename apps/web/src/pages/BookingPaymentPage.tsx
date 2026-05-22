import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useBookingById } from '@/features/bookings/useBookingById.js';
import { createPaymentIntent } from '@/features/bookings/booking.api.js';
import { formatPrice } from '@/lib/flightUtils.js';
import { BookingSidebar } from '@/components/BookingSidebar.js';
import { Logo } from '@/components/Logo.js';
import { stripePromise } from '@/lib/stripe.js';

// ── Main page ──────────────────────────────────────────────────────────────────

export function BookingPaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const { data: booking, isPending: bookingPending, error: bookingError } = useBookingById(bookingId);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    createPaymentIntent(bookingId)
      .then(({ clientSecret: cs }) => setClientSecret(cs))
      .catch((err: Error) => setIntentError(err.message));
  }, [bookingId]);

  if (bookingPending || (!clientSecret && !intentError)) {
    return <Shell><LoadingDots /></Shell>;
  }
  if (bookingError || !booking) {
    return <Shell><ErrorBlock message={bookingError?.message ?? 'Booking not found'} /></Shell>;
  }
  if (intentError) {
    return <Shell><ErrorBlock message={intentError} /></Shell>;
  }
  if (!stripePromise) {
    return <Shell><ErrorBlock message="Payment is not configured. Please contact support." /></Shell>;
  }

  const snapshot = booking.offerSnapshot;

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button
          type="button"
          onClick={() => navigate(`/book/${bookingId}/review`)}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy mb-6"
        >
          <ChevronLeft />
          Review booking
        </button>

        <StepIndicator current={3} />

        <div className="flex flex-col lg:flex-row gap-6 items-start mt-6">
          {/* ── Left: payment form ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">
            <div className="bg-white border border-line rounded-card p-5">
              <p className="text-[12px] font-bold uppercase tracking-wide text-muted mb-5">
                Payment details
              </p>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: clientSecret!,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#0a2540',
                      colorBackground: '#ffffff',
                      colorText: '#0a2540',
                      colorDanger: '#ef4444',
                      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <PaymentForm bookingId={bookingId!} totalAmount={booking.totalAmount} currency={booking.currency} />
              </Elements>
            </div>

            <div className="rounded-lg bg-green-tint/60 border border-green/20 px-4 py-3 text-[13px] text-navy">
              <p className="font-semibold mb-1">Secure payment</p>
              <ul className="space-y-1 text-muted list-disc list-inside">
                <li>Your payment is encrypted and processed securely by Stripe</li>
                <li>We never store your card details</li>
                <li>You&apos;ll receive a booking confirmation by email</li>
              </ul>
            </div>
          </div>

          {/* ── Right: sidebar ─────────────────────────────────────────── */}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ── Payment form (inside Elements context) ─────────────────────────────────────

function PaymentForm({
  bookingId,
  totalAmount,
  currency,
}: {
  bookingId: string;
  totalAmount: number;
  currency: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/confirmed/${bookingId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setPaymentError(error.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
    } else {
      navigate(`/book/confirmed/${bookingId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />

      {paymentError && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="btn-primary w-full py-3.5 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isProcessing
          ? 'Processing…'
          : `Pay ${formatPrice(totalAmount, currency)}`}
      </button>
    </form>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────

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
                  done ? 'bg-green text-amber-ink' : active ? 'bg-navy text-white' : 'bg-line text-muted'
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

// ── Shell & helpers ────────────────────────────────────────────────────────────

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
      <span className="text-muted text-sm ml-2">Setting up payment…</span>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
      <p className="text-3xl mb-3">✈️</p>
      <h3 className="font-semibold text-navy mb-1">Something went wrong</h3>
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
