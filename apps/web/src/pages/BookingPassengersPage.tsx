import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { BookingPassengerSchema, getPhoneLength, type BookingPassenger } from '@travanora/shared';
import type { FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useOffer } from '@/features/bookings/useOffer.js';
import { useBookingDraft } from '@/features/bookings/useBookingDraft.js';
import { useBookingById } from '@/features/bookings/useBookingById.js';
import type { BookingPassengerV2 } from '@/features/bookings/booking.api.js';
import { ApiError } from '@/lib/api.js';
import { formatPrice } from '@/lib/flightUtils.js';
import { COUNTRIES } from '@/lib/countries.js';
import { COUNTRY_CODES } from '@/components/PhoneInput.js';
import { BookingSidebar } from '@/components/BookingSidebar.js';
import { Logo } from '@/components/Logo.js';
import { usePassengers } from '@/features/passengers/usePassengers.js';
import type { SavedPassenger } from '@/features/passengers/passenger.api.js';
import { useAuthStore } from '@/features/auth/auth.store.js';

// ── Form schema ────────────────────────────────────────────────────────────────

const DraftFormSchema = z.object({
  passengers: z.array(BookingPassengerSchema).min(1).max(9),
});
type DraftFormData = z.infer<typeof DraftFormSchema>;

const AGE_HINTS: Record<string, string> = {
  adult: 'Must be 12 years or older',
  child: 'Must be 2–11 years old',
  infant_without_seat: 'Must be under 2 years old',
};

function blankPassenger(type: BookingPassenger['type'] = 'adult'): BookingPassenger {
  return {
    type,
    title: 'mr',
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'm',
    nationality: 'KW',
    email: '',
    phone: { countryCode: '+965', number: '' },
  };
}

function draftPassengerToForm(pax: BookingPassengerV2): BookingPassenger {
  return {
    type: (pax.type as BookingPassenger['type']) ?? 'adult',
    title: (pax.title as BookingPassenger['title']) ?? 'mr',
    firstName: pax.firstName ?? '',
    lastName: pax.lastName ?? '',
    dob: pax.dob ? pax.dob.split('T')[0]! : '',
    gender: (pax.gender as 'm' | 'f') ?? 'm',
    nationality: pax.nationality ?? 'KW',
    passportNumber: pax.passportNumber,
    passportExpiry: pax.passportExpiry,
    passportIssuingCountry: pax.passportIssuingCountry,
    email: pax.email,
    phone: pax.phone ?? { countryCode: '+965', number: '' },
  };
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function BookingPassengersPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { draftId?: string } };
  const draftId = state?.draftId;
  const [formReady, setFormReady] = useState(false);

  const { data, isPending, error } = useOffer(offerId ?? '');
  const { data: existingDraft } = useBookingById(draftId);
  const { mutate: createDraft, isPending: isSubmitting, error: submitError } = useBookingDraft();
  const { data: savedPassengers = [] } = usePassengers();
  const user = useAuthStore((s) => s.user);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DraftFormData>({
    resolver: zodResolver(DraftFormSchema),
    defaultValues: { passengers: [blankPassenger()] },
  });

  const { fields } = useFieldArray({ control, name: 'passengers' });

  useEffect(() => {
    if (formReady || !data) return;
    if (draftId && !existingDraft) return; // wait for draft to load

    const count = data.offer.passengerCount ?? 1;

    if (existingDraft && existingDraft.passengers.length > 0) {
      reset({ passengers: existingDraft.passengers.map(draftPassengerToForm) });
    } else {
      reset({
        passengers: Array.from({ length: count }, (_, i) => {
          const pax = blankPassenger('adult');
          if (i === 0 && user?.email) pax.email = user.email;
          return pax;
        }),
      });
    }
    setFormReady(true);
  }, [data, existingDraft, draftId, formReady, reset, user]);

  function onSubmit(formData: DraftFormData) {
    if (!offerId) return;

    const firstPax = formData.passengers[0]!;
    const contactPhone = firstPax.phone.countryCode + firstPax.phone.number;

    createDraft(
      { offerId, passengers: formData.passengers, contactEmail: firstPax.email, contactPhone },
      {
        onSuccess: (draft) => navigate(`/book/${draft.bookingId}/review`),
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
        },
      },
    );
  }

  if (isPending) return <Shell><LoadingDots /></Shell>;
  if (error || !data) return <Shell><ErrorBlock message={error?.message ?? 'Offer not found'} /></Shell>;

  const { offer, isMember } = data;
  const displayPrice = isMember ? offer.memberPrice : offer.publicPrice;
  const memberDiscount = offer.publicPrice - displayPrice;

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy mb-6">
          <ChevronLeft />
          Back to search
        </Link>

        <StepIndicator current={1} />

        <div className="flex flex-col lg:flex-row gap-6 items-start mt-6">
          {/* ── Left: passenger forms ────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {fields.map((field, i) => (
                <PassengerFormCard
                  key={field.id}
                  index={i}
                  total={fields.length}
                  register={register}
                  control={control}
                  setValue={setValue}
                  errors={errors.passengers?.[i]}
                  savedPassengers={savedPassengers}
                />
              ))}

              {submitError && !(submitError instanceof ApiError && (submitError as ApiError).details) && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {submitError instanceof ApiError ? submitError.message : 'Something went wrong'}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !formReady}
                className="btn-primary w-full py-3.5 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving…' : `Continue to review · ${formatPrice(displayPrice, offer.currency)}`}
              </button>
            </form>
          </div>

          {/* ── Right: sidebar ───────────────────────────────────────────── */}
          <div className="lg:w-72 flex-shrink-0 w-full">
            <BookingSidebar
              slices={offer.slices}
              airline={offer.airlineName}
              airlineCode={offer.airlineCode}
              cabinClass={offer.cabinClass}
              publicPrice={offer.publicPrice}
              memberDiscount={memberDiscount}
              totalAmount={displayPrice}
              currency={offer.currency}
              discountPercent={isMember ? 10 : 0}
              passengerCount={offer.passengerCount ?? 1}
              expiresAt={offer.expiresAt}
            />
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ── Passenger form card ────────────────────────────────────────────────────────

