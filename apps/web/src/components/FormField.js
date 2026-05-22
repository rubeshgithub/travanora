import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const FormField = forwardRef(({ label, error, hint, suffix, className = '', id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    return (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: fieldId, className: "label-text", children: label }), _jsxs("div", { className: "relative", children: [_jsx("input", { ref: ref, id: fieldId, className: `input-field ${error ? 'input-field-error' : ''} ${suffix ? 'pr-12' : ''} ${className}`, "aria-invalid": !!error, "aria-describedby": error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined, ...props }), suffix && (_jsx("div", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted", children: suffix }))] }), error && (_jsx("p", { id: `${fieldId}-error`, className: "text-[13px] text-red-500 font-medium", children: error })), hint && !error && (_jsx("p", { id: `${fieldId}-hint`, className: "text-[13px] text-muted", children: hint }))] }));
});
FormField.displayName = 'FormField';
//# sourceMappingURL=FormField.js.map