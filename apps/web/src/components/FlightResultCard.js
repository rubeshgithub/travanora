import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { formatDuration, formatPrice } from '@/lib/flightUtils.js';
function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-KW', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}
function dayOffset(departure, arrival) {
    const depDate = new Date(departure).toDateString();
    const arrDate = new Date(arrival).toDateString();
    if (depDate === arrDate)
        return 0;
    const diff = new Date(arrival).getTime() - new Date(departure).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
function StopsLabel({ stops }) {
    if (stops === 0)
        return _jsx("span", { className: "text-green font-semibold text-[12px]", children: "Nonstop" });
    return (_jsxs("span", { className: "text-muted text-[12px]", children: [stops, " stop", stops > 1 ? 's' : ''] }));
}
function AirlineBadge({ code }) {
    return (_jsx("div", { className: "w-10 h-10 rounded-xl bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-[11px] font-bold text-green tracking-wide", children: code }) }));
}
export function FlightResultCard({ offer, isMember, fareCount }) {
    const outbound = offer.slices[0];
    const inbound = offer.slices[1];
    const hasSavings = isMember && offer.savings > 0;
    const displayPrice = isMember ? offer.memberPrice : offer.publicPrice;
    return (_jsx("article", { className: "card p-5 animate-fade-in", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-4", children: [_jsxs("div", { className: "flex-1 space-y-3 min-w-0", children: [outbound && (_jsx(SliceRow, { slice: outbound, code: offer.airlineCode, name: offer.airlineName })), inbound && (_jsx(SliceRow, { slice: inbound, code: offer.airlineCode, name: offer.airlineName, showDivider: true }))] }), _jsxs("div", { className: "flex sm:flex-col flex-row items-center sm:items-end justify-between sm:justify-start sm:min-w-[148px] sm:text-right gap-3 sm:gap-0", children: [_jsxs("div", { children: [fareCount > 1 && (_jsxs("p", { className: "text-[12px] text-muted mb-0.5", children: [fareCount, " fares from"] })), hasSavings ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-[13px] text-muted line-through leading-tight", children: formatPrice(offer.publicPrice, offer.currency) }), _jsx("p", { className: "text-xl font-bold text-navy leading-tight", children: formatPrice(offer.memberPrice, offer.currency) }), _jsxs("span", { className: "badge-saved mt-1 inline-flex", children: ["Saved ", formatPrice(offer.savings, offer.currency)] })] })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-xl font-bold text-navy leading-tight", children: formatPrice(displayPrice, offer.currency) }), !isMember && (_jsx(Link, { to: "/register", className: "text-[12px] font-semibold text-green hover:underline mt-0.5 block", children: "Join free \u00B7 save 10% \u2192" }))] }))] }), _jsx(Link, { to: `/book/${offer.id}`, className: "btn-primary text-[13px] px-5 py-2 mt-0 sm:mt-3 flex-shrink-0 text-center", children: "Select \u2192" })] })] }) }));
}
function SliceRow({ slice, code, name, showDivider }) {
    const firstSeg = slice.segments[0];
    const lastSeg = slice.segments[slice.segments.length - 1];
    const offset = firstSeg && lastSeg ? dayOffset(firstSeg.departureAt, lastSeg.arrivalAt) : 0;
    return (_jsxs("div", { children: [showDivider && _jsx("div", { className: "border-t border-line/60 my-3" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(AirlineBadge, { code: code }), _jsxs("div", { className: "flex-1 flex items-center gap-2 sm:gap-3 min-w-0", children: [_jsxs("div", { className: "text-center flex-shrink-0", children: [_jsx("p", { className: "text-[17px] font-bold text-navy leading-tight", children: slice.departureAt ? formatTime(slice.departureAt) : '--:--' }), _jsx("p", { className: "text-[12px] font-semibold text-navy", children: slice.originName ?? slice.origin }), _jsx("p", { className: "text-[11px] text-muted", children: slice.origin })] }), _jsxs("div", { className: "flex-1 flex flex-col items-center gap-0.5 min-w-0", children: [_jsx("p", { className: "text-[11px] text-muted font-medium", children: formatDuration(slice.durationMinutes) }), _jsxs("div", { className: "flex items-center w-full gap-1", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-muted/40 flex-shrink-0" }), _jsx("div", { className: "flex-1 h-px bg-line" }), slice.stops > 0 && (_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-muted/60 flex-shrink-0" })), _jsx("div", { className: "flex-1 h-px bg-line" }), _jsx("svg", { width: "7", height: "7", viewBox: "0 0 7 7", fill: "none", className: "flex-shrink-0", children: _jsx("path", { d: "M0 3.5H7M4 0.5L7 3.5L4 6.5", stroke: "#5b6b82", strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), _jsx(StopsLabel, { stops: slice.stops })] }), _jsxs("div", { className: "text-center flex-shrink-0 relative", children: [_jsxs("p", { className: "text-[17px] font-bold text-navy leading-tight", children: [slice.arrivalAt ? formatTime(slice.arrivalAt) : '--:--', offset > 0 && (_jsxs("sup", { className: "text-[10px] text-amber-500 font-bold ml-0.5", children: ["+", offset] }))] }), _jsx("p", { className: "text-[12px] font-semibold text-navy", children: slice.destinationName ?? slice.destination }), _jsx("p", { className: "text-[11px] text-muted", children: slice.destination })] })] }), _jsx("p", { className: "hidden lg:block text-[11px] text-muted w-20 text-right truncate flex-shrink-0", children: name })] })] }));
}
//# sourceMappingURL=FlightResultCard.js.map