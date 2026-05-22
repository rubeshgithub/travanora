import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo.js';
import { useAuth } from '@/features/auth/useAuth.js';
const PROMO_TAGS = [
    'Kuwait · Travel made smarter',
    '500+ airlines · One search',
    'Members save 10% · Every booking',
];
function AnimatedPromoTag() {
    const [index, setIndex] = useState(0);
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const id = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setIndex((i) => (i + 1) % PROMO_TAGS.length);
                setVisible(true);
            }, 350);
        }, 3200);
        return () => clearInterval(id);
    }, []);
    return (_jsx("span", { className: "hidden md:inline-flex items-center bg-navy text-green text-[12px] font-semibold px-3 py-1 rounded-pill overflow-hidden", children: _jsx("span", { style: {
                display: 'inline-block',
                transition: 'opacity 0.35s ease, transform 0.35s ease',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(-6px)',
            }, children: PROMO_TAGS[index] }) }));
}
const TIER_LABEL = {
    free: 'Free member',
    gold: 'Gold member',
    platinum: 'Platinum member',
    corporate: 'Corporate',
};
const TIER_STYLE = {
    free: 'bg-green-tint text-green',
    gold: 'bg-amber-50 text-amber-600',
    platinum: 'bg-indigo-50 text-indigo-600',
    corporate: 'bg-navy/10 text-navy',
};
function initials(firstName, lastName) {
    return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}
function Avatar({ firstName, lastName }) {
    return (_jsx("div", { className: "w-8 h-8 rounded-full bg-green flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-[12px] font-bold text-amber-ink leading-none", children: initials(firstName, lastName) }) }));
}
export function Navbar() {
    const { isAuthenticated, user, member, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    // Close on outside click
    useEffect(() => {
        function handler(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    async function handleLogout() {
        setOpen(false);
        await logout();
        navigate('/login');
    }
    return (_jsx("header", { className: "bg-white border-b border-line sticky top-0 z-50", children: _jsxs("nav", { className: "max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2.5 group", children: [_jsx(Logo, { size: 32 }), _jsx("span", { className: "font-sans font-bold text-xl tracking-tighter text-navy group-hover:text-green transition-colors duration-200", children: "Travanora" })] }), _jsx(AnimatedPromoTag, {}), _jsx("div", { className: "flex items-center gap-2", children: isAuthenticated && user ? (_jsxs("div", { ref: menuRef, className: "relative", children: [_jsxs("button", { onClick: () => setOpen((v) => !v), className: "flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-surface border border-transparent hover:border-line transition-all duration-150", children: [_jsx(Avatar, { firstName: user.firstName, lastName: user.lastName }), _jsx("span", { className: "hidden sm:block text-sm font-semibold text-navy", children: user.firstName }), _jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", className: `text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`, children: _jsx("path", { d: "M2 4l4 4 4-4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), open && (_jsxs("div", { className: "absolute right-0 top-full mt-2 w-64 bg-white border border-line rounded-xl shadow-card-hover overflow-hidden animate-fade-in", children: [_jsxs("div", { className: "px-4 py-3 border-b border-line flex items-center gap-3", children: [_jsx(Avatar, { firstName: user.firstName, lastName: user.lastName }), _jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "text-[14px] font-semibold text-navy truncate", children: [user.firstName, " ", user.lastName] }), _jsx("p", { className: "text-[12px] text-muted truncate", children: user.email })] })] }), member && (_jsx("div", { className: "px-4 py-2 border-b border-line", children: _jsxs("span", { className: `inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${TIER_STYLE[member.tier] ?? TIER_STYLE.free}`, children: [_jsxs("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", children: [_jsx("circle", { cx: "5", cy: "5", r: "4.5", stroke: "currentColor", strokeWidth: "1" }), _jsx("path", { d: "M3 5l1.5 1.5L7 3.5", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" })] }), TIER_LABEL[member.tier] ?? 'Member', member.discountPercent > 0 && ` · ${member.discountPercent}% off`] }) })), _jsxs("div", { className: "py-1", children: [_jsxs(Link, { to: "/me/bookings", onClick: () => setOpen(false), className: "flex items-center gap-3 px-4 py-2.5 text-[14px] text-navy hover:bg-surface transition-colors", children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", className: "text-muted flex-shrink-0", children: [_jsx("rect", { x: "1.5", y: "2.5", width: "13", height: "11", rx: "2", stroke: "currentColor", strokeWidth: "1.3" }), _jsx("path", { d: "M5 2.5v-1M11 2.5v-1", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" }), _jsx("path", { d: "M1.5 6h13", stroke: "currentColor", strokeWidth: "1.3" }), _jsx("path", { d: "M5 9.5h3M5 11.5h2", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })] }), "My bookings"] }), _jsx("div", { className: "border-t border-line my-1" }), _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-muted hover:text-navy hover:bg-surface transition-colors", children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", className: "flex-shrink-0", children: [_jsx("path", { d: "M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" }), _jsx("path", { d: "M11 11l3-3-3-3", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M14 8H6", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })] }), "Sign out"] })] })] }))] })) : (_jsxs(_Fragment, { children: [_jsx(Link, { to: "/login", className: "btn-ghost text-sm px-4 py-2", children: "Sign in" }), _jsx(Link, { to: "/register", className: "btn-primary text-sm px-4 py-2", children: "Join free" })] })) })] }) }));
}
//# sourceMappingURL=Navbar.js.map