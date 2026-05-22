import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray, Controller, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PassengerInputSchema, type PassengerInput } from '@travanora/shared';
import { ApiError } from '@/lib/api.js';
import { useOffer } from '@/features/bookings/useOffer.js';
import { useCreateOrder } from '@/features/bookings/useCreateOrder.js';
import { useAuthStore } from '@/features/auth/auth.store.js';
import { formatPrice, formatDuration } from '@/lib/flightUtils.js';
import { PhoneInput } from '@/components/PhoneInput.js';

const MultiPassengerSchema = z.object({
  passengers: z.array(PassengerInputSchema).min(1).max(9),
});
type MultiPassengerForm = z.infer<typeof MultiPassengerSchema>;

function blankPassenger(): PassengerInput {
  return { title: 'mr', gender: 'm', given_name: '', family_name: '', born_on: '', email: '', phone_number: '' };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KW', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function BookingPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  const { data, isPending, error } = useOffer(offerId ?? '');
  const { mutate: book, isPending: isBooking, error: bookError } = useCreateOrder();
  const [formReady, setFormReady] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<MultiPassengerForm>({
    resolver: zodResolver(MultiPassengerSchema),
    defaultValues: { passengers: [blankPassenger()] },
  });

  const { fields } = useFieldArray({ control, name: 'passengers' });

  // Initialise form with the correct number of passenger slots once the offer loads
  useEffect(() => {
    if (data && !formReady) {
      const count = data.offer.passengerCount ?? 1;
      reset({ passengers: Array.from({ length: count }, blankPassenger) });
      setFormReady(true);
    }
  }, [data, formReady, reset]);

  function onSubmit(formData: MultiPassengerForm) {
    if (!offerId) return;
    book(
      { offerId, passengers: formData.passengers },
      {
        onSuccess: (confirmation) => {
          navigate(`/booking/${confirmation.bookingRef}`, { state: { confirmation } });
        },
        onError: (err) => {
          if (err instanceof ApiError && err.details?.fields && formData.passengers.length === 1) {
            for (const [field, message] of Object.entries(err.details.fields)) {
              setError(`passengers.0.${field}` as Parameters<typeof setError>[0], { message });
            }
          }
        },
      },
    );
  }

  if (isPending) return <PageShell><LoadingState /></PageShell>;
  if (error || !data) return <PageShell><ErrorState message={error?.message ?? 'Offer not found'} /></PageShell>;

  const { offer, isMember } = data;
  const displayPrice = isMember ? offer.memberPrice : offer.publicPrice;
  const outbound = offer.slices[0];
  const inbound = offer.slices[1];
  const pax = offer.passengerCount ?? 1;

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy mb-6">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to results
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Left: Flight summary + passenger forms ────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Flight summary card */}
            <div className="bg-white border border-line rounded-card p-5">
              <p className="text-[12px] font-bold uppercase tracking-wide text-muted mb-4">Your flight</p>
              {outbound && <SliceSummary slice={outbound} label={inbound ? 'Outbound' : undefined} airline={offer.airlineName} />}
              {inbound && (
                <>
                  <div className="border-t border-line/60 my-4" />
                  <SliceSummary slice={inbound} label="Return" airline={offer.airlineName} />
                </>
              )}
              <div className="mt-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-green">{offer.airlineCode}</span>
                </div>
                <span className="text-sm text-muted">{offer.airlineName}</span>
                <span className="ml-auto text-[12px] text-muted capitalize">{offer.cabinClass.replace('_', ' ')}</span>
                {pax > 1 && <span className="text-[12px] text-muted">{pax} passengers</span>}
              </div>
            </div>

            {/* Passenger forms */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((field, i) => (
                <PassengerFormCard
                  key={field.id}
                  index={i}
                  total={fields.length}
                  register={register}
                  control={control}
                  errors={errors.passengers?.[i]}
                />
              ))}

              {bookError && !(bookError instanceof ApiError && bookError.details?.fields) && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {bookError.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isBooking || !formReady}
                className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isBooking ? 'Confirming booking…' : `Confirm booking · ${formatPrice(displayPrice, offer.currency)}`}
              </button>
            </form>
          </div>

          {/* ── Right: Price summary ──────────────────────────────────────── */}
          <div className="lg:w-72 flex-shrink-0 w-full">
            <div className="sticky top-20 bg-white border border-line rounded-card p-5 space-y-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Price summary</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">
                    Base fare ({pax} {pax === 1 ? 'passenger' : 'passengers'})
                  </span>
                  <span className="text-navy font-medium">{formatPrice(offer.publicPrice, offer.currency)}</span>
                </div>
                {isMember && offer.savings > 0 && (
                  <div className="flex justify-between text-green">
                    <span>Member discount (10%)</span>
                    <span>−{formatPrice(offer.savings, offer.currency)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-line pt-3 flex justify-between items-baseline">
                <span className="font-semibold text-navy">Total</span>
                <span className="text-2xl font-bold text-navy">{formatPrice(displayPrice, offer.currency)}</span>
              </div>

              {isMember && offer.savings > 0 && (
                <div className="rounded-lg bg-green-tint border border-green/20 px-3 py-2 text-[13px] text-green font-medium text-center">
                  You save {formatPrice(offer.savings, offer.currency)} with your membership
                </div>
              )}

              {!isMember && (
                <p className="text-[12px] text-muted text-center">
                  <Link to="/register" className="text-green font-semibold hover:underline">Join free</Link>{' '}
                  to save 10% on this booking
                </p>
              )}

              <p className="text-[11px] text-muted text-center">
                Taxes and fees included · No hidden charges
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ── Passenger form card ────────────────────────────────────────────────────────

interface PassengerFormCardProps {
  index: number;
  total: number;
  register: ReturnType<typeof useForm<MultiPassengerForm>>['register'];
  control: Control<MultiPassengerForm>;
  errors: Partial<Record<keyof PassengerInput, { message?: string }>> | undefined;
}

function PassengerFormCard({ index, total, register, control, errors }: PassengerFormCardProps) {
  const prefix = `passengers.${index}` as const;

  return (
    <div className="bg-white border border-line rounded-card p-5">
      <p className="text-[12px] font-bold uppercase tracking-wide text-muted mb-4">
        {total === 1 ? 'Passenger details' : `Passenger ${index + 1}`}
      </p>
      <div className="space-y-4">
        {/* Title + Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Title</label>
            <select {...register(`${prefix}.title`)} className="input-field mt-1">
              <option value="mr">Mr</option>
              <option value="ms">Ms</option>
              <option value="mrs">Mrs</option>
              <option value="miss">Miss</option>
              <option value="dr">Dr</option>
            </select>
            {errors?.title && <p className="text-[13px] text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label-text">Gender</label>
            <select {...register(`${prefix}.gender`)} className="input-field mt-1">
              <option value="m">Male</option>
              <option value="f">Female</option>
            </select>
            {errors?.gender && <p className="text-[13px] text-red-500 mt-1">{errors.gender.message}</p>}
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">First name</label>
            <input {...register(`${prefix}.given_name`)} className="input-field mt-1" placeholder="As on passport" />
            {errors?.given_name && <p className="text-[13px] text-red-500 mt-1">{errors.given_name.message}</p>}
          </div>
          <div>
            <label className="label-text">Last name</label>
            <input {...register(`${prefix}.family_name`)} className="input-field mt-1" placeholder="As on passport" />
            {errors?.family_name && <p className="text-[13px] text-red-500 mt-1">{errors.family_name.message}</p>}
          </div>
        </div>

        {/* DOB */}
        <div>
          <label className="label-text">Date of birth</label>
          <input {...register(`${prefix}.born_on`)} type="date" className="input-field mt-1" />
          {errors?.born_on && <p className="text-[13px] text-red-500 mt-1">{errors.born_on.message}</p>}
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Email</label>
            <input {...register(`${prefix}.email`)} type="email" className="input-field mt-1" placeholder="you@example.com" />
            {errors?.email && <p className="text-[13px] text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <Controller
            control={control}
            name={`${prefix}.phone_number`}
            render={({ field }) => (
              <PhoneInput
                label="Phone"
                value={field.value}
                onChange={field.onChange}
                error={errors?.phone_number?.message}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}

// ── Slice summary ──────────────────────────────────────────────────────────────

interface SliceSummaryProps {
  slice: { origin: string; originName?: string; destination: string; destinationName?: string; departureAt: string; arrivalAt: string; durationMinutes: number; stops: number };
  label?: string;
  airline: string;
}

function SliceSummary({ slice, label }: SliceSummaryProps) {
  return (
    <div>
      {label && <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">{label}</p>}
      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-xl font-bold text-navy">{formatTime(slice.departureAt)}</p>
          <p className="text-[13px] font-semibold text-navy">{slice.originName ?? slice.origin}</p>
          <p className="text-[11px] text-muted">{slice.origin}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <p className="text-[11px] text-muted">{formatDuration(slice.durationMinutes)}</p>
          <div className="w-full h-px bg-line my-1" />
          <p className="text-[11px] text-muted">{slice.stops === 0 ? 'Nonstop' : `${slice.stops} stop${slice.stops > 1 ? 's' : ''}`}</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-navy">{formatTime(slice.arrivalAt)}</p>
          <p className="text-[13px] font-semibold text-navy">{slice.destinationName ?? slice.destination}</p>
          <p className="text-[11px] text-muted">{slice.destination}</p>
        </div>
      </div>
      <p className="text-[12px] text-muted mt-2">{formatDate(slice.departureAt)}</p>
    </div>
  );
}

// ── Layout shell ───────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-green-tint/30">
      <header className="bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center">
        <Link to="/" className="font-serif italic text-xl font-bold text-navy tracking-tight">
          Travanora
        </Link>
        <span className="ml-3 text-[12px] text-muted">Secure checkout</span>
      </header>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-3">
      {[0, 150, 300].map((d) => (
        <span key={d} className="w-2.5 h-2.5 rounded-full bg-green animate-pulse-green" style={{ animationDelay: `${d}ms` }} />
      ))}
      <span className="text-muted text-sm ml-2">Loading flight details…</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
      <p className="text-2xl mb-3">⚠️</p>
      <h3 className="font-semibold text-navy mb-1">Could not load this offer</h3>
      <p className="text-muted text-sm mb-4">{message}</p>
      <Link to="/" className="btn-primary text-sm px-5 py-2">Back to search</Link>
    </div>
  );
}
