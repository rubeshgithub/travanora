import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api.js';
import { useAuthStore } from '@/features/auth/auth.store.js';
import { Logo } from '@/components/Logo.js';

type State = 'verifying' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<State>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const didRun = useRef(false);

  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const member = useAuthStore((s) => s.member);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (!token) {
      setState('error');
      setErrorMsg('No verification token found in this link.');
      return;
    }

    api.get<{ ok: boolean }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        // Update the local auth store so the unverified banner disappears immediately
        if (user && member && accessToken) {
          setAuth({ user: { ...user, emailVerified: true }, member, accessToken });
        }
        setState('success');
      })
      .catch((err: Error) => {
        setState('error');
        setErrorMsg(err.message || 'Verification failed. The link may have expired.');
      });
  }, [token, user, member, accessToken, setAuth]);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <header className="bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-bold text-navy tracking-tighter">Travanora</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          {state === 'verifying' && (
            <>
              <div className="flex justify-center gap-2 mb-6">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-3 h-3 rounded-full bg-green animate-pulse-green" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
              <p className="text-navy font-semibold">Verifying your email…</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-tint border border-green/20 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M6 14l6 6 10-12" stroke="#00b67a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-navy mb-2">Email verified!</h1>
              <p className="text-muted text-sm mb-8">Your account is now fully active. You&apos;re all set.</p>
              <Link to="/" className="btn-primary px-8 py-3">Search flights</Link>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M8 8l12 12M20 8L8 20" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-navy mb-2">Verification failed</h1>
              <p className="text-muted text-sm mb-8">{errorMsg}</p>
              <Link to="/" className="btn-ghost px-6 py-2.5">Go home</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
