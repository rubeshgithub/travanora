import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MemberShell } from '@/components/MemberShell.js';
import { fetchBookingById, type BookingSliceV2 } from '@/features/bookings/booking.api.js';
import { formatPrice } from '@/lib/flightUtils.js';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-KW', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SliceCard({ slice, label }: { slice: BookingSliceV2; label?: string }) {
  return (
    <div className="border border-line rounded-xl overflow-hidden">
      {label && (
        <div className="px-4 py-2.5 bg-surface border-b border-line">
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">{label}</p>
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-navy tracking-tight">{slice.origin}</p>
            <p className="text-[11px] text-muted">{formatDateTime(slice.departureAt)}</p>
          </div>
          <div className="flex-1 text-center">
            <div className="flex items-center gap-1">
              <div className="h-px flex-1 bg-line" />
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-muted">
                <path d="M1 7h12M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="h-px flex-1 bg-line" />
            </div>
            {slice.durationMinutes && (
              <p className="text-[11px] text-muted mt-0.5">
                {Math.floor(slice.durationMinutes / 60)}h {slice.durationMinutes % 60}m
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-navy tracking-tight">{slice.destination}</p>
            <p className="text-[11px] text-muted">{formatDateTime(slice.arrivalAt)}</p>
          </div>
        </div>

        {/* Segments */}
        {slice.segments && slice.segments.length > 0 && (
          <div className="space-y-2 pt-1">
            {slice.segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-3 text-[13px]">
                <div className="w-7 h-7 rounded-lg bg-green-tint flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-green">{seg.airlineCode}</span>
                </div>
                <p className="font-semibold text-navy">{seg.flightNumber}</p>
                <p className="text-muted">{seg.origin} → {seg.destination}</p>
                <p className="text-muted ml-auto">{formatDateTime(seg.departureAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TripDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-line rounded w-48" />
      <div className="h-40 bg-line rounded-xl" />
      <div className="h-32 bg-line rounded-xl" />
      <div className="h-24 bg-line rounded-xl" />
    </div>
  );
}

export function TripDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { data: booking, isPending, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBookingById(bookingId!),
    enabled: !!bookingId,
  });

  const whatsappUrl = `https://wa.me/96500000000?text=${encodeURIComponent(`Hi, I'd like to make a change to booking ${booking?.bookingRef ?? bookingId}`)}`;

  return (
    <MemberShell>
      <div className="space-y-5">
        {/* Back */}
        <Link to="/trips" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-navy transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to trips
        </Link>

        {isPending && <TripDetailSkeleton />}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
            Booking not found or you don&apos;t have access.
          </div>
        )}

        {booking && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-navy tracking-tight">
                  {booking.offerSnapshot?.slices[0]?.origin} → {booking.offerSnapshot?.slices[0]?.destination}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  {booking.bookingRef && (
                    <span className="text-[13px] font-mono text-muted">
                      Ref: <span className="text-navy font-semibold">{booking.bookingRef}</span>
                    </span>
                  )}
                  {booking.pnr && (
                    <span className="text-[13px] font-mono text-muted">
                      PNR: <span className="text-navy font-semibold">{booking.pnr}</span>
                    </span>
                  )}
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    booking.status === 'confirmed'
                      ? 'bg-green-tint text-green'
                      : 'bg-red-50 text-red-500'
                  }`}>
                    {booking.status === 'confirmed' ? 'Confirmed' : booking.status}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-bold text-navy">{formatPrice(booking.totalAmount, booking.currency)}</p>
                {booking.memberDiscount > 0 && (
                  <p className="text-[12px] text-green font-medium">
                    Saved {formatPrice(booking.memberDiscount, booking.currency)} ({booking.discountPercent}%)
                  </p>
                )}
              </div>
            </div>

            {/* Slices */}
            {booking.offerSnapshot?.slices?.map((slice, i) => (
              <SliceCard
                key={i}
                slice={slice}
                label={
                  booking.offerSnapshot!.slices.length > 1
                    ? i === 0 ? 'Outbound' : 'Return'
                    : undefined
                }
              />
            ))}

            {/* Passengers */}
            <div className="bg-white border border-line rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-line">
                <h2 className="text-[14px] font-semibold text-navy">Passengers</h2>
              </div>
              <div className="divide-y divide-line">
                {booking.passengers.map((p, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-navy">
                        {(p.firstName?.[0] ?? p.title[0] ?? '?').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-navy">
                        {p.title} {p.firstName} {p.lastName}
                      </p>
                      <p className="text-[12px] text-muted capitalize">
                        {p.type ?? 'adult'}
                        {p.dob && ` · Born ${formatDate(p.dob)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-line rounded-xl p-5 space-y-3">
              <h2 className="text-[14px] font-semibold text-navy">Need to make changes?</h2>
              <p className="text-[13px] text-muted">
                Contact us via WhatsApp for any changes, cancellations, or name corrections.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 btn-primary text-[13px] px-4 py-2.5"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 1.41.37 2.74 1.01 3.89L0 16l4.25-1.11A7.96 7.96 0 008 16c4.42 0 8-3.58 8-8s-3.58-8-8-8zm3.93 11.14c-.17.49-1 .94-1.38.99-.35.04-.8.06-1.29-.08a11.7 11.7 0 01-1.16-.43C6.3 10.7 4.9 8.8 4.79 8.65c-.11-.15-.9-1.2-.9-2.28s.57-1.62.78-1.84c.2-.22.44-.27.59-.27l.42.01c.14 0 .32-.05.5.38l.63 1.58c.06.15.1.32.01.51l-.22.44-.33.38c-.11.11-.23.23-.1.46.14.23.6.99 1.29 1.6.89.79 1.64 1.03 1.87 1.15.23.11.37.1.5-.06l.72-.85c.13-.17.26-.13.44-.08l1.56.73c.18.09.3.13.34.21.04.07.04.43-.13.92z" />
                  </svg>
                  Chat on WhatsApp
                </a>
                {booking.contactEmail && (
                  <a
                    href={`mailto:${booking.contactEmail}?subject=Booking ${booking.bookingRef ?? bookingId}`}
                    className="btn-ghost text-[13px] px-4 py-2.5"
                  >
                    Email us
                  </a>
                )}
              </div>
            </div>

            {/* Meta */}
            {booking.paidAt && (
              <p className="text-[12px] text-muted text-right">
                Paid {formatDateTime(booking.paidAt)}
                {booking.confirmedAt && ` · Confirmed ${formatDateTime(booking.confirmedAt)}`}
              </p>
            )}
          </>
        )}
      </div>
    </MemberShell>
  );
}