interface PassengerFormCardProps {
  index: number;
  total: number;
  register: ReturnType<typeof useForm<DraftFormData>>['register'];
  control: ReturnType<typeof useForm<DraftFormData>>['control'];
  setValue: UseFormSetValue<DraftFormData>;
  errors: FieldErrors<BookingPassenger> | undefined;
  savedPassengers: SavedPassenger[];
}

function PassengerFormCard({ index, total, register, control, setValue, errors, savedPassengers }: PassengerFormCardProps) {
  const p = `passengers.${index}` as const;
  const isFirst = index === 0;
  const [pickerOpen, setPickerOpen] = useState(false);

  const passengerType = useWatch({ control, name: `${p}.type` }) ?? 'adult';
  const countryCode = useWatch({ control, name: `${p}.phone.countryCode` }) ?? '+965';
  const { min: phoneMin, max: phoneMax } = getPhoneLength(countryCode);
  const phoneHint = phoneMin === phoneMax ? `${phoneMin} digits` : `${phoneMin}–${phoneMax} digits`;

  // Phone errors are nested under phone.number / phone.countryCode
  const phoneErrors = errors?.phone as { number?: { message?: string }; countryCode?: { message?: string } } | undefined;

  function fillFromSaved(pax: SavedPassenger) {
    setValue(`${p}.title`, (pax.title as BookingPassenger['title']) ?? 'mr', { shouldValidate: false });
    setValue(`${p}.firstName`, pax.firstName, { shouldValidate: false });
    setValue(`${p}.lastName`, pax.lastName, { shouldValidate: false });
    setValue(`${p}.dob`, pax.dob ? pax.dob.split('T')[0]! : '', { shouldValidate: false });
    setValue(`${p}.gender`, (pax.gender as 'm' | 'f') ?? 'm', { shouldValidate: false });
    setValue(`${p}.nationality`, pax.nationality ?? 'KW', { shouldValidate: false });
    if (pax.passportNumber) setValue(`${p}.passportNumber`, pax.passportNumber, { shouldValidate: false });
    if (pax.passportExpiry) setValue(`${p}.passportExpiry`, pax.passportExpiry.split('T')[0]!, { shouldValidate: false });
    if (pax.passportIssuingCountry) setValue(`${p}.passportIssuingCountry`, pax.passportIssuingCountry, { shouldValidate: false });
    setPickerOpen(false);
  }

  return (
    <div className="bg-white border border-line rounded-card p-5">
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold uppercase tracking-wide text-muted">
          {total === 1 ? 'Passenger details' : `Passenger ${index + 1}`}
        </p>
        {isFirst ? (
          <span className="text-[11px] font-semibold bg-navy text-green px-2 py-0.5 rounded-full">
            Lead · Adult
          </span>
        ) : (
          <select
            {...register(`${p}.type`)}
            className="text-[12px] font-semibold border border-line rounded-pill px-2 py-0.5 text-navy bg-white focus:outline-none focus:ring-1 focus:ring-green/40"
          >
            <option value="adult">Adult (12+ yrs)</option>
            <option value="child">Child (2–11 yrs)</option>
            <option value="infant_without_seat">Infant (under 2 yrs)</option>
          </select>
        )}
      </div>

      {/* Saved passenger picker */}
      {savedPassengers.length > 0 && (
        <div className="mb-4 relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-green hover:text-green/80 border border-green/30 bg-green-tint px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5.5" cy="4" r="2.5" />
              <path d="M1 11c0-2.5 2-4.5 4.5-4.5" />
              <path d="M9 8v4M7 10h4" />
            </svg>
            Fill from saved passenger
          </button>

          {pickerOpen && (
            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-line rounded-xl shadow-lg w-72 py-1 max-h-60 overflow-y-auto">
              {savedPassengers.map((pax) => (
                <button
                  key={pax.id}
                  type="button"
                  onClick={() => fillFromSaved(pax)}
                  className="w-full text-left px-4 py-2.5 hover:bg-surface transition-colors"
                >
                  <p className="text-[13px] font-semibold text-navy">{pax.firstName} {pax.lastName}</p>
                  <p className="text-[11px] text-muted capitalize">{pax.relationship.replace('_', ' ')} · {pax.nationality}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Title + Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Title</label>
            <select {...register(`${p}.title`)} className="input-field mt-1">
              <option value="mr">Mr</option>
              <option value="ms">Ms</option>
              <option value="mrs">Mrs</option>
              <option value="miss">Miss</option>
              <option value="dr">Dr</option>
            </select>
          </div>
          <div>
            <label className="label-text">Gender</label>
            <select {...register(`${p}.gender`)} className="input-field mt-1">
              <option value="m">Male</option>
              <option value="f">Female</option>
            </select>
          </div>
        </div>

        {/* First name + Last name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">First name</label>
            <input
              {...register(`${p}.firstName`)}
              className={`input-field mt-1 ${errors?.firstName ? 'input-field-error' : ''}`}
              placeholder="As on passport"
              autoComplete={isFirst ? 'given-name' : 'off'}
            />
            {errors?.firstName?.message && <p className="text-[13px] text-red-500 mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="label-text">Last name</label>
            <input
              {...register(`${p}.lastName`)}
              className={`input-field mt-1 ${errors?.lastName ? 'input-field-error' : ''}`}
              placeholder="As on passport"
              autoComplete={isFirst ? 'family-name' : 'off'}
            />
            {errors?.lastName?.message && <p className="text-[13px] text-red-500 mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* DOB + Nationality */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Date of birth</label>
            <input
              {...register(`${p}.dob`)}
              type="date"
              max={new Date().toISOString().split('T')[0]}
              min="1900-01-01"
              className={`input-field mt-1 ${errors?.dob ? 'input-field-error' : ''}`}
            />
            {errors?.dob?.message
              ? <p className="text-[13px] text-red-500 mt-1">{errors.dob.message}</p>
              : <p className="text-[11px] text-muted mt-1">{AGE_HINTS[passengerType]}</p>
            }
          </div>
          <div>
            <label className="label-text">Nationality</label>
            <select
              {...register(`${p}.nationality`)}
              className={`input-field mt-1 ${errors?.nationality ? 'input-field-error' : ''}`}
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {errors?.nationality?.message && <p className="text-[13px] text-red-500 mt-1">{errors.nationality.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="label-text">Email</label>
          <input
            {...register(`${p}.email`)}
            type="email"
            className={`input-field mt-1 ${errors?.email ? 'input-field-error' : ''}`}
            placeholder="you@example.com"
            autoComplete={isFirst ? 'email' : 'off'}
          />
          {errors?.email?.message
            ? <p className="text-[13px] text-red-500 mt-1">{errors.email.message}</p>
            : isFirst && <p className="text-[11px] text-muted mt-1">Booking confirmation will be sent here</p>
          }
        </div>

        {/* Phone */}
        <div>
          <label className="label-text">Phone</label>
          <div className="flex gap-2 mt-1">
            <Controller
              control={control}
              name={`${p}.phone.countryCode`}
              render={({ field }) => (
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="input-field w-28 flex-shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={`${c.code}-${c.label}`} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              )}
            />
            <input
              {...register(`${p}.phone.number`)}
              type="tel"
              inputMode="numeric"
              placeholder={phoneMin === phoneMax ? `${phoneMin} digits` : `${phoneMin}–${phoneMax} digits`}
              className={`input-field flex-1 ${phoneErrors?.number ? 'input-field-error' : ''}`}
            />
          </div>
          {phoneErrors?.number?.message || phoneErrors?.countryCode?.message
            ? <p className="text-[13px] text-red-500 mt-1">{phoneErrors.number?.message ?? phoneErrors.countryCode?.message}</p>
            : <p className="text-[11px] text-muted mt-1">Expected: {phoneHint}</p>
          }
        </div>

        {/* Passport (optional, collapsible) */}
        <PassportFields index={index} register={register} errors={errors} />
      </div>
    </div>
  );
}

// ── Passport fields (collapsible) ──────────────────────────────────────────────

function PassportFields({
  index,
  register,
  errors,
}: {
  index: number;
  register: ReturnType<typeof useForm<DraftFormData>>['register'];
  errors: FieldErrors<BookingPassenger> | undefined;
}) {
  const [open, setOpen] = useState(false);
  const p = `passengers.${index}` as const;

  return (
    <div className="border-t border-line/60 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[13px] text-muted hover:text-navy font-medium transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${open ? 'rotate-90' : ''}`}>
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Passport details (optional)
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Passport number</label>
              <input {...register(`${p}.passportNumber`)} className="input-field mt-1" placeholder="AB1234567" />
              {(errors?.passportNumber as { message?: string } | undefined)?.message && (
                <p className="text-[13px] text-red-500 mt-1">{(errors?.passportNumber as { message?: string }).message}</p>
              )}
            </div>
            <div>
              <label className="label-text">Expiry date</label>
              <input {...register(`${p}.passportExpiry`)} type="date" className="input-field mt-1" />
            </div>
          </div>
          <div>
            <label className="label-text">Issuing country</label>
            <select {...register(`${p}.passportIssuingCountry`)} className="input-field mt-1">
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [{ n: 1, label: 'Passengers' }, { n: 2, label: 'Review' }, { n: 3, label: 'Payment' }];
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done = step.n < current;
        const active = step.n === current;
        return (
          <div key={step.n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${done ? 'bg-green text-amber-ink' : active ? 'bg-navy text-white' : 'bg-line text-muted'}`}>
                {done ? '✓' : step.n}
              </div>
              <span className={`text-[13px] font-medium hidden sm:inline ${active ? 'text-navy' : done ? 'text-green' : 'text-muted'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && <div className={`mx-3 h-px w-8 sm:w-12 ${done ? 'bg-green' : 'bg-line'}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Layout shell + helpers ─────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-bold text-navy tracking-tighter">Travanora</span>
        </Link>
        <span className="text-[12px] text-muted">· Secure checkout</span>
      </header>
      {children}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-3">
      {[0, 150, 300].map((d) => (
        <span key={d} className="w-2.5 h-2.5 rounded-full bg-green animate-pulse-green" style={{ animationDelay: `${d}ms` }} />
      ))}
      <span className="text-muted text-sm ml-2">Loading flight details…</span>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
      <p className="text-3xl mb-3">✈️</p>
      <h3 className="font-semibold text-navy mb-1">Could not load this offer</h3>
      <p className="text-muted text-sm mb-4">{message}</p>
      <Link to="/" className="btn-primary text-sm px-5 py-2">Back to search</Link>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
