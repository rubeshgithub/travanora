import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store.js';
import { useMyBookings } from '@/features/bookings/useMyBookings.js';
import { formatPrice } from '@/lib/flightUtils.js';
function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatBookedOn(iso) {
    return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}
function RouteTag({ slice }) {
    return (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "font-bold text-navy", children: slice.origin }), _jsx("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", className: "text-muted flex-shrink-0", children: _jsx("path", { d: "M1 7h12M8 3l4 4-4 4", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }), _jsx("span", { className: "font-bold text-navy", children: slice.destination }), _jsx("span", { className: "text-muted", children: "\u00B7" }), _jsx("span", { className: "text-muted", children: formatDate(slice.departureAt) }), _jsx("span", { className: "text-muted", children: "\u00B7" }), _jsx("span", { className: "text-muted", children: formatTime(slice.departureAt) })] }));
}
function BookingCard({ booking }) {
    const outbound = booking.sliceSummary[0];
    const inbound = booking.sliceSummary[1];
    const isReturn = !!inbound;
    return (_jsx("article", { className: "bg-white border border-line rounded-card p-5 hover:shadow-card-hover transition-shadow duration-200", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0 space-y-2.5", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-[11px] font-bold text-green", children: outbound?.airlineCode ?? '??' }) }), _jsxs("div", { children: [_jsx("p", { className: "text-[13px] font-semibold text-navy", children: outbound?.airlineName ?? 'Unknown airline' }), _jsx("p", { className: "text-[11px] text-muted", children: isReturn ? 'Return flight' : 'One way' })] }), _jsx("span", { className: `ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${booking.status === 'confirmed'
                                        ? 'bg-green-tint text-green'
                                        : booking.status === 'payment_succeeded_booking_failed'
                                            ? 'bg-amber-50 text-amber-600'
                                            : 'bg-red-50 text-red-500'}`, children: booking.status === 'confirmed'
                                        ? 'Confirmed'
                                        : booking.status === 'payment_succeeded_booking_failed'
                                            ? 'Action needed'
                                            : 'Cancelled' })] }), outbound && _jsx(RouteTag, { slice: outbound }), inbound && _jsx(RouteTag, { slice: inbound }), _jsxs("p", { className: "text-[12px] text-muted", children: [booking.bookingRef
                                    ? _jsxs(_Fragment, { children: ["Ref: ", _jsx("span", { className: "font-mono font-semibold text-navy tracking-wide", children: booking.bookingRef }), _jsx("span", { className: "mx-1.5", children: "\u00B7" })] })
                                    : null, "Booked ", formatBookedOn(booking.createdAt)] }), booking.status === 'payment_succeeded_booking_failed' && (_jsx("p", { className: "text-[12px] text-amber-600 bg-amber-50 rounded px-2 py-1", children: "Payment received but booking failed \u2014 please contact support." }))] }), _jsxs("div", { className: "sm:text-right flex sm:flex-col flex-row items-center sm:items-end justify-between gap-3 sm:gap-1 flex-shrink-0", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold text-navy leading-tight", children: formatPrice(booking.totalAmount, booking.currency) }), booking.savings > 0 && (_jsxs("p", { className: "text-[12px] text-green font-medium mt-0.5", children: ["Saved ", formatPrice(booking.savings, booking.currency)] }))] }), booking.bookingRef && (_jsx(Link, { to: `/booking/${booking.bookingRef}`, className: "btn-ghost text-[13px] px-4 py-2 flex-shrink-0", children: "View details \u2192" }))] })] }) }));
}
export function MyBookingsPage() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const { data: bookings, isPending, error } = useMyBookings();
    useEffect(() => {
        if (!isAuthenticated)
            navigate('/login', { replace: true });
    }, [isAuthenticated, navigate]);
    return (_jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 py-10", children: [_jsxs("div", { className: "mb-7", children: [_jsx("h1", { className: "text-2xl font-bold text-navy tracking-tight", children: "My Bookings" }), _jsx("p", { className: "text-muted text-sm mt-1", children: "Your confirmed and past flights" })] }), isPending && _jsx(LoadingSkeleton, {}), error && (_jsx("div", { className: "rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600", children: error.message })), !isPending && !error && bookings && bookings.length === 0 && (_jsx(EmptyState, {})), bookings && bookings.length > 0 && (_jsx("div", { className: "space-y-4", children: bookings.map((b) => (_jsx(BookingCard, { booking: b }, b.id))) }))] }));
}
function LoadingSkeleton() {
    return (_jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => (_jsx("div", { className: "bg-white border border-line rounded-card p-5 animate-pulse", children: _jsxs("div", { className: "flex gap-3 items-start", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-line flex-shrink-0" }), _jsxs("div", { className: "flex-1 space-y-2.5", children: [_jsx("div", { className: "h-4 bg-line rounded w-40" }), _jsx("div", { className: "h-3 bg-line rounded w-64" }), _jsx("div", { className: "h-3 bg-line rounded w-48" }), _jsx("div", { className: "h-3 bg-line rounded w-32" })] }), _jsxs("div", { className: "space-y-2 text-right", children: [_jsx("div", { className: "h-5 bg-line rounded w-20" }), _jsx("div", { className: "h-3 bg-line rounded w-14" })] })] }) }, i))) }));
}
function EmptyState() {
    return (_jsxs("div", { className: "text-center py-20 border border-dashed border-line rounded-card", children: [_jsx("p", { className: "text-4xl mb-4", children: "\u2708\uFE0F" }), _jsx("h3", { className: "font-semibold text-navy text-lg", children: "No bookings yet" }), _jsx("p", { className: "text-muted text-sm mt-1 mb-5", children: "Book your first flight to see it here." }), _jsx(Link, { to: "/", className: "btn-primary text-sm px-6 py-2.5", children: "Search flights" })] }));
}
//# sourceMappingURL=MyBookingsPage.js.map