import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PassengerInputSchema } from '@travanora/shared';
import { ApiError } from '@/lib/api.js';
import { useOffer } from '@/features/bookings/useOffer.js';
import { useCreateOrder } from '@/features/bookings/useCreateOrder.js';
import { useAuthStore } from '@/features/auth/auth.store.js';
import { formatPrice, formatDuration } from '@/lib/flightUtils.js';
import { PhoneInput } from '@/components/PhoneInput.js';
const MultiPassengerSchema = z.object({
    passengers: z.array(PassengerInputSchema).min(1).max(9),
});
function blankPassenger() {
    return { title: 'mr', gender: 'm', given_name: '', family_name: '', born_on: '', email: '', phone_number: '' };
}
function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-KW', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-KW', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
export function BookingPage() {
    const { offerId } = useParams();
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    useEffect(() => {
        if (!isAuthenticated)
            navigate('/login', { replace: true });
    }, [isAuthenticated, navigate]);
    const { data, isPending, error } = useOffer(offerId ?? '');
    const { mutate: book, isPending: isBooking, error: bookError } = useCreateOrder();
    const [formReady, setFormReady] = useState(false);
    const { register, control, handleSubmit, setError, reset, formState: { errors }, } = useForm({
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
    function onSubmit(formData) {
        if (!offerId)
            return;
        book({ offerId, passengers: formData.passengers }, {
            onSuccess: (confirmation) => {
                navigate(`/booking/${confirmation.bookingRef}`, { state: { confirmation } });
            },
            onError: (err) => {
                if (err instanceof ApiError && err.details?.fields && formData.passengers.length === 1) {
                    for (const [field, message] of Object.entries(err.details.fields)) {
                        setError(`passengers.0.${field}`, { message });
                    }
                }
            },
        });
    }
    if (isPending)
        return _jsx(PageShell, { children: _jsx(LoadingState, {}) });
    if (error || !data)
        return _jsx(PageShell, { children: _jsx(ErrorState, { message: error?.message ?? 'Offer not found' }) });
    const { offer, isMember } = data;
    const displayPrice = isMember ? offer.memberPrice : offer.publicPrice;
    const outbound = offer.slices[0];
    const inbound = offer.slices[1];
    const pax = offer.passengerCount ?? 1;
    return (_jsx(PageShell, { children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 py-8", children: [_jsxs(Link, { to: "/", className: "inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy mb-6", children: [_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M10 3L5 8l5 5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }), "Back to results"] }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-6 items-start", children: [_jsxs("div", { className: "flex-1 min-w-0 space-y-5", children: [_jsxs("div", { className: "bg-white border border-line rounded-card p-5", children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted mb-4", children: "Your flight" }), outbound && _jsx(SliceSummary, { slice: outbound, label: inbound ? 'Outbound' : undefined, airline: offer.airlineName }), inbound && (_jsxs(_Fragment, { children: [_jsx("div", { className: "border-t border-line/60 my-4" }), _jsx(SliceSummary, { slice: inbound, label: "Return", airline: offer.airlineName })] })), _jsxs("div", { className: "mt-4 flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-green-tint border border-green/20 flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-[10px] font-bold text-green", children: offer.airlineCode }) }), _jsx("span", { className: "text-sm text-muted", children: offer.airlineName }), _jsx("span", { className: "ml-auto text-[12px] text-muted capitalize", children: offer.cabinClass.replace('_', ' ') }), pax > 1 && _jsxs("span", { className: "text-[12px] text-muted", children: [pax, " passengers"] })] })] }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [fields.map((field, i) => (_jsx(PassengerFormCard, { index: i, total: fields.length, register: register, control: control, errors: errors.passengers?.[i] }, field.id))), bookError && !(bookError instanceof ApiError && bookError.details?.fields) && (_jsx("div", { className: "rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600", children: bookError.message })), _jsx("button", { type: "submit", disabled: isBooking || !formReady, className: "btn-primary w-full py-3 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed", children: isBooking ? 'Confirming booking…' : `Confirm booking · ${formatPrice(displayPrice, offer.currency)}` })] })] }), _jsx("div", { className: "lg:w-72 flex-shrink-0 w-full", children: _jsxs("div", { className: "sticky top-20 bg-white border border-line rounded-card p-5 space-y-4", children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted", children: "Price summary" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { className: "text-muted", children: ["Base fare (", pax, " ", pax === 1 ? 'passenger' : 'passengers', ")"] }), _jsx("span", { className: "text-navy font-medium", children: formatPrice(offer.publicPrice, offer.currency) })] }), isMember && offer.savings > 0 && (_jsxs("div", { className: "flex justify-between text-green", children: [_jsx("span", { children: "Member discount (10%)" }), _jsxs("span", { children: ["\u2212", formatPrice(offer.savings, offer.currency)] })] }))] }), _jsxs("div", { className: "border-t border-line pt-3 flex justify-between items-baseline", children: [_jsx("span", { className: "font-semibold text-navy", children: "Total" }), _jsx("span", { className: "text-2xl font-bold text-navy", children: formatPrice(displayPrice, offer.currency) })] }), isMember && offer.savings > 0 && (_jsxs("div", { className: "rounded-lg bg-green-tint border border-green/20 px-3 py-2 text-[13px] text-green font-medium text-center", children: ["You save ", formatPrice(offer.savings, offer.currency), " with your membership"] })), !isMember && (_jsxs("p", { className: "text-[12px] text-muted text-center", children: [_jsx(Link, { to: "/register", className: "text-green font-semibold hover:underline", children: "Join free" }), ' ', "to save 10% on this booking"] })), _jsx("p", { className: "text-[11px] text-muted text-center", children: "Taxes and fees included \u00B7 No hidden charges" })] }) })] })] }) }));
}
function PassengerFormCard({ index, total, register, control, errors }) {
    const prefix = `passengers.${index}`;
    return (_jsxs("div", { className: "bg-white border border-line rounded-card p-5", children: [_jsx("p", { className: "text-[12px] font-bold uppercase tracking-wide text-muted mb-4", children: total === 1 ? 'Passenger details' : `Passenger ${index + 1}` }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Title" }), _jsxs("select", { ...register(`${prefix}.title`), className: "input-field mt-1", children: [_jsx("option", { value: "mr", children: "Mr" }), _jsx("option", { value: "ms", children: "Ms" }), _jsx("option", { value: "mrs", children: "Mrs" }), _jsx("option", { value: "miss", children: "Miss" }), _jsx("option", { value: "dr", children: "Dr" })] }), errors?.title && _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.title.message })] }), _jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Gender" }), _jsxs("select", { ...register(`${prefix}.gender`), className: "input-field mt-1", children: [_jsx("option", { value: "m", children: "Male" }), _jsx("option", { value: "f", children: "Female" })] }), errors?.gender && _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.gender.message })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label-text", children: "First name" }), _jsx("input", { ...register(`${prefix}.given_name`), className: "input-field mt-1", placeholder: "As on passport" }), errors?.given_name && _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.given_name.message })] }), _jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Last name" }), _jsx("input", { ...register(`${prefix}.family_name`), className: "input-field mt-1", placeholder: "As on passport" }), errors?.family_name && _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.family_name.message })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Date of birth" }), _jsx("input", { ...register(`${prefix}.born_on`), type: "date", className: "input-field mt-1" }), errors?.born_on && _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.born_on.message })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label-text", children: "Email" }), _jsx("input", { ...register(`${prefix}.email`), type: "email", className: "input-field mt-1", placeholder: "you@example.com" }), errors?.email && _jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.email.message })] }), _jsx(Controller, { control: control, name: `${prefix}.phone_number`, render: ({ field }) => (_jsx(PhoneInput, { label: "Phone", value: field.value, onChange: field.onChange, error: errors?.phone_number?.message })) })] })] })] }));
}
function SliceSummary({ slice, label }) {
    return (_jsxs("div", { children: [label && _jsx("p", { className: "text-[11px] font-bold uppercase tracking-wide text-muted mb-2", children: label }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl font-bold text-navy", children: formatTime(slice.departureAt) }), _jsx("p", { className: "text-[13px] font-semibold text-navy", children: slice.originName ?? slice.origin }), _jsx("p", { className: "text-[11px] text-muted", children: slice.origin })] }), _jsxs("div", { className: "flex-1 flex flex-col items-center", children: [_jsx("p", { className: "text-[11px] text-muted", children: formatDuration(slice.durationMinutes) }), _jsx("div", { className: "w-full h-px bg-line my-1" }), _jsx("p", { className: "text-[11px] text-muted", children: slice.stops === 0 ? 'Nonstop' : `${slice.stops} stop${slice.stops > 1 ? 's' : ''}` })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl font-bold text-navy", children: formatTime(slice.arrivalAt) }), _jsx("p", { className: "text-[13px] font-semibold text-navy", children: slice.destinationName ?? slice.destination }), _jsx("p", { className: "text-[11px] text-muted", children: slice.destination })] })] }), _jsx("p", { className: "text-[12px] text-muted mt-2", children: formatDate(slice.departureAt) })] }));
}
// ── Layout shell ───────────────────────────────────────────────────────────────
function PageShell({ children }) {
    return (_jsxs("div", { className: "min-h-screen bg-green-tint/30", children: [_jsxs("header", { className: "bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center", children: [_jsx(Link, { to: "/", className: "font-serif italic text-xl font-bold text-navy tracking-tight", children: "Travanora" }), _jsx("span", { className: "ml-3 text-[12px] text-muted", children: "Secure checkout" })] }), children] }));
}
function LoadingState() {
    return (_jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-3", children: [[0, 150, 300].map((d) => (_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-green animate-pulse-green", style: { animationDelay: `${d}ms` } }, d))), _jsx("span", { className: "text-muted text-sm ml-2", children: "Loading flight details\u2026" })] }));
}
function ErrorState({ message }) {
    return (_jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center", children: [_jsx("p", { className: "text-2xl mb-3", children: "\u26A0\uFE0F" }), _jsx("h3", { className: "font-semibold text-navy mb-1", children: "Could not load this offer" }), _jsx("p", { className: "text-muted text-sm mb-4", children: message }), _jsx(Link, { to: "/", className: "btn-primary text-sm px-5 py-2", children: "Back to search" })] }));
}
//# sourceMappingURL=BookingPage.js.map