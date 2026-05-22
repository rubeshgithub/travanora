import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
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
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { data: booking, isPending: bookingPending, error: bookingError } = useBookingById(bookingId);
    const [clientSecret, setClientSecret] = useState(null);
    const [intentError, setIntentError] = useState(null);
    useEffect(() => {
        if (!bookingId)
            return;
        createPaymentIntent(bookingId)
            .then(({ clientSecret: cs }) => setClientSecret(cs))
            .catch((err) => setIntentError(err.message));
    }, [bookingId]);
    if (bookingPending || (!clientSecret && !intentError)) {
        return _jsx(Shell, { children: _jsx(LoadingDots, {}) });
    }
    if (bookingError || !booking) {
        return _jsx(Shell, { children: _jsx(ErrorBlock, { message: bookingError?.message ?? 'Booking not found' }) });
    }
    if (intentError) {
        return _jsx(Shell, { children: _jsx(ErrorBlock, { message: intentError }) });
    }
    if (!stripePromise) {
        return _jsx(Shell, { children: _jsx(ErrorBlock, { message: "Payment is not configured. Please contact support." }) });
    }
    const snapshot = booking.offerSnapshot;
    return (_jsx(Shell, { children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-8", children: [_jsxs("button", { type: "button", onClick: () => navigate(`/book/${bookingId}/review`), className: "inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy mb-6", children: [_jsx(ChevronLeft, {}), "Review booking"] }), _jsx(StepIndicator, { current: 3 }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-6 items-start mt-6", children: [_jsxs("div", { className: "flex-1 min-w-0 space-y-5", children: [_jsxs("div", { className: "bg-white border border-line rounded-card p-5", children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted mb-5", children: "Payment details" }), _jsx(Elements, { stripe: stripePromise, options: {
                                                clientSecret: clientSecret,
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
                                            }, children: _jsx(PaymentForm, { bookingId: bookingId, totalAmount: booking.totalAmount, currency: booking.currency }) })] }), _jsxs("div", { className: "rounded-lg bg-green-tint/60 border border-green/20 px-4 py-3 text-[13px] text-navy", children: [_jsx("p", { className: "font-semibold mb-1", children: "Secure payment" }), _jsxs("ul", { className: "space-y-1 text-muted list-disc list-inside", children: [_jsx("li", { children: "Your payment is encrypted and processed securely by Stripe" }), _jsx("li", { children: "We never store your card details" }), _jsx("li", { children: "You'll receive a booking confirmation by email" })] })] })] }), _jsx("div", { className: "lg:w-72 flex-shrink-0 w-full", children: snapshot ? (_jsx(BookingSidebar, { slices: snapshot.slices, airline: snapshot.airline, airlineCode: snapshot.airlineCode, cabinClass: snapshot.cabinClass, publicPrice: booking.publicPrice, memberDiscount: booking.memberDiscount, totalAmount: booking.totalAmount, currency: booking.currency, discountPercent: booking.discountPercent, passengerCount: booking.passengers.length, expiresAt: booking.duffelOfferExpiresAt })) : (_jsx("div", { className: "sticky top-20 bg-white border border-line rounded-card p-5", children: _jsxs("div", { className: "flex justify-between items-baseline", children: [_jsx("span", { className: "font-semibold text-navy", children: "Total" }), _jsx("span", { className: "text-2xl font-bold text-navy", children: formatPrice(booking.totalAmount, booking.currency) })] }) })) })] })] }) }));
}
// ── Payment form (inside Elements context) ─────────────────────────────────────
function PaymentForm({ bookingId, totalAmount, currency, }) {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    async function handleSubmit(e) {
        e.preventDefault();
        if (!stripe || !elements)
            return;
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
        }
        else {
            navigate(`/book/confirmed/${bookingId}`);
        }
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsx(PaymentElement, { options: { layout: 'tabs' } }), paymentError && (_jsx("div", { className: "rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600", children: paymentError })), _jsx("button", { type: "submit", disabled: !stripe || !elements || isProcessing, className: "btn-primary w-full py-3.5 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed", children: isProcessing
                    ? 'Processing…'
                    : `Pay ${formatPrice(totalAmount, currency)}` })] }));
}
// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
    const steps = [
        { n: 1, label: 'Passengers' },
        { n: 2, label: 'Review' },
        { n: 3, label: 'Payment' },
    ];
    return (_jsx("div", { className: "flex items-center gap-0", children: steps.map((step, i) => {
            const done = step.n < current;
            const active = step.n === current;
            return (_jsxs("div", { className: "flex items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${done ? 'bg-green text-amber-ink' : active ? 'bg-navy text-white' : 'bg-line text-muted'}`, children: done ? '✓' : step.n }), _jsx("span", { className: `text-[13px] font-medium hidden sm:inline ${active ? 'text-navy' : done ? 'text-green' : 'text-muted'}`, children: step.label })] }), i < steps.length - 1 && (_jsx("div", { className: `mx-3 h-px w-8 sm:w-12 ${done ? 'bg-green' : 'bg-line'}` }))] }, step.n));
        }) }));
}
// ── Shell & helpers ────────────────────────────────────────────────────────────
function Shell({ children }) {
    return (_jsxs("div", { className: "min-h-screen bg-[var(--bg)]", children: [_jsxs("header", { className: "bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx(Logo, { size: 26 }), _jsx("span", { className: "font-bold text-navy tracking-tighter", children: "Travanora" })] }), _jsx("span", { className: "text-[12px] text-muted", children: "\u00B7 Secure checkout" })] }), children] }));
}
function LoadingDots() {
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-3", children: [[0, 150, 300].map((d) => (_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-green animate-pulse-green", style: { animationDelay: `${d}ms` } }, d))), _jsx("span", { className: "text-muted text-sm ml-2", children: "Setting up payment\u2026" })] }));
}
function ErrorBlock({ message }) {
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center", children: [_jsx("p", { className: "text-3xl mb-3", children: "\u2708\uFE0F" }), _jsx("h3", { className: "font-semibold text-navy mb-1", children: "Something went wrong" }), _jsx("p", { className: "text-muted text-sm mb-4", children: message }), _jsx(Link, { to: "/", className: "btn-primary text-sm px-5 py-2", children: "Back to search" })] }));
}
function ChevronLeft() {
    return (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M10 3L5 8l5 5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
//# sourceMappingURL=BookingPaymentPage.js.map