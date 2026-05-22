import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBookingById } from '@/features/bookings/useBookingById.js';
import { formatPrice, formatDuration } from '@/lib/flightUtils.js';
import { BookingSidebar } from '@/components/BookingSidebar.js';
import { Logo } from '@/components/Logo.js';
import { COUNTRIES } from '@/lib/countries.js';
function countryName(code) {
    if (!code)
        return '';
    return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDateLong(iso) {
    return new Date(iso).toLocaleDateString('en-KW', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
// ── Main page ──────────────────────────────────────────────────────────────────
export function BookingReviewPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { data: booking, isPending, error } = useBookingById(bookingId);
    if (isPending)
        return _jsx(Shell, { children: _jsx(LoadingDots, {}) });
    if (error || !booking)
        return _jsx(Shell, { children: _jsx(ErrorBlock, { message: error?.message ?? 'Booking not found' }) });
    const snapshot = booking.offerSnapshot;
    const isMember = booking.discountPercent > 0 && booking.memberDiscount > 0;
    return (_jsx(Shell, { children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-8", children: [_jsxs("button", { type: "button", onClick: () => navigate(booking.duffelOfferId ? `/book/${booking.duffelOfferId}` : '/', { state: { draftId: bookingId } }), className: "inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy mb-6", children: [_jsx(ChevronLeft, {}), "Edit passengers"] }), _jsx(StepIndicator, { current: 2 }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-6 items-start mt-6", children: [_jsxs("div", { className: "flex-1 min-w-0 space-y-5", children: [snapshot && (_jsxs("div", { className: "bg-white border border-line rounded-card p-5", children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted mb-4", children: "Flight details" }), snapshot.slices.map((slice, i) => (_jsxs("div", { children: [i > 0 && _jsx("div", { className: "border-t border-line/60 my-4" }), snapshot.slices.length > 1 && (_jsx("p", { className: "text-[11px] font-bold uppercase tracking-wide text-muted mb-2", children: i === 0 ? 'Outbound' : 'Return' })), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl font-bold text-navy", children: formatTime(slice.departureAt) }), _jsx("p", { className: "text-[13px] font-semibold text-navy", children: slice.originName ?? slice.origin }), _jsx("p", { className: "text-[11px] text-muted", children: slice.origin })] }), _jsxs("div", { className: "flex-1 flex flex-col items-center", children: [slice.durationMinutes != null && (_jsx("p", { className: "text-[11px] text-muted", children: formatDuration(slice.durationMinutes) })), _jsx("div", { className: "w-full h-px bg-line my-1" }), _jsx("p", { className: "text-[11px] text-muted", children: (slice.stops ?? 0) === 0 ? 'Nonstop' : `${slice.stops} stop${(slice.stops ?? 0) > 1 ? 's' : ''}` })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl font-bold text-navy", children: formatTime(slice.arrivalAt) }), _jsx("p", { className: "text-[13px] font-semibold text-navy", children: slice.destinationName ?? slice.destination }), _jsx("p", { className: "text-[11px] text-muted", children: slice.destination })] })] }), _jsx("p", { className: "text-[12px] text-muted mt-2", children: formatDateLong(slice.departureAt) })] }, i))), _jsxs("div", { className: "flex items-center gap-2 mt-4 pt-3 border-t border-line/60", children: [_jsx("div", { className: "w-7 h-7 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-[9px] font-bold text-green", children: snapshot.airlineCode }) }), _jsx("span", { className: "text-[13px] text-muted", children: snapshot.airline }), _jsx("span", { className: "ml-auto text-[12px] text-muted capitalize", children: snapshot.cabinClass.replace('_', ' ') })] })] })), _jsxs("div", { className: "bg-white border border-line rounded-card p-5", children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted mb-4", children: booking.passengers.length === 1 ? 'Passenger' : `Passengers (${booking.passengers.length})` }), _jsx("div", { className: "space-y-4", children: booking.passengers.map((pax, i) => (_jsxs("div", { className: `${i > 0 ? 'border-t border-line/60 pt-4' : ''}`, children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-semibold text-navy capitalize", children: [pax.title, ". ", pax.firstName, " ", pax.lastName] }), _jsx("p", { className: "text-[13px] text-muted mt-0.5 capitalize", children: pax.type ?? 'adult' })] }), _jsx("span", { className: "text-[11px] font-medium text-muted uppercase tracking-wide", children: pax.gender === 'm' ? 'Male' : 'Female' })] }), _jsxs("div", { className: "mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]", children: [pax.dob && (_jsx(InfoRow, { label: "Date of birth", value: formatDateLong(pax.dob) })), pax.nationality && (_jsx(InfoRow, { label: "Nationality", value: countryName(pax.nationality) })), _jsx(InfoRow, { label: "Email", value: pax.email }), pax.phone && (_jsx(InfoRow, { label: "Phone", value: `${pax.phone.countryCode} ${pax.phone.number}` })), pax.passportNumber && (_jsx(InfoRow, { label: "Passport", value: pax.passportNumber }))] })] }, i))) })] }), _jsxs("div", { className: "rounded-lg bg-green-tint/60 border border-green/20 px-4 py-3 text-[13px] text-navy", children: [_jsx("p", { className: "font-semibold mb-1", children: "Before you pay" }), _jsxs("ul", { className: "space-y-1 text-muted list-disc list-inside", children: [_jsx("li", { children: "All names must exactly match the passport or travel document" }), _jsx("li", { children: "Payment is processed securely via Stripe" }), _jsx("li", { children: "You'll receive a booking confirmation by email once payment is complete" })] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("button", { type: "button", onClick: () => navigate(booking.duffelOfferId ? `/book/${booking.duffelOfferId}` : '/', { state: { draftId: bookingId } }), className: "btn-ghost flex-1 py-3.5 text-[15px]", children: _jsxs("span", { className: "flex items-center justify-center gap-1.5", children: [_jsx(ChevronLeft, {}), "Edit passengers"] }) }), _jsxs("button", { type: "button", onClick: () => navigate(`/book/${bookingId}/payment`), className: "btn-primary flex-1 py-3.5 text-[15px]", children: ["Proceed to payment \u00B7 ", formatPrice(booking.totalAmount, booking.currency)] })] })] }), _jsx("div", { className: "lg:w-72 flex-shrink-0 w-full", children: snapshot ? (_jsx(BookingSidebar, { slices: snapshot.slices, airline: snapshot.airline, airlineCode: snapshot.airlineCode, cabinClass: snapshot.cabinClass, publicPrice: booking.publicPrice, memberDiscount: booking.memberDiscount, totalAmount: booking.totalAmount, currency: booking.currency, discountPercent: booking.discountPercent, passengerCount: booking.passengers.length, expiresAt: booking.duffelOfferExpiresAt })) : (_jsxs("div", { className: "sticky top-20 bg-white border border-line rounded-card p-5", children: [_jsxs("div", { className: "flex justify-between items-baseline", children: [_jsx("span", { className: "font-semibold text-navy", children: "Total" }), _jsx("span", { className: "text-2xl font-bold text-navy", children: formatPrice(booking.totalAmount, booking.currency) })] }), isMember && (_jsx("p", { className: "text-[12px] text-green mt-2 text-center", children: "Includes member discount" }))] })) })] })] }) }));
}
// ── Helper components ──────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
    return (_jsxs("div", { children: [_jsxs("span", { className: "text-muted", children: [label, ":"] }), ' ', _jsx("span", { className: "text-navy font-medium", children: value })] }));
}
function StepIndicator({ current }) {
    const steps = [
        { n: 1, label: 'Passengers' },
        { n: 2, label: 'Review' },
        { n: 3, label: 'Payment' },
    ];
    return (_jsx("div", { className: "flex items-center gap-0", children: steps.map((step, i) => {
            const done = step.n < current;
            const active = step.n === current;
            return (_jsxs("div", { className: "flex items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${done
                                    ? 'bg-green text-amber-ink'
                                    : active
                                        ? 'bg-navy text-white'
                                        : 'bg-line text-muted'}`, children: done ? '✓' : step.n }), _jsx("span", { className: `text-[13px] font-medium hidden sm:inline ${active ? 'text-navy' : done ? 'text-green' : 'text-muted'}`, children: step.label })] }), i < steps.length - 1 && (_jsx("div", { className: `mx-3 h-px w-8 sm:w-12 ${done ? 'bg-green' : 'bg-line'}` }))] }, step.n));
        }) }));
}
function Shell({ children }) {
    return (_jsxs("div", { className: "min-h-screen bg-[var(--bg)]", children: [_jsxs("header", { className: "bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx(Logo, { size: 26 }), _jsx("span", { className: "font-bold text-navy tracking-tighter", children: "Travanora" })] }), _jsx("span", { className: "text-[12px] text-muted", children: "\u00B7 Secure checkout" })] }), children] }));
}
function LoadingDots() {
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-3", children: [[0, 150, 300].map((d) => (_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-green animate-pulse-green", style: { animationDelay: `${d}ms` } }, d))), _jsx("span", { className: "text-muted text-sm ml-2", children: "Loading booking\u2026" })] }));
}
function ErrorBlock({ message }) {
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center", children: [_jsx("p", { className: "text-3xl mb-3", children: "\u2708\uFE0F" }), _jsx("h3", { className: "font-semibold text-navy mb-1", children: "Could not load your booking" }), _jsx("p", { className: "text-muted text-sm mb-4", children: message }), _jsx(Link, { to: "/", className: "btn-primary text-sm px-5 py-2", children: "Back to search" })] }));
}
function ChevronLeft() {
    return (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M10 3L5 8l5 5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
//# sourceMappingURL=BookingReviewPage.js.map