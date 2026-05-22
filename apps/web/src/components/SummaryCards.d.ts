import type { SortMode, SummaryStat } from '@/lib/flightUtils.js';
interface SummaryCardsProps {
    best: SummaryStat | null;
    cheapest: SummaryStat | null;
    fastest: SummaryStat | null;
    sort: SortMode;
    isMember: boolean;
    onSort: (mode: SortMode) => void;
}
export declare function SummaryCards({ best, cheapest, fastest, sort, isMember, onSort }: SummaryCardsProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=SummaryCards.d.ts.map