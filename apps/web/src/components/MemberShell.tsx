import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo.js';
import { useAuth } from '@/features/auth/useAuth.js';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7l7-5 7 5v9a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" />
      <path d="M6 17V9h6v8" />
    </svg>
  );
}

function PlaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3a2 2 0 00-2-2L4 7H2l-1 2h4l1 2H3l-1 1.5L5 14l1-1h4l1 3h2l1-3 2-1V5l-2-2z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="6" r="3.5" />
      <path d="M1.5 16c0-4 3.4-7 7.5-7s7.5 3 7.5 7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1L2 4v5c0 4.4 3 8 7 9 4-1 7-4.6 7-9V4L9 1z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6.5" cy="5.5" r="2.5" />
      <path d="M1 15c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="13" cy="5" r="2" />
      <path d="M12.5 10c1.5 0 4 1 4 5" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 3.3a4 4 0 00-5.4 5.4L2 16l2 2 7.3-7.3a4 4 0 005.4-5.4l-2.4 2.4-1.8-1.8 2.2-2.6z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" />
      <path d="M11 11l3-3-3-3" />
      <path d="M14 8H6" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',           label: 'Dashboard',  icon: <HomeIcon /> },
  { to: '/trips',               label: 'Trips',      icon: <PlaneIcon /> },
  { to: '/account',             label: 'Profile',    icon: <UserIcon /> },
  { to: '/account/security',    label: 'Security',   icon: <ShieldIcon /> },
  { to: '/account/passengers',  label: 'Passengers', icon: <PeopleIcon /> },
];

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/account'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-green-tint text-green'
            : 'text-muted hover:text-navy hover:bg-surface'
        }`
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  );
}

function BottomTabLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/account'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 flex-1 pt-2 pb-1 text-[10px] font-semibold transition-colors duration-150 ${
          isActive ? 'text-green' : 'text-muted'
        }`
      }
    >
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
  );
}

interface MemberShellProps {
  children: React.ReactNode;
}

export function MemberShell({ children }: MemberShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function initials() {
    if (!user) return '?';
    return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ── Desktop sidebar layout ── */}
      <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0">
          <div className="bg-white border border-line rounded-2xl p-4 flex flex-col gap-1 sticky top-6">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2.5 px-3 py-2 mb-2 group">
              <Logo size={26} />
              <span className="font-bold text-base tracking-tighter text-navy group-hover:text-green transition-colors">Travanora</span>
            </Link>

            {/* Nav */}
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
              {user?.isAdmin && (
                <SidebarLink item={{ to: '/admin/refunds', label: 'Refund queue', icon: <WrenchIcon /> }} />
              )}
              {/* Search flights */}
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-muted hover:text-navy hover:bg-surface transition-colors duration-150 mt-1"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7.5" cy="7.5" r="5.5" />
                  <path d="M13 13l3 3" />
                </svg>
                Search flights
              </Link>
            </nav>

            {/* User + signout */}
            <div className="mt-auto pt-4 border-t border-line">
              {user && (
                <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-green flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-amber-ink leading-none">{initials()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-navy truncate">{user.firstName}</p>
                    <p className="text-[11px] text-muted truncate">{user.email}</p>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] text-muted hover:text-navy hover:bg-surface transition-colors duration-150"
              >
                <SignOutIcon />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line flex z-40 safe-area-bottom">
        {NAV_ITEMS.map((item) => (
          <BottomTabLink key={item.to} item={item} />
        ))}
      </nav>
    </div>
  );
}
