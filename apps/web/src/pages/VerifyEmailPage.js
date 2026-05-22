import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api.js';
import { useAuthStore } from '@/features/auth/auth.store.js';
import { Logo } from '@/components/Logo.js';
export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [state, setState] = useState('verifying');
    const [errorMsg, setErrorMsg] = useState('');
    const didRun = useRef(false);
    const user = useAuthStore((s) => s.user);
    const setAuth = useAuthStore((s) => s.setAuth);
    const member = useAuthStore((s) => s.member);
    const accessToken = useAuthStore((s) => s.accessToken);
    useEffect(() => {
        if (didRun.current)
            return;
        didRun.current = true;
        if (!token) {
            setState('error');
            setErrorMsg('No verification token found in this link.');
            return;
        }
        api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
            .then(() => {
            // Update the local auth store so the unverified banner disappears immediately
            if (user && member && accessToken) {
                setAuth({ user: { ...user, emailVerified: true }, member, accessToken });
            }
            setState('success');
        })
            .catch((err) => {
            setState('error');
            setErrorMsg(err.message || 'Verification failed. The link may have expired.');
        });
    }, [token, user, member, accessToken, setAuth]);
    return (_jsxs("div", { className: "min-h-screen bg-[var(--bg)] flex flex-col", children: [_jsx("header", { className: "bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3", children: _jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx(Logo, { size: 26 }), _jsx("span", { className: "font-bold text-navy tracking-tighter", children: "Travanora" })] }) }), _jsx("div", { className: "flex-1 flex items-center justify-center px-4 py-16", children: _jsxs("div", { className: "w-full max-w-md text-center", children: [state === 'verifying' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex justify-center gap-2 mb-6", children: [0, 150, 300].map((d) => (_jsx("span", { className: "w-3 h-3 rounded-full bg-green animate-pulse-green", style: { animationDelay: `${d}ms` } }, d))) }), _jsx("p", { className: "text-navy font-semibold", children: "Verifying your email\u2026" })] })), state === 'success' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-green-tint border border-green/20 flex items-center justify-center mx-auto mb-6", children: _jsx("svg", { width: "28", height: "28", viewBox: "0 0 28 28", fill: "none", children: _jsx("path", { d: "M6 14l6 6 10-12", stroke: "#00b67a", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("h1", { className: "text-2xl font-bold text-navy mb-2", children: "Email verified!" }), _jsx("p", { className: "text-muted text-sm mb-8", children: "Your account is now fully active. You're all set." }), _jsx(Link, { to: "/", className: "btn-primary px-8 py-3", children: "Search flights" })] })), state === 'error' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6", children: _jsx("svg", { width: "28", height: "28", viewBox: "0 0 28 28", fill: "none", children: _jsx("path", { d: "M8 8l12 12M20 8L8 20", stroke: "#ef4444", strokeWidth: "2.5", strokeLinecap: "round" }) }) }), _jsx("h1", { className: "text-2xl font-bold text-navy mb-2", children: "Verification failed" }), _jsx("p", { className: "text-muted text-sm mb-8", children: errorMsg }), _jsx(Link, { to: "/", className: "btn-ghost px-6 py-2.5", children: "Go home" })] }))] }) })] }));
}
//# sourceMappingURL=VerifyEmailPage.js.map