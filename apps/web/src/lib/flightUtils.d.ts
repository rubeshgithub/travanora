import type { NormalisedOffer } from '@travanora/shared';
export type SortMode = 'best' | 'cheapest' | 'fastest';
export interface OfferGroup {
    key: string;
    representative: NormalisedOffer;
    fareCount: number;
    lowestPublicPrice: number;
    lowestMemberPrice: number;
    savings: number;
    totalDurationMinutes: number;
    outboundStops: number;
}
export declare function groupOffers(offers: NormalisedOffer[]): OfferGroup[];
export declare function sortGroups(groups: OfferGroup[], mode: SortMode): OfferGroup[];
export declare function filterGroups(groups: OfferGroup[], allowedStops: Set<number>): OfferGroup[];
export interface SummaryStat {
    price: number;
    memberPrice: number;
    currency: string;
    durationMinutes: number;
}
export declare function computeSummary(groups: OfferGroup[], offers: NormalisedOffer[]): {
    best: SummaryStat | null;
    cheapest: SummaryStat | null;
    fastest: SummaryStat | null;
};
export declare function stopPriceMap(groups: OfferGroup[]): Record<number, number>;
export declare function formatDuration(minutes: number): string;
export declare function formatPrice(amount: number, currency: string): string;
//# sourceMappingURL=flightUtils.d.ts.map