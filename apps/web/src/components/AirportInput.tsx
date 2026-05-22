import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api.js';

interface PlaceSuggestion {
  iataCode: string;
  name: string;
  cityName: string;
  countryName: string;
  type: string;
}

interface AirportInputProps {
  value: string;
  onChange: (iataCode: string) => void;
  /** Confirmed display text for the current value — parent owns this and swaps it */
  confirmedText: string;
  /** Called when user selects a suggestion, so parent can store the display label */
  onConfirm: (text: string) => void;
  placeholder?: string;
  label: string;
  error?: string;
}

function displayLabel(p: PlaceSuggestion): string {
  return `${p.cityName} (${p.iataCode})`;
}

export function AirportInput({
  value,
  onChange,
  confirmedText,
  onConfirm,
  placeholder,
  label,
  error,
}: AirportInputProps) {
  const [query, setQuery] = useState(confirmedText);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipFetchRef = useRef(confirmedText !== '');

  // Sync when parent changes confirmedText externally (e.g. swap button)
  // Must be declared BEFORE the fetch effect so skipFetchRef is set first
  useEffect(() => {
    setQuery(confirmedText);
    setSuggestions([]);
    setOpen(false);
    setFetchError(false);
    skipFetchRef.current = confirmedText !== '';
  }, [confirmedText]);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (skipFetchRef.current) return;

    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setFetchError(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const results = await api.get<PlaceSuggestion[]>(
          `/api/places/suggestions?query=${encodeURIComponent(query)}`,
        );
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIdx(-1);
      } catch (err) {
        console.error('[AirportInput] Failed to fetch suggestions:', err);
        setSuggestions([]);
        setFetchError(true);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = useCallback(
    (p: PlaceSuggestion) => {
      const text = displayLabel(p);
      skipFetchRef.current = true;
      setQuery(text);
      onChange(p.iataCode);
      onConfirm(text);
      setOpen(false);
      setSuggestions([]);
      setFetchError(false);
    },
    [onChange, onConfirm],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) select(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    skipFetchRef.current = false;
    onChange('');
    setQuery(e.target.value);
  }

  const showDropdown = open && (suggestions.length > 0 || fetchError);

  return (
    <div ref={containerRef} className="relative">
      <label className="label-text">{label}</label>
      <div
        className={`relative mt-1 flex items-center input-field gap-2 ${error ? 'input-field-error' : ''} ${open ? 'ring-2 ring-green/30 border-green' : ''}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted flex-shrink-0">
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            fill="currentColor"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[15px] font-semibold text-navy placeholder:text-muted/50 placeholder:font-normal min-w-0"
          autoComplete="off"
        />
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-green/30 border-t-green rounded-full animate-spin flex-shrink-0" />
        )}
      </div>

      {error && <p className="text-[13px] text-red-500 mt-1">{error}</p>}

      {showDropdown && (
        <ul
          className="absolute left-0 right-0 mt-1 bg-white border border-line rounded-xl shadow-lg max-h-60 overflow-y-auto"
          style={{ zIndex: 9999, top: '100%' }}
        >
          {fetchError ? (
            <li className="px-4 py-3 text-[13px] text-muted">
              Could not load suggestions. Check your connection.
            </li>
          ) : (
            suggestions.map((p, i) => (
              <li key={p.iataCode}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(p); }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    i === activeIdx ? 'bg-green-tint' : 'hover:bg-surface'
                  }`}
                >
                  <span className="w-10 text-center text-[12px] font-bold text-green bg-green-tint rounded px-1.5 py-0.5 flex-shrink-0">
                    {p.iataCode}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-navy truncate">{p.cityName}</span>
                    <span className="block text-[12px] text-muted truncate">
                      {p.name} · {p.countryName}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
