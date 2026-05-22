import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams, useLocation, Link } from 'react-router-dom';
import { useBooking } from '@/features/bookings/useBooking.js';
import { formatPrice, formatDuration } from '@/lib/flightUtils.js';
import { useAuthStore } from '@/features/auth/auth.store.js';
function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-KW', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDob(iso) {
    return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}
const TITLE_LABEL = { mr: 'Mr', ms: 'Ms', mrs: 'Mrs', miss: 'Miss', dr: 'Dr' };
// ── Shared sub-components ────────────────────────────────────────────────────
function SliceRow({ origin, originName, destination, destinationName, departureAt, arrivalAt, durationMinutes, stops, label, }) {
    return (_jsxs("div", { children: [label && _jsx("p", { className: "text-[11px] font-bold uppercase tracking-wide text-muted mb-2", children: label }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl font-bold text-navy", children: formatTime(departureAt) }), _jsx("p", { className: "text-[13px] font-semibold text-navy", children: originName ?? origin }), _jsx("p", { className: "text-[11px] text-muted", children: origin })] }), _jsxs("div", { className: "flex-1 flex flex-col items-center", children: [durationMinutes != null && (_jsx("p", { className: "text-[11px] text-muted", children: formatDuration(durationMinutes) })), _jsx("div", { className: "w-full h-px bg-line my-1" }), stops != null && (_jsx("p", { className: "text-[11px] text-muted", children: stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}` }))] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl font-bold text-navy", children: formatTime(arrivalAt) }), _jsx("p", { className: "text-[13px] font-semibold text-navy", children: destinationName ?? destination }), _jsx("p", { className: "text-[11px] text-muted", children: destination })] })] }), _jsx("p", { className: "text-[12px] text-muted mt-2", children: formatDate(departureAt) })] }));
}
function PassengerCard({ passenger, index, total }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [total > 1 && (_jsxs("p", { className: "text-[11px] font-bold uppercase tracking-wide text-muted", children: ["Passenger ", index + 1] })), _jsxs("p", { className: "text-[15px] font-semibold text-navy", children: [TITLE_LABEL[passenger.title] ?? passenger.title, " ", passenger.given_name, " ", passenger.family_name] }), _jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted", children: [_jsxs("span", { children: ["DOB: ", formatDob(passenger.born_on)] }), _jsx("span", { children: passenger.email }), _jsx("span", { children: passenger.phone_number })] })] }));
}
// ── View built from a fresh BookingConfirmation (just booked) ─────────────────
function ConfirmationFromState({ confirmation }) {
    const { offer, passengers, totalAmount, currency } = confirmation;
    const isReturn = offer.slices.length > 1;
    return (_jsxs(ConfirmationShell, { bookingRef: confirmation.bookingRef, status: "confirmed", children: [_jsxs(Section, { title: "Flight details", children: [offer.slices.map((slice, i) => (_jsxs("div", { children: [i > 0 && _jsx("div", { className: "border-t border-line/60 my-4" }), _jsx(SliceRow, { origin: slice.origin, originName: slice.originName, destination: slice.destination, destinationName: slice.destinationName, departureAt: slice.departureAt, arrivalAt: slice.arrivalAt, durationMinutes: slice.durationMinutes, stops: slice.stops, label: isReturn ? (i === 0 ? 'Outbound' : 'Return') : undefined })] }, i))), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx("div", { className: "w-7 h-7 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-[10px] font-bold text-green", children: offer.airlineCode }) }), _jsx("span", { className: "text-[13px] text-muted", children: offer.airlineName }), _jsx("span", { className: "ml-auto text-[12px] text-muted capitalize", children: offer.cabinClass.replace('_', ' ') })] })] }), _jsx(Section, { title: `Passenger${passengers.length > 1 ? 's' : ''}`, children: _jsx("div", { className: "space-y-4", children: passengers.map((p, i) => (_jsxs("div", { children: [i > 0 && _jsx("div", { className: "border-t border-line/60 pt-4" }), _jsx(PassengerCard, { passenger: p, index: i, total: passengers.length })] }, i))) }) }), _jsx(PriceSummary, { totalAmount: totalAmount, currency: currency })] }));
}
// ── View built from a fetched BookingDetail (from My Bookings) ────────────────
function ConfirmationFromDetail({ detail }) {
    const { sliceSummary, passengers, totalAmount, publicPrice, memberDiscount, discountPercent, currency, status, paidAt } = detail;
    const isReturn = sliceSummary.length > 1;
    return (_jsxs(ConfirmationShell, { bookingRef: detail.bookingRef, status: status, children: [_jsxs(Section, { title: "Flight details", children: [sliceSummary.map((slice, i) => (_jsxs("div", { children: [i > 0 && _jsx("div", { className: "border-t border-line/60 my-4" }), _jsx(SliceRow, { origin: slice.origin, destination: slice.destination, departureAt: slice.departureAt, arrivalAt: slice.arrivalAt, label: isReturn ? (i === 0 ? 'Outbound' : 'Return') : undefined })] }, i))), sliceSummary[0] && (_jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx("div", { className: "w-7 h-7 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-[10px] font-bold text-green", children: sliceSummary[0].airlineCode }) }), _jsx("span", { className: "text-[13px] text-muted", children: sliceSummary[0].airlineName })] }))] }), _jsx(Section, { title: `Passenger${passengers.length > 1 ? 's' : ''}`, children: _jsx("div", { className: "space-y-4", children: passengers.map((p, i) => (_jsxs("div", { children: [i > 0 && _jsx("div", { className: "border-t border-line/60 pt-4" }), _jsx(PassengerCard, { passenger: p, index: i, total: passengers.length })] }, i))) }) }), _jsx(PriceSummary, { totalAmount: totalAmount, publicPrice: publicPrice, memberDiscount: memberDiscount, discountPercent: discountPercent, currency: currency, paidAt: paidAt })] }));
}
// ── Shared layout pieces ──────────────────────────────────────────────────────
function Section({ title, children }) {
    return (_jsxs("div", { children: [_jsx("p", { className: "text-[11px] font-bold uppercase tracking-wide text-muted mb-3", children: title }), children] }));
}
function PriceSummary({ totalAmount, publicPrice, memberDiscount, discountPercent, currency, paidAt, }) {
    const hasMemberDiscount = (discountPercent ?? 0) > 0 && (memberDiscount ?? 0) > 0;
    return (_jsxs("div", { className: "border-t border-line pt-4 space-y-2 text-sm", children: [_jsx("p", { className: "text-[11px] font-bold uppercase tracking-wide text-muted mb-3", children: "Payment" }), hasMemberDiscount && publicPrice != null && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted", children: "Base fare" }), _jsx("span", { className: "text-navy line-through opacity-60", children: formatPrice(publicPrice, currency) })] }), _jsxs("div", { className: "flex justify-between text-green", children: [_jsxs("span", { children: ["Member discount (", discountPercent, "%)"] }), _jsxs("span", { children: ["\u2212", formatPrice(memberDiscount, currency)] })] })] })), _jsxs("div", { className: "flex justify-between items-baseline pt-1 border-t border-line/60", children: [_jsx("span", { className: "font-semibold text-navy", children: "Total paid" }), _jsx("span", { className: "text-xl font-bold text-navy", children: formatPrice(totalAmount, currency) })] }), paidAt && (_jsxs("div", { className: "flex justify-between text-muted", children: [_jsx("span", { children: "Payment date" }), _jsx("span", { children: new Date(paidAt).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) })] })), _jsxs("div", { className: "flex justify-between text-muted", children: [_jsx("span", { children: "Payment method" }), _jsx("span", { children: "Card" })] })] }));
}
function ConfirmationShell({ bookingRef, status, children, }) {
    return (_jsxs("div", { className: "min-h-screen bg-green-tint/30", children: [_jsxs("header", { className: "bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3", children: [_jsx(Link, { to: "/", className: "font-serif italic text-xl font-bold text-navy tracking-tight", children: "Travanora" }), _jsx("span", { className: "text-[12px] text-muted", children: "Booking details" })] }), _jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-10", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: `w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${status === 'confirmed'
                                    ? 'bg-green/10 border-2 border-green'
                                    : 'bg-red-50 border-2 border-red-200'}`, children: status === 'confirmed' ? (_jsx("svg", { width: "28", height: "28", viewBox: "0 0 28 28", fill: "none", children: _jsx("path", { d: "M5 14l6 6L23 8", stroke: "#00b67a", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) })) : (_jsx("svg", { width: "28", height: "28", viewBox: "0 0 28 28", fill: "none", children: _jsx("path", { d: "M8 8l12 12M20 8L8 20", stroke: "#ef4444", strokeWidth: "2.5", strokeLinecap: "round" }) })) }), _jsx("h1", { className: "text-2xl font-bold text-navy", children: status === 'confirmed' ? 'Booking confirmed!' : 'Booking cancelled' }), _jsx("p", { className: "text-muted mt-1 text-sm", children: "Booking reference" }), _jsx("p", { className: "text-3xl font-bold text-green tracking-widest mt-1", children: bookingRef })] }), _jsx("div", { className: "bg-white border border-line rounded-card p-6 space-y-6", children: children }), _jsxs("div", { className: "mt-6 flex items-center justify-center gap-4", children: [_jsx(Link, { to: "/me/bookings", className: "btn-ghost text-sm px-5 py-2.5", children: "My bookings" }), _jsx(Link, { to: "/", className: "btn-primary text-sm px-6 py-2.5", children: "Search more flights" })] })] })] }));
}
// ── Page entry point ──────────────────────────────────────────────────────────
export function ConfirmationPage() {
    const { bookingRef } = useParams();
    const location = useLocation();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const stateConfirmation = location.state?.confirmation;
    // Only fetch from API when there's no navigation state (e.g., arriving from My Bookings)
    const { data: fetched, isPending, error } = useBooking(!stateConfirmation && isAuthenticated ? (bookingRef ?? '') : '');
    if (stateConfirmation) {
        return _jsx(ConfirmationFromState, { confirmation: stateConfirmation });
    }
    if (isPending) {
        return (_jsx(ConfirmationShell, { bookingRef: bookingRef ?? '', status: "confirmed", children: _jsxs("div", { className: "flex items-center justify-center gap-3 py-8", children: [[0, 150, 300].map((d) => (_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-green animate-pulse-green", style: { animationDelay: `${d}ms` } }, d))), _jsx("span", { className: "text-muted text-sm ml-2", children: "Loading booking\u2026" })] }) }));
    }
    if (error || !fetched) {
        return (_jsx(ConfirmationShell, { bookingRef: bookingRef ?? '', status: "confirmed", children: _jsx("p", { className: "text-sm text-muted text-center py-6", children: error?.message ?? 'Booking details not available.' }) }));
    }
    return _jsx(ConfirmationFromDetail, { detail: fetched });
}
//# sourceMappingURL=ConfirmationPage.js.map