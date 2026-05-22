import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatDuration, formatPrice } from '@/lib/flightUtils.js';
function SummaryCard({ label, stat, active, isMember, onClick }) {
    const displayPrice = isMember ? stat.memberPrice : stat.price;
    return (_jsxs("button", { type: "button", onClick: onClick, className: `flex-1 text-left px-4 py-3 rounded-card border transition-all duration-200 ${active
            ? 'border-green bg-green-tint shadow-green-sm'
            : 'border-line bg-white hover:border-green/40 hover:bg-green-tint/50'}`, children: [_jsx("p", { className: `text-[12px] font-bold uppercase tracking-wide mb-1 ${active ? 'text-green' : 'text-muted'}`, children: label }), _jsx("p", { className: `text-lg font-bold tracking-tight ${active ? 'text-navy' : 'text-navy'}`, children: formatPrice(displayPrice, stat.currency) }), _jsx("p", { className: "text-[12px] text-muted mt-0.5", children: formatDuration(stat.durationMinutes) })] }));
}
export function SummaryCards({ best, cheapest, fastest, sort, isMember, onSort }) {
    if (!best || !cheapest || !fastest)
        return null;
    return (_jsxs("div", { className: "flex gap-2 mb-5", children: [_jsx(SummaryCard, { label: "Best", stat: best, active: sort === 'best', isMember: isMember, onClick: () => onSort('best') }), _jsx(SummaryCard, { label: "Cheapest", stat: cheapest, active: sort === 'cheapest', isMember: isMember, onClick: () => onSort('cheapest') }), _jsx(SummaryCard, { label: "Fastest", stat: fastest, active: sort === 'fastest', isMember: isMember, onClick: () => onSort('fastest') })] }));
}
//# sourceMappingURL=SummaryCards.js.map