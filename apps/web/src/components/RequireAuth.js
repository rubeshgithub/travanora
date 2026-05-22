import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store.js';
export function RequireAuth({ children }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const location = useLocation();
    if (!isAuthenticated) {
        return (_jsx(Navigate, { to: `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`, replace: true }));
    }
    return _jsx(_Fragment, { children: children });
}
//# sourceMappingURL=RequireAuth.js.map