import { useRef, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SearchForm } from '@/components/SearchForm.js';
import { FlightResultCard } from '@/components/FlightResultCard.js';
import { SummaryCards } from '@/components/SummaryCards.js';
import { useFlightSearch } from '@/features/flights/useFlightSearch.js';
import { useAuthStore } from '@/features/auth/auth.store.js';
import {
  groupOffers,
  sortGroups,
  filterGroups,
  computeSummary,
  stopPriceMap,
  formatPrice,
  type SortMode,
} from '@/lib/flightUtils.js';
import type { FlightSearchInput } from '@travanora/shared';

const STOP_LABELS: Record<number, string> = { 0: 'Nonstop', 1: '1 stop', 2: '2+ stops' };

export function SearchPage() {
  const { mutate: search, data, isPending, error, isSuccess } = useFlightSearch();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const member = useAuthStore((s) => s.member);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Filter / sort state ────────────────────────────────────────────────────
  const [sort, setSort] = useState<SortMode>('best');
  const [allowedStops, setAllowedStops] = useState<Set<number>>(new Set([0, 1, 2]));
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Reset filters when a new search comes in
  useEffect(() => {
    if (isSuccess) {
      setSort('best');
      setAllowedStops(new Set([0, 1, 2]));
    }
  }, [isSuccess]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const allGroups = useMemo(
    () => (data ? groupOffers(data.offers) : []),
    [data],
  );

  const priceByStops = useMemo(() => stopPriceMap(allGroups), [allGroups]);

  const summary = useMemo(
    () => computeSummary(allGroups, data?.offers ?? []),
    [allGroups, data],
  );

  const displayGroups = useMemo(
    () => sortGroups(filterGroups(allGroups, allowedStops), sort),
    [allGroups, allowedStops, sort],
  );

  // ── Scroll to results when search fires ───────────────────────────────────
  useEffect(() => {
    if ((isPending || isSuccess) && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isPending, isSuccess]);

  function toggleStop(bucket: number) {
    setAllowedStops((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) next.delete(bucket);
      else next.add(bucket);
      return next;
    });
  }

  return (
    <main>
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-green-tint border-b border-line py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tighter">
            Find flights.{' '}
            <span className="font-serif italic font-normal text-green">Fly smarter.</span>
          </h1>
          <p className="text-sm text-muted mt-1">Search hundreds of airlines · members save 10% automatically</p>
        </div>
      </section>

      {/* ── Search card ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4 relative z-10">
        <div className="bg-white border border-line rounded-card shadow-card-hover p-5">
          <SearchForm onSearch={(input: FlightSearchInput) => search(input)} isLoading={isPending} />
        </div>
      </div>

      {/* ── Results area ────────────────────────────────────────────────────── */}
      <div ref={resultsRef} className="scroll-mt-4 mt-6 pb-12">
        {isPending && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <LoadingSkeleton />
          </div>
        )}

        {error && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ErrorState message={error.message} />
          </div>
        )}

        {isSuccess && data && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* ── Summary cards ─────────────────────────────────────────────── */}
            <SummaryCards
              best={summary.best}
              cheapest={summary.cheapest}
              fastest={summary.fastest}
              sort={sort}
              isMember={data.isMember}
              onSort={(mode) => setSort(mode)}
            />

            <div className="flex gap-6 items-start">
              {/* ── Filter sidebar — desktop ───────────────────────────────── */}
              <aside className="hidden lg:block w-52 flex-shrink-0">
                <div className="sticky top-20 bg-white border border-line rounded-card p-4 space-y-5">
                  <FilterPanel
                    allGroups={allGroups}
                    priceByStops={priceByStops}
                    allowedStops={allowedStops}
                    currency={data.offers[0]?.currency ?? 'KWD'}
                    onToggleStop={toggleStop}
                  />
                </div>
              </aside>

              {/* ── Results column ────────────────────────────────────────── */}
              <div className="flex-1 min-w-0">
                {/* Results header */}
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-sm text-muted font-medium">
                    {displayGroups.length > 0
                      ? `${displayGroups.length} result${displayGroups.length !== 1 ? 's' : ''}`
                      : 'No results match your filters'}
                  </p>

                  <div className="flex items-center gap-3">
                    {/* Mobile filters toggle */}
                    <button
                      type="button"
                      onClick={() => setFiltersOpen((v) => !v)}
                      className="lg:hidden btn-ghost text-[13px] px-3 py-1.5 gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      Filters
                    </button>

                    {data.isMember ? (
                      <span className="badge-member">✓ 10% discount applied</span>
                    ) : (
                      <Link to="/register" className="text-[13px] font-semibold text-green hover:underline">
                        Join free · save 10% →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Mobile filter panel */}
                {filtersOpen && (
                  <div className="lg:hidden bg-white border border-line rounded-card p-4 mb-4 space-y-5 animate-slide-up">
                    <FilterPanel
                      allGroups={allGroups}
                      priceByStops={priceByStops}
                      allowedStops={allowedStops}
                      currency={data.offers[0]?.currency ?? 'KWD'}
                      onToggleStop={toggleStop}
                    />
                  </div>
                )}

                {/* Offer list */}
                {displayGroups.length > 0 ? (
                  <div className="space-y-3">
                    {displayGroups.map((group) => (
                      <FlightResultCard
                        key={group.key}
                        offer={group.representative}
                        isMember={data.isMember}
                        fareCount={group.fareCount}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState hasFilters={allowedStops.size < 3} onClear={() => setAllowedStops(new Set([0, 1, 2]))} />
                )}
              </div>
            </div>
          </div>
        )}

        {!isPending && !isSuccess && !error && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SearchPrompt isAuthenticated={isAuthenticated} />
          </div>
        )}
      </div>
    </main>
  );
}

