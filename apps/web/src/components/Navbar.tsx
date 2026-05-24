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

  return (
    <span className="hidden md:inline-flex items-center bg-navy text-green text-[12px] font-semibold px-3 py-1 rounded-pill overflow-hidden">
      <span
        style={{
          display: 'inline-block',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-6px)',
        }}
      >
        {PROMO_TAGS[index]}
      </span>
    </span>
  );
}

const TIER_LABEL: Record<string, string> = {
  free: 'Free member',
  gold: 'Gold member',
  platinum: 'Platinum member',
  corporate: 'Corporate',
};

const TIER_STYLE: Record<string, string> = {
  free: 'bg-green-tint text-green',
  gold: 'bg-amber-50 text-amber-600',
  platinum: 'bg-indigo-50 text-indigo-600',
  corporate: 'bg-navy/10 text-navy',
};

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function Avatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-green flex items-center justify-center flex-shrink-0">
      <span className="text-[12px] font-bold text-amber-ink leading-none">
        {initials(firstName, lastName)}
      </span>
    </div>
  );
}

export function Navbar() {
  const { isAuthenticated, user, member, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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

  return (
    <header className="bg-white border-b border-line sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <Logo size={32} />
          <span className="font-sans font-bold text-xl tracking-tighter text-navy group-hover:text-green transition-colors duration-200">
            Travanora
          </span>
        </Link>

        <AnimatedPromoTag />

        {/* Auth nav */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-surface border border-transparent hover:border-line transition-all duration-150"
              >
                <Avatar firstName={user.firstName} lastName={user.lastName} />
                <span className="hidden sm:block text-sm font-semibold text-navy">
                  {user.firstName}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {open && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-line rounded-xl shadow-card-hover overflow-hidden animate-fade-in">
                  {/* User header */}
                  <div className="px-4 py-3 border-b border-line flex items-center gap-3">
                    <Avatar firstName={user.firstName} lastName={user.lastName} />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-navy truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[12px] text-muted truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Member tier */}
                  {member && (
                    <div className="px-4 py-2 border-b border-line">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${TIER_STYLE[member.tier] ?? TIER_STYLE.free}`}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1" />
                          <path d="M3 5l1.5 1.5L7 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {TIER_LABEL[member.tier] ?? 'Member'}
                        {member.discountPercent > 0 && ` · ${member.discountPercent}% off`}
                      </span>
                    </div>
                  )}

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-navy hover:bg-surface transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted flex-shrink-0">
                        <path d="M2 7l6-5 6 5v7a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 14V9h4v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Dashboard
                    </Link>
                    <Link
                      to="/trips"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-navy hover:bg-surface transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted flex-shrink-0">
                        <rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M5 2.5v-1M11 2.5v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        <path d="M1.5 6h13" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M5 9.5h3M5 11.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      My trips
                    </Link>
                    <Link
                      to="/account"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-navy hover:bg-surface transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted flex-shrink-0">
                        <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M1.5 14c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      My account
                    </Link>

                    <div className="border-t border-line my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-muted hover:text-navy hover:bg-surface transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                        <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        <path d="M11 11l3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm px-4 py-2">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary text-sm px-4 py-2">
                Join free
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
