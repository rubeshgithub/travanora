import { createBrowserRouter } from 'react-router-dom';
import App from './App.js';
import { SearchPage } from './pages/SearchPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { BookingPage } from './pages/BookingPage.js';
import { ConfirmationPage } from './pages/ConfirmationPage.js';
import { MyBookingsPage } from './pages/MyBookingsPage.js';

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
  // Auth pages use their own full-screen layout (no shared Navbar)
  { path: '/register', element: <RegisterPage /> },
  { path: '/login', element: <LoginPage /> },
  // Booking flow — focused checkout layout (no shared Navbar)
  { path: '/book/:offerId', element: <BookingPage /> },
  { path: '/booking/:bookingRef', element: <ConfirmationPage /> },
]);
