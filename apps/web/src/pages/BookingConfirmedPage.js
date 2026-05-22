import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchBookingById } from '@/features/bookings/booking.api.js';
import { formatPrice, formatDuration } from '@/lib/flightUtils.js';
import { Logo } from '@/components/Logo.js';
function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDateLong(iso) {
    return new Date(iso).toLocaleDateString('en-KW', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
// ── Main page ──────────────────────────────────────────────────────────────────
const POLL_TIMEOUT_MS = 60_000; // stop polling after 60 s
export function BookingConfirmedPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const mountedAt = useRef(Date.now());
    const prevStatus = useRef(undefined);
    const { data: booking, isPending, error, refetch } = useQuery({
        queryKey: ['booking-confirmed', bookingId],
        queryFn: () => fetchBookingById(bookingId),
        enabled: !!bookingId,
        staleTime: 0,
        gcTime: 0,
        retry: false,
    });
    // Toast when webhook confirms the booking while we're polling
    useEffect(() => {
        if (prevStatus.current === 'pending_payment' && booking?.status === 'confirmed') {
            toast.success('Your booking is confirmed!', { duration: 6000 });
        }
        prevStatus.current = booking?.status;
    }, [booking?.status]);
    // Poll every 2 s while pending, stop after 60 s timeout
    useEffect(() => {
        if (!bookingId || booking?.status !== 'pending_payment')
            return;
        const intervalId = setInterval(() => {
            if (Date.now() - mountedAt.current > POLL_TIMEOUT_MS) {
                clearInterval(intervalId);
                return;
            }
            refetch();
        }, 2000);
        return () => clearInterval(intervalId);
    }, [bookingId, booking?.status, refetch]);
    if (isPending)
        return _jsx(Shell, { children: _jsx(LoadingDots, { text: "Loading your booking\u2026" }) });
    if (error || !booking) {
        return (_jsx(Shell, { children: _jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center", children: [_jsx("p", { className: "text-3xl mb-3", children: "\u2708\uFE0F" }), _jsx("h3", { className: "font-semibold text-navy mb-1", children: "Could not load your booking" }), _jsx("p", { className: "text-muted text-sm mb-4", children: error?.message ?? 'Booking not found' }), _jsx(Link, { to: "/", className: "btn-primary text-sm px-5 py-2", children: "Back to search" })] }) }));
    }
    // Redirect if the booking flow was skipped entirely
    if (booking.status === 'draft') {
        navigate(`/book/${booking.duffelOfferId}`, { replace: true });
        return null;
    }
    // Processing state — webhook hasn't fired yet (or timed out)
    if (booking.status === 'pending_payment') {
        const timedOut = Date.now() - mountedAt.current > POLL_TIMEOUT_MS;
        return (_jsx(Shell, { children: _jsx("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center", children: timedOut ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-3xl mb-4", children: "\u23F3" }), _jsx("h3", { className: "font-semibold text-navy mb-2", children: "Still processing\u2026" }), _jsxs("p", { className: "text-muted text-sm mb-6 max-w-sm mx-auto", children: ["Your payment was received but the booking is taking longer than usual to confirm. Check back in a moment \u2014 your booking reference will appear in", ' ', _jsx(Link, { to: "/me/bookings", className: "text-navy font-medium underline", children: "My Bookings" }), " once ready."] }), _jsx("button", { type: "button", onClick: () => { mountedAt.current = Date.now(); refetch(); }, className: "btn-primary text-sm px-5 py-2", children: "Check again" })] })) : (_jsxs(_Fragment, { children: [_jsx(LoadingDots, { text: "Processing your payment\u2026" }), _jsx("p", { className: "text-muted text-sm mt-4", children: "This usually takes a few seconds. Please don't close this page." })] })) }) }));
    }
    // Booking failed after payment
    if (booking.status === 'payment_succeeded_booking_failed') {
        return (_jsx(Shell, { children: _jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4", children: _jsx("span", { className: "text-2xl", children: "\u26A0\uFE0F" }) }), _jsx("h2", { className: "text-xl font-bold text-navy mb-2", children: "Payment received, but booking failed" }), _jsxs("p", { className: "text-muted text-sm mb-6 max-w-sm mx-auto", children: ["Your payment was processed successfully, but we couldn't confirm your flight reservation. Our team has been notified and will contact you shortly. Your reference: ", _jsxs("span", { className: "font-mono font-semibold text-navy", children: ["#", String(booking.id).slice(-8).toUpperCase()] })] }), _jsx("a", { href: `mailto:support@travanora.com?subject=Booking%20Failed%20${String(booking.id).slice(-8)}`, className: "btn-primary text-sm px-5 py-2", children: "Contact support" })] }) }));
    }
    const snapshot = booking.offerSnapshot;
    const isMember = booking.discountPercent > 0 && booking.memberDiscount > 0;
    return (_jsx(Shell, { children: _jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-10", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-green-tint border border-green/20 flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { width: "28", height: "28", viewBox: "0 0 28 28", fill: "none", children: _jsx("path", { d: "M6 14l6 6 10-12", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", className: "text-green", style: { stroke: 'var(--color-green, #22c55e)' } }) }) }), _jsx("h1", { className: "text-2xl font-bold text-navy tracking-tight", children: "Booking confirmed!" }), _jsxs("p", { className: "text-muted text-sm mt-1", children: ["A confirmation email has been sent to ", _jsx("span", { className: "font-medium text-navy", children: booking.contactEmail ?? booking.passengers[0]?.email })] })] }), _jsxs("div", { className: "bg-green-tint/50 border border-green/20 rounded-card p-5 text-center mb-5", children: [_jsx("p", { className: "text-[11px] font-bold uppercase tracking-wider text-muted mb-1", children: "Booking Reference" }), _jsx("p", { className: "text-3xl font-black text-navy tracking-widest font-mono", children: booking.bookingRef })] }), snapshot && (_jsxs("div", { className: "bg-white border border-line rounded-card p-5 mb-5", children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted mb-4", children: "Flight details" }), snapshot.slices.map((slice, i) => (_jsxs("div", { children: [i > 0 && _jsx("div", { className: "border-t border-line/60 my-4" }), snapshot.slices.length > 1 && (_jsx("p", { className: "text-[11px] font-bold uppercase tracking-wide text-muted mb-2", children: i === 0 ? 'Outbound' : 'Return' })), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl font-bold text-navy", children: formatTime(slice.departureAt) }), _jsx("p", { className: "text-[13px] font-semibold text-navy", children: slice.originName ?? slice.origin }), _jsx("p", { className: "text-[11px] text-muted", children: slice.origin })] }), _jsxs("div", { className: "flex-1 flex flex-col items-center", children: [slice.durationMinutes != null && (_jsx("p", { className: "text-[11px] text-muted", children: formatDuration(slice.durationMinutes) })), _jsx("div", { className: "w-full h-px bg-line my-1" }), _jsx("p", { className: "text-[11px] text-muted", children: (slice.stops ?? 0) === 0 ? 'Nonstop' : `${slice.stops} stop${(slice.stops ?? 0) > 1 ? 's' : ''}` })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl font-bold text-navy", children: formatTime(slice.arrivalAt) }), _jsx("p", { className: "text-[13px] font-semibold text-navy", children: slice.destinationName ?? slice.destination }), _jsx("p", { className: "text-[11px] text-muted", children: slice.destination })] })] }), _jsx("p", { className: "text-[12px] text-muted mt-2", children: formatDateLong(slice.departureAt) })] }, i))), _jsxs("div", { className: "flex items-center gap-2 mt-4 pt-3 border-t border-line/60", children: [_jsx("div", { className: "w-7 h-7 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-[9px] font-bold text-green", children: snapshot.airlineCode }) }), _jsx("span", { className: "text-[13px] text-muted", children: snapshot.airline }), _jsx("span", { className: "ml-auto text-[12px] text-muted capitalize", children: snapshot.cabinClass.replace('_', ' ') })] })] })), _jsxs("div", { className: "bg-white border border-line rounded-card p-5 mb-5", children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted mb-3", children: "Payment summary" }), _jsxs("div", { className: "space-y-2 text-[13px]", children: [isMember && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted", children: "Original price" }), _jsx("span", { className: "text-navy line-through opacity-60", children: formatPrice(booking.publicPrice, booking.currency) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { className: "text-green font-medium", children: ["Member discount (", booking.discountPercent, "%)"] }), _jsxs("span", { className: "text-green font-medium", children: ["\u2212", formatPrice(booking.memberDiscount, booking.currency)] })] })] })), _jsxs("div", { className: "flex justify-between font-semibold text-[15px] pt-1 border-t border-line/60", children: [_jsx("span", { className: "text-navy", children: "Total paid" }), _jsx("span", { className: "text-navy", children: formatPrice(booking.totalAmount, booking.currency) })] })] })] }), booking.passengers.length > 0 && (_jsxs("div", { className: "bg-white border border-line rounded-card p-5 mb-5", children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted mb-3", children: booking.passengers.length === 1 ? 'Passenger' : `Passengers (${booking.passengers.length})` }), _jsx("div", { className: "space-y-2", children: booking.passengers.map((pax, i) => (_jsxs("div", { className: "flex items-center justify-between text-[13px]", children: [_jsxs("span", { className: "font-medium text-navy capitalize", children: [pax.title, ". ", pax.firstName, " ", pax.lastName] }), _jsx("span", { className: "text-muted capitalize", children: pax.type ?? 'adult' })] }, i))) })] })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx(Link, { to: "/me/bookings", className: "btn-ghost flex-1 py-3 text-[14px] text-center", children: "View all bookings" }), _jsx(Link, { to: "/", className: "btn-primary flex-1 py-3 text-[14px] text-center", children: "Search more flights" })] })] }) }));
}
// ── Helpers ────────────────────────────────────────────────────────────────────
function Shell({ children }) {
    return (_jsxs("div", { className: "min-h-screen bg-[var(--bg)]", children: [_jsx("header", { className: "bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3", children: _jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx(Logo, { size: 26 }), _jsx("span", { className: "font-bold text-navy tracking-tighter", children: "Travanora" })] }) }), children] }));
}
function LoadingDots({ text }) {
    return (_jsxs("div", { className: "flex items-center justify-center gap-3 py-10", children: [[0, 150, 300].map((d) => (_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-green animate-pulse-green", style: { animationDelay: `${d}ms` } }, d))), _jsx("span", { className: "text-muted text-sm ml-2", children: text })] }));
}
//# sourceMappingURL=BookingConfirmedPage.js.map