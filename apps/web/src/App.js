import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar.js';
import { useAuthStore } from '@/features/auth/auth.store.js';
function UnverifiedBanner() {
    const user = useAuthStore((s) => s.user);
    if (!user || user.emailVerified)
        return null;
    return (_jsx("div", { className: "bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center", children: _jsx("p", { className: "text-amber-700 text-[13px] font-medium", children: "Please verify your email address \u2014 check your inbox for a link from Travanora." }) }));
}
export default function App() {
    return (_jsxs("div", { className: "min-h-screen bg-surface flex flex-col", children: [_jsx(Navbar, {}), _jsx(UnverifiedBanner, {}), _jsx("div", { className: "flex-1", children: _jsx(Outlet, {}) }), _jsx(Toaster, { position: "top-right", toastOptions: {
                    duration: 4000,
                    style: {
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        fontWeight: '500',
                        borderRadius: '12px',
                        border: '1.5px solid #e7eaf0',
                        boxShadow: '0 8px 24px rgba(10, 37, 64, 0.10)',
                    },
                    success: {
                        iconTheme: { primary: '#00b67a', secondary: '#fff' },
                    },
                } })] }));
}
//# sourceMappingURL=App.js.map