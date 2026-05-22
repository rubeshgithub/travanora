import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { BookingPassengerSchema, getPhoneLength } from '@travanora/shared';
import { useOffer } from '@/features/bookings/useOffer.js';
import { useBookingDraft } from '@/features/bookings/useBookingDraft.js';
import { useBookingById } from '@/features/bookings/useBookingById.js';
import { ApiError } from '@/lib/api.js';
import { formatPrice } from '@/lib/flightUtils.js';
import { COUNTRIES } from '@/lib/countries.js';
import { COUNTRY_CODES } from '@/components/PhoneInput.js';
import { BookingSidebar } from '@/components/BookingSidebar.js';
import { Logo } from '@/components/Logo.js';
// ── Form schema ────────────────────────────────────────────────────────────────
const DraftFormSchema = z.object({
    passengers: z.array(BookingPassengerSchema).min(1).max(9),
});
const AGE_HINTS = {
    adult: 'Must be 12 years or older',
    child: 'Must be 2–11 years old',
    infant_without_seat: 'Must be under 2 years old',
};
function blankPassenger(type = 'adult') {
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
function draftPassengerToForm(pax) {
    return {
        type: pax.type ?? 'adult',
        title: pax.title ?? 'mr',
        firstName: pax.firstName ?? '',
        lastName: pax.lastName ?? '',
        dob: pax.dob ? pax.dob.split('T')[0] : '',
        gender: pax.gender ?? 'm',
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
    const { offerId } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const draftId = state?.draftId;
    const [formReady, setFormReady] = useState(false);
    const { data, isPending, error } = useOffer(offerId ?? '');
    const { data: existingDraft } = useBookingById(draftId);
    const { mutate: createDraft, isPending: isSubmitting, error: submitError } = useBookingDraft();
    const { register, control, handleSubmit, reset, formState: { errors }, } = useForm({
        resolver: zodResolver(DraftFormSchema),
        defaultValues: { passengers: [blankPassenger()] },
    });
    const { fields } = useFieldArray({ control, name: 'passengers' });
    useEffect(() => {
        if (formReady || !data)
            return;
        if (draftId && !existingDraft)
            return; // wait for draft to load
        const count = data.offer.passengerCount ?? 1;
        if (existingDraft && existingDraft.passengers.length > 0) {
            reset({ passengers: existingDraft.passengers.map(draftPassengerToForm) });
        }
        else {
            reset({ passengers: Array.from({ length: count }, (_, i) => blankPassenger(i === 0 ? 'adult' : 'adult')) });
        }
        setFormReady(true);
    }, [data, existingDraft, draftId, formReady, reset]);
    function onSubmit(formData) {
        if (!offerId)
            return;
        const firstPax = formData.passengers[0];
        const contactPhone = firstPax.phone.countryCode + firstPax.phone.number;
        createDraft({ offerId, passengers: formData.passengers, contactEmail: firstPax.email, contactPhone }, {
            onSuccess: (draft) => navigate(`/book/${draft.bookingId}/review`),
            onError: (err) => {
                toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
            },
        });
    }
    if (isPending)
        return _jsx(Shell, { children: _jsx(LoadingDots, {}) });
    if (error || !data)
        return _jsx(Shell, { children: _jsx(ErrorBlock, { message: error?.message ?? 'Offer not found' }) });
    const { offer, isMember } = data;
    const displayPrice = isMember ? offer.memberPrice : offer.publicPrice;
    const memberDiscount = offer.publicPrice - displayPrice;
    return (_jsx(Shell, { children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-8", children: [_jsxs(Link, { to: "/", className: "inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy mb-6", children: [_jsx(ChevronLeft, {}), "Back to search"] }), _jsx(StepIndicator, { current: 1 }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-6 items-start mt-6", children: [_jsx("div", { className: "flex-1 min-w-0 space-y-5", children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-5", noValidate: true, children: [fields.map((field, i) => (_jsx(PassengerFormCard, { index: i, total: fields.length, register: register, control: control, errors: errors.passengers?.[i] }, field.id))), submitError && !(submitError instanceof ApiError && submitError.details) && (_jsx("div", { className: "rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600", children: submitError instanceof ApiError ? submitError.message : 'Something went wrong' })), _jsx("button", { type: "submit", disabled: isSubmitting || !formReady, className: "btn-primary w-full py-3.5 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed", children: isSubmitting ? 'Saving…' : `Continue to review · ${formatPrice(displayPrice, offer.currency)}` })] }) }), _jsx("div", { className: "lg:w-72 flex-shrink-0 w-full", children: _jsx(BookingSidebar, { slices: offer.slices, airline: offer.airlineName, airlineCode: offer.airlineCode, cabinClass: offer.cabinClass, publicPrice: offer.publicPrice, memberDiscount: memberDiscount, totalAmount: displayPrice, currency: offer.currency, discountPercent: isMember ? 10 : 0, passengerCount: offer.passengerCount ?? 1, expiresAt: offer.expiresAt }) })] })] }) }));
}
function PassengerFormCard({ index, total, register, control, errors }) {
    const p = `passengers.${index}`;
    const isFirst = index === 0;
    const passengerType = useWatch({ control, name: `${p}.type` }) ?? 'adult';
    const countryCode = useWatch({ control, name: `${p}.phone.countryCode` }) ?? '+965';
    const { min: phoneMin, max: phoneMax } = getPhoneLength(countryCode);
    const phoneHint = phoneMin === phoneMax ? `${phoneMin} digits` : `${phoneMin}–${phoneMax} digits`;
    // Phone errors are nested under phone.number / phone.countryCode
    const phoneErrors = errors?.phone;
    return (_jsxs("div", { className: "bg-white border border-line rounded-card p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted", children: total === 1 ? 'Passenger details' : `Passenger ${index + 1}` }), isFirst ? (_jsx("span", { className: "text-[11px] font-semibold bg-navy text-green px-2 py-0.5 rounded-full", children: "Lead \u00B7 Adult" })) : (_jsxs("select", { ...register(`${p}.type`), className: "text-[12px] font-semibold border border-line rounded-pill px-2 py-0.5 text-navy bg-white focus:outline-none focus:ring-1 focus:ring-green/40", children: [_jsx("option", { value: "adult", children: "Adult (12+ yrs)" }), _jsx("option", { value: "child", children: "Child (2\u201311 yrs)" }), _jsx("option", { value: "infant_without_seat", children: "Infant (under 2 yrs)" })] }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Title" }), _jsxs("select", { ...register(`${p}.title`), className: "input-field mt-1", children: [_jsx("option", { value: "mr", children: "Mr" }), _jsx("option", { value: "ms", children: "Ms" }), _jsx("option", { value: "mrs", children: "Mrs" }), _jsx("option", { value: "miss", children: "Miss" }), _jsx("option", { value: "dr", children: "Dr" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Gender" }), _jsxs("select", { ...register(`${p}.gender`), className: "input-field mt-1", children: [_jsx("option", { value: "m", children: "Male" }), _jsx("option", { value: "f", children: "Female" })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label-text", children: "First name" }), _jsx("input", { ...register(`${p}.firstName`), className: `input-field mt-1 ${errors?.firstName ? 'input-field-error' : ''}`, placeholder: "As on passport", autoComplete: isFirst ? 'given-name' : 'off' }), errors?.firstName?.message && _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.firstName.message })] }), _jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Last name" }), _jsx("input", { ...register(`${p}.lastName`), className: `input-field mt-1 ${errors?.lastName ? 'input-field-error' : ''}`, placeholder: "As on passport", autoComplete: isFirst ? 'family-name' : 'off' }), errors?.lastName?.message && _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.lastName.message })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Date of birth" }), _jsx("input", { ...register(`${p}.dob`), type: "date", max: new Date().toISOString().split('T')[0], min: "1900-01-01", className: `input-field mt-1 ${errors?.dob ? 'input-field-error' : ''}` }), errors?.dob?.message
                                        ? _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.dob.message })
                                        : _jsx("p", { className: "text-[11px] text-muted mt-1", children: AGE_HINTS[passengerType] })] }), _jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Nationality" }), _jsxs("select", { ...register(`${p}.nationality`), className: `input-field mt-1 ${errors?.nationality ? 'input-field-error' : ''}`, children: [_jsx("option", { value: "", children: "Select country" }), COUNTRIES.map((c) => (_jsx("option", { value: c.code, children: c.name }, c.code)))] }), errors?.nationality?.message && _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.nationality.message })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Email" }), _jsx("input", { ...register(`${p}.email`), type: "email", className: `input-field mt-1 ${errors?.email ? 'input-field-error' : ''}`, placeholder: "you@example.com", autoComplete: isFirst ? 'email' : 'off' }), errors?.email?.message
                                ? _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.email.message })
                                : isFirst && _jsx("p", { className: "text-[11px] text-muted mt-1", children: "Booking confirmation will be sent here" })] }), _jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Phone" }), _jsxs("div", { className: "flex gap-2 mt-1", children: [_jsx(Controller, { control: control, name: `${p}.phone.countryCode`, render: ({ field }) => (_jsx("select", { value: field.value, onChange: (e) => field.onChange(e.target.value), className: "input-field w-28 flex-shrink-0", children: COUNTRY_CODES.map((c) => (_jsxs("option", { value: c.code, children: [c.flag, " ", c.code] }, `${c.code}-${c.label}`))) })) }), _jsx("input", { ...register(`${p}.phone.number`), type: "tel", inputMode: "numeric", placeholder: phoneMin === phoneMax ? `${phoneMin} digits` : `${phoneMin}–${phoneMax} digits`, className: `input-field flex-1 ${phoneErrors?.number ? 'input-field-error' : ''}` })] }), phoneErrors?.number?.message || phoneErrors?.countryCode?.message
                                ? _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: phoneErrors.number?.message ?? phoneErrors.countryCode?.message })
                                : _jsxs("p", { className: "text-[11px] text-muted mt-1", children: ["Expected: ", phoneHint] })] }), _jsx(PassportFields, { index: index, register: register, errors: errors })] })] }));
}
// ── Passport fields (collapsible) ──────────────────────────────────────────────
function PassportFields({ index, register, errors, }) {
    const [open, setOpen] = useState(false);
    const p = `passengers.${index}`;
    return (_jsxs("div", { className: "border-t border-line/60 pt-3", children: [_jsxs("button", { type: "button", onClick: () => setOpen((v) => !v), className: "flex items-center gap-1.5 text-[13px] text-muted hover:text-navy font-medium transition-colors", children: [_jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", className: `transition-transform ${open ? 'rotate-90' : ''}`, children: _jsx("path", { d: "M4 2l4 4-4 4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }), "Passport details (optional)"] }), open && (_jsxs("div", { className: "mt-3 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Passport number" }), _jsx("input", { ...register(`${p}.passportNumber`), className: "input-field mt-1", placeholder: "AB1234567" }), errors?.passportNumber?.message && (_jsx("p", { className: "text-[13px] text-red-500 mt-1", children: (errors?.passportNumber).message }))] }), _jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Expiry date" }), _jsx("input", { ...register(`${p}.passportExpiry`), type: "date", className: "input-field mt-1" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Issuing country" }), _jsxs("select", { ...register(`${p}.passportIssuingCountry`), className: "input-field mt-1", children: [_jsx("option", { value: "", children: "Select country" }), COUNTRIES.map((c) => (_jsx("option", { value: c.code, children: c.name }, c.code)))] })] })] }))] }));
}
// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
    const steps = [{ n: 1, label: 'Passengers' }, { n: 2, label: 'Review' }, { n: 3, label: 'Payment' }];
    return (_jsx("div", { className: "flex items-center", children: steps.map((step, i) => {
            const done = step.n < current;
            const active = step.n === current;
            return (_jsxs("div", { className: "flex items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${done ? 'bg-green text-amber-ink' : active ? 'bg-navy text-white' : 'bg-line text-muted'}`, children: done ? '✓' : step.n }), _jsx("span", { className: `text-[13px] font-medium hidden sm:inline ${active ? 'text-navy' : done ? 'text-green' : 'text-muted'}`, children: step.label })] }), i < steps.length - 1 && _jsx("div", { className: `mx-3 h-px w-8 sm:w-12 ${done ? 'bg-green' : 'bg-line'}` })] }, step.n));
        }) }));
}
// ── Layout shell + helpers ─────────────────────────────────────────────────────
function Shell({ children }) {
    return (_jsxs("div", { className: "min-h-screen bg-[var(--bg)]", children: [_jsxs("header", { className: "bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx(Logo, { size: 26 }), _jsx("span", { className: "font-bold text-navy tracking-tighter", children: "Travanora" })] }), _jsx("span", { className: "text-[12px] text-muted", children: "\u00B7 Secure checkout" })] }), children] }));
}
function LoadingDots() {
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-3", children: [[0, 150, 300].map((d) => (_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-green animate-pulse-green", style: { animationDelay: `${d}ms` } }, d))), _jsx("span", { className: "text-muted text-sm ml-2", children: "Loading flight details\u2026" })] }));
}
function ErrorBlock({ message }) {
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center", children: [_jsx("p", { className: "text-3xl mb-3", children: "\u2708\uFE0F" }), _jsx("h3", { className: "font-semibold text-navy mb-1", children: "Could not load this offer" }), _jsx("p", { className: "text-muted text-sm mb-4", children: message }), _jsx(Link, { to: "/", className: "btn-primary text-sm px-5 py-2", children: "Back to search" })] }));
}
function ChevronLeft() {
    return (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M10 3L5 8l5 5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
//# sourceMappingURL=BookingPassengersPage.js.map