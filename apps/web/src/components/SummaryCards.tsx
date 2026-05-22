import type { SortMode, SummaryStat } from '@/lib/flightUtils.js';
import { formatDuration, formatPrice } from '@/lib/flightUtils.js';

interface SummaryCardsProps {
  best: SummaryStat | null;
  cheapest: SummaryStat | null;
  fastest: SummaryStat | null;
  sort: SortMode;
  isMember: boolean;
  onSort: (mode: SortMode) => void;
}

interface CardProps {
  label: string;
  stat: SummaryStat;
  active: boolean;
  isMember: boolean;
  onClick: () => void;
}

function SummaryCard({ label, stat, active, isMember, onClick }: CardProps) {
  const displayPrice = isMember ? stat.memberPrice : stat.price;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-left px-4 py-3 rounded-card border transition-all duration-200 ${
        active
          ? 'border-green bg-green-tint shadow-green-sm'
          : 'border-line bg-white hover:border-green/40 hover:bg-green-tint/50'
      }`}
    >
      <p className={`text-[12px] font-bold uppercase tracking-wide mb-1 ${active ? 'text-green' : 'text-muted'}`}>
        {label}
      </p>
      <p className={`text-lg font-bold tracking-tight ${active ? 'text-navy' : 'text-navy'}`}>
        {formatPrice(displayPrice, stat.currency)}
      </p>
      <p className="text-[12px] text-muted mt-0.5">{formatDuration(stat.durationMinutes)}</p>
    </button>
  );
}

export function SummaryCards({ best, cheapest, fastest, sort, isMember, onSort }: SummaryCardsProps) {
  if (!best || !cheapest || !fastest) return null;

  return (
    <div className="flex gap-2 mb-5">
      <SummaryCard label="Best" stat={best} active={sort === 'best'} isMember={isMember} onClick={() => onSort('best')} />
      <SummaryCard label="Cheapest" stat={cheapest} active={sort === 'cheapest'} isMember={isMember} onClick={() => onSort('cheapest')} />
      <SummaryCard label="Fastest" stat={fastest} active={sort === 'fastest'} isMember={isMember} onClick={() => onSort('fastest')} />
    </div>
  );
}
