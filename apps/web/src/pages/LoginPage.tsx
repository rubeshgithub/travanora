import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LoginSchema, type LoginInput } from '@travanora/shared';
import { useAuth } from '@/features/auth/useAuth.js';
import { forgotPassword } from '@/features/auth/auth.api.js';
import { ApiError } from '@/lib/api.js';
import { FormField } from '@/components/FormField.js';
import { Logo } from '@/components/Logo.js';

function SSOButtons() {
  function handleSSO() {
    toast('Coming soon — OAuth in Phase 2', { icon: '🔜' });
  }

  return (
    <div className="space-y-3 mb-6">
      <button type="button" onClick={handleSSO} className="btn-ghost w-full gap-3 py-3">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2a10.3 10.3 0 0 0-.164-1.84H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.1 17.64 11.85 17.64 9.2Z" fill="#4285F4" />
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>
      <button type="button" onClick={handleSSO} className="btn-ghost w-full gap-3 py-3">
        <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
          <path d="M13.083 9.3c-.02-2.14 1.748-3.172 1.827-3.22C13.803 4.23 11.97 4 11.298 4c-1.569-.066-3.065.942-3.86.942-.793 0-2.02-.922-3.335-.9C2.44 4.065.977 4.965.196 6.396c-1.572 2.726-.406 6.763 1.13 8.976.74 1.08 1.627 2.295 2.785 2.252 1.12-.044 1.544-.725 2.9-.725 1.35 0 1.73.725 2.91.703 1.205-.02 1.96-1.098 2.696-2.18a11.1 11.1 0 0 0 1.226-2.52c-.027-.013-2.35-.908-2.372-3.6h.012ZM10.32 2.63C10.93 1.895 11.35.886 11.23 0c-.865.038-1.91.578-2.53 1.31-.551.636-1.038 1.663-.906 2.645.955.073 1.928-.497 2.527-1.326Z" />
        </svg>
        Continue with Apple
      </button>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-line" />
        <span className="text-[12px] text-muted font-medium">or sign in with email</span>
        <div className="flex-1 h-px bg-line" />
      </div>
    </div>
  );
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-card shadow-card-hover p-8 max-w-sm w-full animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-soft flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke="#00b67a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-bold text-navy text-lg">Check your inbox</h3>
            <p className="text-muted text-sm mt-2">
              If <strong>{email}</strong> is registered, you&apos;ll receive a reset link shortly.
            </p>
            <button onClick={onClose} className="btn-primary w-full mt-6">Done</button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-navy text-lg mb-1">Reset your password</h3>
            <p className="text-muted text-sm mb-5">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={isLoading || !email} className="btn-primary flex-1">
                  {isLoading ? 'Sending…' : 'Send link'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { rememberMe: false },
  });

  async function onSubmit(data: LoginInput) {
    try {
      setServerError(null);
      await login(data);
      navigate(searchParams.get('redirect') ?? '/');
    } catch (err) {
      setServerError(
        err instanceof ApiError && err.status === 401
          ? 'Email or password is incorrect'
          : err instanceof ApiError && err.status === 429
          ? 'Too many attempts. Please wait 15 minutes.'
          : 'Something went wrong. Please try again.',
      );
    }
  }

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="min-h-screen flex">
        {/* ── Form panel ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-8 lg:px-16">
          <div className="max-w-md mx-auto w-full">
            <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
              <Logo size={28} />
              <span className="font-bold text-lg tracking-tighter text-navy group-hover:text-green transition-colors">
                Travanora
              </span>
            </Link>

            <h1 className="text-3xl font-bold text-navy tracking-tighter">Welcome back</h1>
            <p className="text-muted mt-2 mb-8">
              Sign in to access your member discount and saved trips.
            </p>

            <SSOButtons />

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <FormField
                label="Email address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                autoComplete="email"
              />

              <div>
                <FormField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  error={errors.password?.message}
                  autoComplete="current-password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-muted hover:text-navy transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  }
                />
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded border-line text-green focus:ring-green/20"
                  />
                  <span className="text-[14px] text-muted font-medium">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[14px] text-green font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Server error */}
              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-input px-4 py-3">
                  <p className="text-[14px] text-red-600 font-medium">{serverError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3.5 text-[15px]"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>

              <p className="text-center text-[14px] text-muted">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-green font-semibold hover:underline">
                  Join free
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* ── Side panel (desktop only) ──────────────────────────────────── */}
        <aside className="hidden lg:flex lg:w-[420px] bg-navy flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-green blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-accent-yellow blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative">
            <Logo size={36} />
            <p className="text-white/50 text-sm mt-3 font-medium">Kuwait · Travel made smarter</p>
          </div>
          <div className="relative space-y-6">
            <blockquote>
              <p className="text-white text-xl font-serif italic leading-relaxed">
                &ldquo;Finally a travel platform that feels like it was built for Gulf travellers.&rdquo;
              </p>
              <footer className="mt-4">
                <p className="text-white font-semibold">Sara Al-Mutawa</p>
                <p className="text-white/50 text-sm">Kuwait City · Free member</p>
              </footer>
            </blockquote>
            <div className="space-y-3 pt-4 border-t border-white/10">
              {[
                '✓ 10% off every flight, always',
                '✓ No expiry, no minimum spend',
                '✓ Works on all airlines we serve',
                '✓ Takes 60 seconds to join',
              ].map((b) => (
                <p key={b} className="text-white/70 text-sm font-medium">{b}</p>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.359 11.238C14.369 10.167 15 9 15 9s-2.5-6-7-6a5.9 5.9 0 0 0-2.878.744M6.228 6.228A2 2 0 0 0 8 10a2 2 0 0 0 1.772-1.772M1 1l14 14M1 9s.915-1.515 2.5-2.878" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
