import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter } from 'react-router-dom';
import App from './App.js';
import { SearchPage } from './pages/SearchPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { ConfirmationPage } from './pages/ConfirmationPage.js';
import { MyBookingsPage } from './pages/MyBookingsPage.js';
import { BookingPassengersPage } from './pages/BookingPassengersPage.js';
import { BookingReviewPage } from './pages/BookingReviewPage.js';
import { BookingPaymentPage } from './pages/BookingPaymentPage.js';
import { BookingConfirmedPage } from './pages/BookingConfirmedPage.js';
import { VerifyEmailPage } from './pages/VerifyEmailPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { RequireAuth } from './components/RequireAuth.js';
export const router = createBrowserRouter([
    {
        path: '/',
        element: _jsx(App, {}),
        children: [
            { index: true, element: _jsx(SearchPage, {}) },
            { path: 'search', element: _jsx(SearchPage, {}) },
            { path: 'me/bookings', element: _jsx(MyBookingsPage, {}) },
        ],
    },
    // Auth pages — full-screen layout
    { path: '/register', element: _jsx(RegisterPage, {}) },
    { path: '/login', element: _jsx(LoginPage, {}) },
    { path: '/verify-email', element: _jsx(VerifyEmailPage, {}) },
    { path: '/reset-password', element: _jsx(ResetPasswordPage, {}) },
    // Phase 2 booking flow — focused checkout layout
    {
        path: '/book/:offerId',
        element: _jsx(RequireAuth, { children: _jsx(BookingPassengersPage, {}) }),
    },
    {
        path: '/book/:bookingId/review',
        element: _jsx(RequireAuth, { children: _jsx(BookingReviewPage, {}) }),
    },
    {
        path: '/book/:bookingId/payment',
        element: _jsx(RequireAuth, { children: _jsx(BookingPaymentPage, {}) }),
    },
    {
        path: '/book/confirmed/:bookingId',
        element: _jsx(RequireAuth, { children: _jsx(BookingConfirmedPage, {}) }),
    },
    // Phase 1 compat
    { path: '/booking/:bookingRef', element: _jsx(ConfirmationPage, {}) },
]);
//# sourceMappingURL=routes.js.map