// ── Filter panel (used in both sidebar + mobile sheet) ─────────────────────────

interface FilterPanelProps {
  allGroups: ReturnType<typeof groupOffers>;
  priceByStops: Record<number, number>;
  allowedStops: Set<number>;
  currency: string;
  onToggleStop: (bucket: number) => void;
}

function FilterPanel({ priceByStops, allowedStops, currency, onToggleStop }: FilterPanelProps) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-wide text-muted mb-3">Stops</p>
      <div className="space-y-2.5">
        {([0, 1, 2] as const).map((bucket) => {
          const price = priceByStops[bucket];
          const checked = allowedStops.has(bucket);
          return (
            <label key={bucket} className="flex items-center justify-between gap-2 cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    checked ? 'bg-green border-green' : 'border-line group-hover:border-green/40'
                  }`}
                  onClick={() => onToggleStop(bucket)}
                >
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-[14px] font-medium transition-colors ${checked ? 'text-navy' : 'text-muted'}`}
                  onClick={() => onToggleStop(bucket)}
                >
                  {STOP_LABELS[bucket]}
                </span>
              </div>
              {price !== undefined && (
                <span className="text-[12px] text-muted">{formatPrice(price, currency)}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Supporting components ──────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center py-10 gap-3">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2.5 h-2.5 rounded-full bg-green animate-pulse-green"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
        <span className="text-muted text-sm ml-2">Searching flights…</span>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-line rounded-card p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-line rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-line rounded w-3/4" />
              <div className="h-3 bg-line rounded w-1/2" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-5 bg-line rounded w-20" />
              <div className="h-3 bg-line rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="text-center py-16 border border-dashed border-line rounded-card">
      <p className="text-4xl mb-3">✈️</p>
      <h3 className="font-semibold text-navy text-lg">No flights found</h3>
      {hasFilters ? (
        <div className="mt-2">
          <p className="text-muted text-sm">Try adjusting your filters.</p>
          <button onClick={onClear} className="text-green text-sm font-semibold hover:underline mt-2">
            Clear all filters
          </button>
        </div>
      ) : (
        <p className="text-muted text-sm mt-1">Try different dates or a nearby airport.</p>
      )}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 border border-red-100 bg-red-50 rounded-card">
      <p className="text-2xl mb-3">⚠️</p>
      <h3 className="font-semibold text-navy">Search failed</h3>
      <p className="text-muted text-sm mt-1">{message}</p>
    </div>
  );
}

function SearchPrompt({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="text-center py-12">
      {isAuthenticated ? (
        <p className="text-muted text-sm">Your 10% member discount will be applied to every result. ✓</p>
      ) : (
        <p className="text-muted text-sm">
          <Link to="/register" className="text-green font-semibold hover:underline">Join free</Link>{' '}
          to see member prices — 10% off every flight, automatically.
        </p>
      )}
    </div>
  );
}
