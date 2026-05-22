import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlightSearchSchema } from '@travanora/shared';
import { AirportInput } from './AirportInput.js';
const cabinOptions = [
    { value: 'economy', label: 'Economy' },
    { value: 'premium_economy', label: 'Premium' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First' },
];
function defaultDate(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().slice(0, 10);
}
export function SearchForm({ onSearch, isLoading }) {
    const { register, handleSubmit, control, watch, setValue, formState: { errors }, } = useForm({
        resolver: zodResolver(FlightSearchSchema),
        defaultValues: {
            tripType: 'return',
            origin: 'KWI',
            destination: '',
            departDate: defaultDate(14),
            returnDate: defaultDate(21),
            passengers: 1,
            cabinClass: 'economy',
        },
    });
    const tripType = watch('tripType');
    const cabinClass = watch('cabinClass');
    const [originText, setOriginText] = useState('Kuwait (KWI)');
    const [destText, setDestText] = useState('');
    return (_jsxs("form", { onSubmit: handleSubmit(onSearch), className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [_jsxs("div", { className: "flex gap-1 bg-surface border border-line rounded-pill p-1", children: [['return', 'one_way'].map((type) => (_jsx("button", { type: "button", onClick: () => setValue('tripType', type), className: `px-4 py-1.5 rounded-pill text-[13px] font-semibold transition-all duration-200 ${tripType === type
                                    ? 'bg-green text-amber-ink shadow-green-sm'
                                    : 'text-muted hover:text-navy'}`, children: type === 'return' ? 'Return' : 'One way' }, type))), _jsx("button", { type: "button", className: "px-4 py-1.5 rounded-pill text-[13px] font-semibold text-muted/40 cursor-not-allowed", title: "Coming soon", children: "Multi-city" })] }), _jsx("div", { className: "flex gap-1 bg-surface border border-line rounded-pill p-1", children: cabinOptions.map(({ value, label }) => (_jsx("button", { type: "button", onClick: () => setValue('cabinClass', value), className: `px-3 py-1.5 rounded-pill text-[13px] font-semibold transition-all duration-200 ${cabinClass === value
                                ? 'bg-green text-amber-ink shadow-green-sm'
                                : 'text-muted hover:text-navy'}`, children: label }, value))) })] }), _jsxs("div", { className: "flex items-end gap-2 flex-wrap lg:flex-nowrap", children: [_jsx("div", { className: "flex-1 min-w-[160px]", children: _jsx(Controller, { control: control, name: "origin", render: ({ field }) => (_jsx(AirportInput, { label: "From", value: field.value, onChange: field.onChange, confirmedText: originText, onConfirm: setOriginText, placeholder: "City or airport", error: errors.origin?.message })) }) }), _jsx("button", { type: "button", onClick: () => {
                            const o = watch('origin');
                            const d = watch('destination');
                            setValue('origin', d);
                            setValue('destination', o);
                            setOriginText(destText);
                            setDestText(originText);
                        }, "aria-label": "Swap origin and destination", className: "flex-shrink-0 w-9 h-9 rounded-full border border-line bg-white hover:border-green hover:text-green hover:shadow-green-sm flex items-center justify-center transition-all duration-200", children: _jsx("svg", { width: "15", height: "15", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M11 3L14 6L11 9M5 13L2 10L5 7M13.5 6H2.5M13.5 10H2.5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("div", { className: "flex-1 min-w-[160px]", children: _jsx(Controller, { control: control, name: "destination", render: ({ field }) => (_jsx(AirportInput, { label: "To", value: field.value, onChange: field.onChange, confirmedText: destText, onConfirm: setDestText, placeholder: "City or airport", error: errors.destination?.message })) }) }), _jsxs("div", { className: "flex-shrink-0 w-44", children: [_jsx("label", { className: "label-text", children: "Depart" }), _jsx("input", { type: "date", ...register('departDate'), className: `input-field ${errors.departDate ? 'input-field-error' : ''}` }), errors.departDate && (_jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.departDate.message }))] }), tripType === 'return' && (_jsxs("div", { className: "flex-shrink-0 w-44", children: [_jsx("label", { className: "label-text", children: "Return" }), _jsx("input", { type: "date", ...register('returnDate'), className: `input-field ${errors.returnDate ? 'input-field-error' : ''}` }), errors.returnDate && (_jsx("p", { className: "text-[13px] text-red-500 mt-1", children: errors.returnDate.message }))] })), _jsxs("div", { className: "flex-shrink-0 w-28", children: [_jsx("label", { className: "label-text", children: "Passengers" }), _jsx(Controller, { control: control, name: "passengers", render: ({ field }) => (_jsxs("div", { className: "flex items-center gap-1 border border-line rounded-input px-2 py-3 bg-white", children: [_jsx("button", { type: "button", onClick: () => field.onChange(Math.max(1, field.value - 1)), className: "w-6 h-6 rounded-full bg-surface border border-line text-navy font-bold flex items-center justify-center hover:border-green hover:text-green transition-colors text-base leading-none", children: "\u2212" }), _jsx("span", { className: "flex-1 text-center font-semibold text-[15px] text-navy", children: field.value }), _jsx("button", { type: "button", onClick: () => field.onChange(Math.min(9, field.value + 1)), className: "w-6 h-6 rounded-full bg-surface border border-line text-navy font-bold flex items-center justify-center hover:border-green hover:text-green transition-colors text-base leading-none", children: "+" })] })) })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "btn-primary flex-shrink-0 py-3 px-6 text-[15px]", children: isLoading ? (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(SearchingDots, {}), "Searching\u2026"] })) : (_jsxs(_Fragment, { children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 18 18", fill: "none", className: "flex-shrink-0", children: [_jsx("circle", { cx: "7.5", cy: "7.5", r: "5.5", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M13 13L16 16", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }), "Search"] })) })] })] }));
}
function SearchingDots() {
    return (_jsx("span", { className: "flex gap-1 items-center", children: [0, 150, 300].map((delay) => (_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse-green", style: { animationDelay: `${delay}ms` } }, delay))) }));
}
//# sourceMappingURL=SearchForm.js.map