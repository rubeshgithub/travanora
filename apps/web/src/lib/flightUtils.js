// ── Grouping ──────────────────────────────────────────────────────────────────
function itineraryKey(offer) {
    // Group by the exact flight numbers on every slice — collapses fare variants
    return offer.slices
        .map((s) => s.segments.map((seg) => seg.flightNumber).join('-'))
        .join('|');
}
export function groupOffers(offers) {
    const map = new Map();
    for (const offer of offers) {
        const key = itineraryKey(offer);
        const bucket = map.get(key);
        if (bucket)
            bucket.push(offer);
        else
            map.set(key, [offer]);
    }
    return Array.from(map.entries()).map(([key, group]) => {
        const sorted = [...group].sort((a, b) => a.publicPrice - b.publicPrice);
        const cheapest = sorted[0];
        const totalDurationMinutes = cheapest.slices.reduce((sum, s) => sum + s.durationMinutes, 0);
        const outboundStops = cheapest.slices[0]?.stops ?? 0;
        return {
            key,
            representative: cheapest,
            fareCount: group.length,
            lowestPublicPrice: cheapest.publicPrice,
            lowestMemberPrice: cheapest.memberPrice,
            savings: cheapest.savings,
            totalDurationMinutes,
            outboundStops,
        };
    });
}
// ── Sorting ───────────────────────────────────────────────────────────────────
export function sortGroups(groups, mode) {
    return [...groups].sort((a, b) => {
        if (mode === 'cheapest')
            return a.lowestPublicPrice - b.lowestPublicPrice;
        if (mode === 'fastest')
            return a.totalDurationMinutes - b.totalDurationMinutes;
        // best: nonstop first, then by price within each stop tier
        if (a.outboundStops !== b.outboundStops)
            return a.outboundStops - b.outboundStops;
        return a.lowestPublicPrice - b.lowestPublicPrice;
    });
}
// ── Filtering ─────────────────────────────────────────────────────────────────
export function filterGroups(groups, allowedStops) {
    if (allowedStops.size === 0)
        return groups;
    return groups.filter((g) => {
        const bucket = g.outboundStops >= 2 ? 2 : g.outboundStops;
        return allowedStops.has(bucket);
    });
}
export function computeSummary(groups, offers) {
    if (groups.length === 0)
        return { best: null, cheapest: null, fastest: null };
    const currency = offers[0]?.currency ?? 'KWD';
    const toStat = (g) => ({
        price: g.lowestPublicPrice,
        memberPrice: g.lowestMemberPrice,
        currency,
        durationMinutes: g.totalDurationMinutes,
    });
    const cheapestGroup = [...groups].sort((a, b) => a.lowestPublicPrice - b.lowestPublicPrice)[0];
    const fastestGroup = [...groups].sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes)[0];
    const bestGroup = sortGroups(groups, 'best')[0];
    return {
        best: toStat(bestGroup),
        cheapest: toStat(cheapestGroup),
        fastest: toStat(fastestGroup),
    };
}
// ── Stop price map (cheapest price per stop count, for the filter sidebar) ────
export function stopPriceMap(groups) {
    const map = {};
    for (const g of groups) {
        const bucket = g.outboundStops >= 2 ? 2 : g.outboundStops;
        if (map[bucket] === undefined || g.lowestPublicPrice < map[bucket]) {
            map[bucket] = g.lowestPublicPrice;
        }
    }
    return map;
}
// ── Formatters ────────────────────────────────────────────────────────────────
export function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
export function formatPrice(amount, currency) {
    return `${currency} ${amount.toFixed(2)}`;
}
//# sourceMappingURL=flightUtils.js.map