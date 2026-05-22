import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar.js';

export default function App() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
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
        }}
      />
    </div>
  );
}
