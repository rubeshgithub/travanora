import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SearchForm } from '@/components/SearchForm.js';
import { FlightResultCard } from '@/components/FlightResultCard.js';
import { SummaryCards } from '@/components/SummaryCards.js';
import { useFlightSearch } from '@/features/flights/useFlightSearch.js';
import { useAuthStore } from '@/features/auth/auth.store.js';
import { groupOffers, sortGroups, filterGroups, computeSummary, stopPriceMap, formatPrice, } from '@/lib/flightUtils.js';
const STOP_LABELS = { 0: 'Nonstop', 1: '1 stop', 2: '2+ stops' };
export function SearchPage() {
    const { mutate: search, data, isPending, error, isSuccess } = useFlightSearch();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const resultsRef = useRef(null);
    // ── Filter / sort state ────────────────────────────────────────────────────
    const [sort, setSort] = useState('best');
    const [allowedStops, setAllowedStops] = useState(new Set([0, 1, 2]));
    const [filtersOpen, setFiltersOpen] = useState(false);
    // Reset filters when a new search comes in
    useEffect(() => {
        if (isSuccess) {
            setSort('best');
            setAllowedStops(new Set([0, 1, 2]));
        }
    }, [isSuccess]);
    // ── Derived data ───────────────────────────────────────────────────────────
    const allGroups = useMemo(() => (data ? groupOffers(data.offers) : []), [data]);
    const priceByStops = useMemo(() => stopPriceMap(allGroups), [allGroups]);
    const summary = useMemo(() => computeSummary(allGroups, data?.offers ?? []), [allGroups, data]);
    const displayGroups = useMemo(() => sortGroups(filterGroups(allGroups, allowedStops), sort), [allGroups, allowedStops, sort]);
    // ── Scroll to results when search fires ───────────────────────────────────
    useEffect(() => {
        if ((isPending || isSuccess) && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isPending, isSuccess]);
    function toggleStop(bucket) {
        setAllowedStops((prev) => {
            const next = new Set(prev);
            if (next.has(bucket))
                next.delete(bucket);
            else
                next.add(bucket);
            return next;
        });
    }
    return (_jsxs("main", { children: [_jsx("section", { className: "bg-green-tint border-b border-line py-5", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6", children: [_jsxs("h1", { className: "text-2xl sm:text-3xl font-bold text-navy tracking-tighter", children: ["Find flights.", ' ', _jsx("span", { className: "font-serif italic font-normal text-green", children: "Fly smarter." })] }), _jsx("p", { className: "text-sm text-muted mt-1", children: "Search hundreds of airlines \u00B7 members save 10% automatically" })] }) }), _jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 -mt-4 relative z-10", children: _jsx("div", { className: "bg-white border border-line rounded-card shadow-card-hover p-5", children: _jsx(SearchForm, { onSearch: (input) => search(input), isLoading: isPending }) }) }), _jsxs("div", { ref: resultsRef, className: "scroll-mt-4 mt-6 pb-12", children: [isPending && (_jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6", children: _jsx(LoadingSkeleton, {}) })), error && (_jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6", children: _jsx(ErrorState, { message: error.message }) })), isSuccess && data && (_jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6", children: [_jsx(SummaryCards, { best: summary.best, cheapest: summary.cheapest, fastest: summary.fastest, sort: sort, isMember: data.isMember, onSort: (mode) => setSort(mode) }), _jsxs("div", { className: "flex gap-6 items-start", children: [_jsx("aside", { className: "hidden lg:block w-52 flex-shrink-0", children: _jsx("div", { className: "sticky top-20 bg-white border border-line rounded-card p-4 space-y-5", children: _jsx(FilterPanel, { allGroups: allGroups, priceByStops: priceByStops, allowedStops: allowedStops, currency: data.offers[0]?.currency ?? 'KWD', onToggleStop: toggleStop }) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-3 flex-wrap gap-2", children: [_jsx("p", { className: "text-sm text-muted font-medium", children: displayGroups.length > 0
                                                            ? `${displayGroups.length} result${displayGroups.length !== 1 ? 's' : ''}`
                                                            : 'No results match your filters' }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { type: "button", onClick: () => setFiltersOpen((v) => !v), className: "lg:hidden btn-ghost text-[13px] px-3 py-1.5 gap-1.5", children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", children: _jsx("path", { d: "M1 3h12M3 7h8M5 11h4", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" }) }), "Filters"] }), data.isMember ? (_jsx("span", { className: "badge-member", children: "\u2713 10% discount applied" })) : (_jsx(Link, { to: "/register", className: "text-[13px] font-semibold text-green hover:underline", children: "Join free \u00B7 save 10% \u2192" }))] })] }), filtersOpen && (_jsx("div", { className: "lg:hidden bg-white border border-line rounded-card p-4 mb-4 space-y-5 animate-slide-up", children: _jsx(FilterPanel, { allGroups: allGroups, priceByStops: priceByStops, allowedStops: allowedStops, currency: data.offers[0]?.currency ?? 'KWD', onToggleStop: toggleStop }) })), displayGroups.length > 0 ? (_jsx("div", { className: "space-y-3", children: displayGroups.map((group) => (_jsx(FlightResultCard, { offer: group.representative, isMember: data.isMember, fareCount: group.fareCount }, group.key))) })) : (_jsx(EmptyState, { hasFilters: allowedStops.size < 3, onClear: () => setAllowedStops(new Set([0, 1, 2])) }))] })] })] })), !isPending && !isSuccess && !error && (_jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6", children: _jsx(SearchPrompt, { isAuthenticated: isAuthenticated }) }))] })] }));
}
function FilterPanel({ priceByStops, allowedStops, currency, onToggleStop }) {
    return (_jsxs("div", { children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted mb-3", children: "Stops" }), _jsx("div", { className: "space-y-2.5", children: [0, 1, 2].map((bucket) => {
                    const price = priceByStops[bucket];
                    const checked = allowedStops.has(bucket);
                    return (_jsxs("label", { className: "flex items-center justify-between gap-2 cursor-pointer group", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: `w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-green border-green' : 'border-line group-hover:border-green/40'}`, onClick: () => onToggleStop(bucket), children: checked && (_jsx("svg", { width: "10", height: "8", viewBox: "0 0 10 8", fill: "none", children: _jsx("path", { d: "M1 4l2.5 2.5L9 1", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })) }), _jsx("span", { className: `text-[14px] font-medium transition-colors ${checked ? 'text-navy' : 'text-muted'}`, onClick: () => onToggleStop(bucket), children: STOP_LABELS[bucket] })] }), price !== undefined && (_jsx("span", { className: "text-[12px] text-muted", children: formatPrice(price, currency) }))] }, bucket));
                }) })] }));
}
// ── Supporting components ──────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-center py-10 gap-3", children: [[0, 150, 300].map((delay) => (_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-green animate-pulse-green", style: { animationDelay: `${delay}ms` } }, delay))), _jsx("span", { className: "text-muted text-sm ml-2", children: "Searching flights\u2026" })] }), [1, 2, 3].map((i) => (_jsx("div", { className: "bg-white border border-line rounded-card p-5 animate-pulse", children: _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "w-10 h-10 bg-line rounded-xl flex-shrink-0" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx("div", { className: "h-4 bg-line rounded w-3/4" }), _jsx("div", { className: "h-3 bg-line rounded w-1/2" })] }), _jsxs("div", { className: "space-y-2 text-right", children: [_jsx("div", { className: "h-5 bg-line rounded w-20" }), _jsx("div", { className: "h-3 bg-line rounded w-16" })] })] }) }, i)))] }));
}
function EmptyState({ hasFilters, onClear }) {
    return (_jsxs("div", { className: "text-center py-16 border border-dashed border-line rounded-card", children: [_jsx("p", { className: "text-4xl mb-3", children: "\u2708\uFE0F" }), _jsx("h3", { className: "font-semibold text-navy text-lg", children: "No flights found" }), hasFilters ? (_jsxs("div", { className: "mt-2", children: [_jsx("p", { className: "text-muted text-sm", children: "Try adjusting your filters." }), _jsx("button", { onClick: onClear, className: "text-green text-sm font-semibold hover:underline mt-2", children: "Clear all filters" })] })) : (_jsx("p", { className: "text-muted text-sm mt-1", children: "Try different dates or a nearby airport." }))] }));
}
function ErrorState({ message }) {
    return (_jsxs("div", { className: "text-center py-12 border border-red-100 bg-red-50 rounded-card", children: [_jsx("p", { className: "text-2xl mb-3", children: "\u26A0\uFE0F" }), _jsx("h3", { className: "font-semibold text-navy", children: "Search failed" }), _jsx("p", { className: "text-muted text-sm mt-1", children: message })] }));
}
function SearchPrompt({ isAuthenticated }) {
    return (_jsx("div", { className: "text-center py-12", children: isAuthenticated ? (_jsx("p", { className: "text-muted text-sm", children: "Your 10% member discount will be applied to every result. \u2713" })) : (_jsxs("p", { className: "text-muted text-sm", children: [_jsx(Link, { to: "/register", className: "text-green font-semibold hover:underline", children: "Join free" }), ' ', "to see member prices \u2014 10% off every flight, automatically."] })) }));
}
//# sourceMappingURL=SearchPage.js.map