import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api.js';
import { Logo } from '@/components/Logo.js';
const schema = z.object({
    password: z
        .string()
        .min(8, 'At least 8 characters')
        .regex(/[A-Z]/, 'At least one uppercase letter')
        .regex(/[a-z]/, 'At least one lowercase letter')
        .regex(/[0-9]/, 'At least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
function PasswordStrength({ password }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /[0-9]/.test(password),
    ];
    const passed = checks.filter(Boolean).length;
    const color = passed <= 1 ? 'bg-red-400' : passed <= 2 ? 'bg-amber-400' : passed === 3 ? 'bg-yellow-400' : 'bg-green';
    if (!password)
        return null;
    return (_jsx("div", { className: "mt-2 flex gap-1", children: checks.map((ok, i) => (_jsx("div", { className: `h-1 flex-1 rounded-full transition-colors duration-300 ${ok ? color : 'bg-line'}` }, i))) }));
}
export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') ?? '';
    const [serverError, setServerError] = useState('');
    const [done, setDone] = useState(false);
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    });
    const password = watch('password', '');
    async function onSubmit(data) {
        try {
            setServerError('');
            await api.post('/api/auth/reset-password', { token, password: data.password, confirmPassword: data.confirmPassword });
            setDone(true);
        }
        catch (err) {
            setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        }
    }
    return (_jsxs("div", { className: "min-h-screen bg-[var(--bg)] flex flex-col", children: [_jsx("header", { className: "bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3", children: _jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx(Logo, { size: 26 }), _jsx("span", { className: "font-bold text-navy tracking-tighter", children: "Travanora" })] }) }), _jsx("div", { className: "flex-1 flex items-center justify-center px-4 py-16", children: _jsx("div", { className: "w-full max-w-md", children: !token ? (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-red-500 font-medium mb-4", children: "Invalid or missing reset link." }), _jsx(Link, { to: "/login", className: "btn-primary px-6 py-2.5", children: "Back to sign in" })] })) : done ? (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-green-tint border border-green/20 flex items-center justify-center mx-auto mb-6", children: _jsx("svg", { width: "28", height: "28", viewBox: "0 0 28 28", fill: "none", children: _jsx("path", { d: "M6 14l6 6 10-12", stroke: "#00b67a", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("h1", { className: "text-2xl font-bold text-navy mb-2", children: "Password updated!" }), _jsx("p", { className: "text-muted text-sm mb-8", children: "You can now sign in with your new password." }), _jsx("button", { onClick: () => navigate('/login'), className: "btn-primary px-8 py-3", children: "Sign in" })] })) : (_jsxs("div", { className: "bg-white border border-line rounded-card p-8 shadow-card", children: [_jsx("h1", { className: "text-2xl font-bold text-navy mb-1", children: "Choose a new password" }), _jsx("p", { className: "text-muted text-sm mb-6", children: "Make it strong \u2014 at least 8 characters with uppercase, lowercase, and a number." }), serverError && (_jsx("div", { className: "rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 mb-5", children: serverError })), _jsxs("form", { onSubmit: handleSubmit(onSubmit), noValidate: true, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-navy mb-1.5", children: "New password" }), _jsx("input", { type: "password", ...register('password'), autoComplete: "new-password", autoFocus: true, className: `input w-full ${errors.password ? 'border-red-400 focus:ring-red-200' : ''}`, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx(PasswordStrength, { password: password }), errors.password && _jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.password.message })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-navy mb-1.5", children: "Confirm password" }), _jsx("input", { type: "password", ...register('confirmPassword'), autoComplete: "new-password", className: `input w-full ${errors.confirmPassword ? 'border-red-400 focus:ring-red-200' : ''}`, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), errors.confirmPassword && _jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.confirmPassword.message })] }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "btn-primary w-full py-3", children: isSubmitting ? 'Updating…' : 'Set new password' })] }), _jsxs("p", { className: "text-center text-sm text-muted mt-5", children: ["Remembered it?", ' ', _jsx(Link, { to: "/login", className: "text-green font-semibold hover:underline", children: "Sign in" })] })] })) }) })] }));
}
//# sourceMappingURL=ResetPasswordPage.js.map