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
import { DashboardPage } from './pages/DashboardPage.js';
import { TripsPage } from './pages/TripsPage.js';
import { TripDetailPage } from './pages/TripDetailPage.js';
import { AccountPage } from './pages/AccountPage.js';
import { SecurityPage } from './pages/SecurityPage.js';
import { SavedPassengersPage } from './pages/SavedPassengersPage.js';
import { RequireAuth } from './components/RequireAuth.js';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <SearchPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'me/bookings', element: <MyBookingsPage /> },
    ],
  },
  // Auth pages — full-screen layout
  { path: '/register', element: <RegisterPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  // Phase 2 booking flow — focused checkout layout
  {
    path: '/book/:offerId',
    element: <RequireAuth><BookingPassengersPage /></RequireAuth>,
  },
  {
    path: '/book/:bookingId/review',
    element: <RequireAuth><BookingReviewPage /></RequireAuth>,
  },
  {
    path: '/book/:bookingId/payment',
    element: <RequireAuth><BookingPaymentPage /></RequireAuth>,
  },
  {
    path: '/book/confirmed/:bookingId',
    element: <RequireAuth><BookingConfirmedPage /></RequireAuth>,
  },
  // Phase 1 compat
  { path: '/booking/:bookingRef', element: <ConfirmationPage /> },
  // Phase 3a — member area
  {
    path: '/dashboard',
    element: <RequireAuth><DashboardPage /></RequireAuth>,
  },
  {
    path: '/trips',
    element: <RequireAuth><TripsPage /></RequireAuth>,
  },
  {
    path: '/trips/:bookingId',
    element: <RequireAuth><TripDetailPage /></RequireAuth>,
  },
  {
    path: '/account',
    element: <RequireAuth><AccountPage /></RequireAuth>,
  },
  {
    path: '/account/security',
    element: <RequireAuth><SecurityPage /></RequireAuth>,
  },
  {
    path: '/account/passengers',
    element: <RequireAuth><SavedPassengersPage /></RequireAuth>,
  },
]);
