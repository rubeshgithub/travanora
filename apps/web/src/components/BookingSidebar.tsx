import { formatPrice, formatDuration } from '@/lib/flightUtils.js';

interface SidebarSlice {
  origin: string;
  originName?: string;
  destination: string;
  destinationName?: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes?: number;
  stops?: number;
}

export interface BookingSidebarProps {
  slices: SidebarSlice[];
  airline: string;
  airlineCode: string;
  cabinClass?: string;
  publicPrice: number;
  memberDiscount: number;
  totalAmount: number;
  currency: string;
  discountPercent: number;
  passengerCount?: number;
  expiresAt?: string | Date;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { weekday: 'short', day: 'numeric', month: 'short' });
}

function SliceRow({ slice, label }: { slice: SidebarSlice; label?: string }) {
  return (
    <div>
      {label && <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1.5">{label}</p>}
      <div className="flex items-center gap-2.5">
        <div className="text-center min-w-0">
          <p className="text-base font-bold text-navy leading-none">{formatTime(slice.departureAt)}</p>
          <p className="text-[11px] font-semibold text-navy mt-0.5">{slice.originName ?? slice.origin}</p>
        </div>
        <div className="flex-1 flex flex-col items-center min-w-0">
          {slice.durationMinutes != null && (
            <p className="text-[10px] text-muted">{formatDuration(slice.durationMinutes)}</p>
          )}
          <div className="w-full h-px bg-line my-0.5" />
          <p className="text-[10px] text-muted">
            {(slice.stops ?? 0) === 0 ? 'Nonstop' : `${slice.stops} stop${(slice.stops ?? 0) > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="text-center min-w-0">
          <p className="text-base font-bold text-navy leading-none">{formatTime(slice.arrivalAt)}</p>
          <p className="text-[11px] font-semibold text-navy mt-0.5">{slice.destinationName ?? slice.destination}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted mt-1">{formatDate(slice.departureAt)}</p>
    </div>
  );
}

export function BookingSidebar({
  slices,
  airline,
  airlineCode,
  cabinClass,
  publicPrice,
  memberDiscount,
  totalAmount,
  currency,
  discountPercent,
  passengerCount = 1,
  expiresAt,
}: BookingSidebarProps) {
  const outbound = slices[0];
  const inbound = slices[1];
  const isMember = discountPercent > 0 && memberDiscount > 0;

  const expiryDate = expiresAt ? new Date(expiresAt) : null;
  const isExpiringSoon =
    expiryDate != null && expiryDate.getTime() - Date.now() < 15 * 60 * 1000;

  return (
    <div className="sticky top-20 bg-white border border-line rounded-card p-5 space-y-4">
      {/* Flight summary */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-3">Your flight</p>
        {outbound && <SliceRow slice={outbound} label={inbound ? 'Outbound' : undefined} />}
        {inbound && (
          <>
            <div className="border-t border-line/60 my-3" />
            <SliceRow slice={inbound} label="Return" />
          </>
        )}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-7 h-7 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-green">{airlineCode}</span>
          </div>
          <span className="text-[12px] text-muted">{airline}</span>
          {cabinClass && (
            <span className="ml-auto text-[11px] text-muted capitalize">{cabinClass.replace('_', ' ')}</span>
          )}
        </div>
      </div>

      {/* Price summary */}
      <div className="border-t border-line pt-4 space-y-2 text-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Price summary</p>
        <div className="flex justify-between">
          <span className="text-muted">
            Base fare ({passengerCount} {passengerCount === 1 ? 'pax' : 'pax'})
          </span>
          <span className="text-navy font-medium">{formatPrice(publicPrice, currency)}</span>
        </div>
        {isMember && (
          <div className="flex justify-between text-green">
            <span>Member {discountPercent}% off</span>
            <span>−{formatPrice(memberDiscount, currency)}</span>
          </div>
        )}
        <div className="border-t border-line pt-2 flex justify-between items-baseline">
          <span className="font-semibold text-navy">Total</span>
          <span className="text-xl font-bold text-navy">{formatPrice(totalAmount, currency)}</span>
        </div>
      </div>

      {isMember && (
        <div className="rounded-lg bg-green-tint border border-green/20 px-3 py-2 text-[12px] text-green font-medium text-center">
          You save {formatPrice(memberDiscount, currency)} with membership
        </div>
      )}

      <p className="text-[11px] text-muted text-center">Taxes &amp; fees included · No hidden charges</p>

      {isExpiringSoon && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-700 font-medium text-center">
          Offer expires soon — complete your booking
        </div>
      )}
    </div>
  );
}
