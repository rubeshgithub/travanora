import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api.js';
import { Logo } from '@/components/Logo.js';

const schema = z.object({
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[a-z]/, 'At least one lowercase letter')
    .regex(/[0-9]/, 'At least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ];
  const passed = checks.filter(Boolean).length;
  const color = passed <= 1 ? 'bg-red-400' : passed <= 2 ? 'bg-amber-400' : passed === 3 ? 'bg-yellow-400' : 'bg-green';

  if (!password) return null;

  return (
    <div className="mt-2 flex gap-1">
      {checks.map((ok, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${ok ? color : 'bg-line'}`} />
      ))}
    </div>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');

  async function onSubmit(data: FormData) {
    try {
      setServerError('');
      await api.post('/api/auth/reset-password', { token, password: data.password, confirmPassword: data.confirmPassword });
      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <header className="bg-white border-b border-line px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-bold text-navy tracking-tighter">Travanora</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {!token ? (
            <div className="text-center">
              <p className="text-red-500 font-medium mb-4">Invalid or missing reset link.</p>
              <Link to="/login" className="btn-primary px-6 py-2.5">Back to sign in</Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-tint border border-green/20 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M6 14l6 6 10-12" stroke="#00b67a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-navy mb-2">Password updated!</h1>
              <p className="text-muted text-sm mb-8">You can now sign in with your new password.</p>
              <button onClick={() => navigate('/login')} className="btn-primary px-8 py-3">Sign in</button>
            </div>
          ) : (
            <div className="bg-white border border-line rounded-card p-8 shadow-card">
              <h1 className="text-2xl font-bold text-navy mb-1">Choose a new password</h1>
              <p className="text-muted text-sm mb-6">Make it strong — at least 8 characters with uppercase, lowercase, and a number.</p>

              {serverError && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 mb-5">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">New password</label>
                  <input
                    type="password"
                    {...register('password')}
                    autoComplete="new-password"
                    autoFocus
                    className={`input w-full ${errors.password ? 'border-red-400 focus:ring-red-200' : ''}`}
                    placeholder="••••••••"
                  />
                  <PasswordStrength password={password} />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    {...register('confirmPassword')}
                    autoComplete="new-password"
                    className={`input w-full ${errors.confirmPassword ? 'border-red-400 focus:ring-red-200' : ''}`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
                  {isSubmitting ? 'Updating…' : 'Set new password'}
                </button>
              </form>

              <p className="text-center text-sm text-muted mt-5">
                Remembered it?{' '}
                <Link to="/login" className="text-green font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
