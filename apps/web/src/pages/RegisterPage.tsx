import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { RegisterSchema, type RegisterInput } from '@travanora/shared';
import { useAuth } from '@/features/auth/useAuth.js';
import { ApiError } from '@/lib/api.js';
import { FormField } from '@/components/FormField.js';
import { PasswordStrength } from '@/components/PasswordStrength.js';
import { Logo } from '@/components/Logo.js';

const countryCodes = [
  { code: '+965', flag: '🇰🇼', label: 'Kuwait' },
  { code: '+966', flag: '🇸🇦', label: 'Saudi Arabia' },
  { code: '+971', flag: '🇦🇪', label: 'UAE' },
  { code: '+973', flag: '🇧🇭', label: 'Bahrain' },
  { code: '+974', flag: '🇶🇦', label: 'Qatar' },
  { code: '+968', flag: '🇴🇲', label: 'Oman' },
  { code: '+91', flag: '🇮🇳', label: 'India' },
  { code: '+92', flag: '🇵🇰', label: 'Pakistan' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+1', flag: '🇺🇸', label: 'US' },
] as const;

const nationalities = [
  { value: 'KW', label: 'Kuwaiti' },
  { value: 'SA', label: 'Saudi' },
  { value: 'AE', label: 'Emirati' },
  { value: 'BH', label: 'Bahraini' },
  { value: 'QA', label: 'Qatari' },
  { value: 'OM', label: 'Omani' },
  { value: 'IN', label: 'Indian' },
  { value: 'PK', label: 'Pakistani' },
  { value: 'GB', label: 'British' },
  { value: 'US', label: 'American' },
  { value: 'OTHER', label: 'Other' },
] as const;

const cabinOptions = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
] as const;

const frequencyOptions = [
  { value: 'occasional', label: 'Occasionally (1-2/year)' },
  { value: 'frequent', label: 'Frequent (3-6/year)' },
  { value: 'very_frequent', label: 'Very frequent (7-12/year)' },
  { value: 'road_warrior', label: 'Road warrior (12+/year)' },
] as const;

const purposeOptions = [
  { value: 'business', label: 'Business' },
  { value: 'leisure', label: 'Leisure' },
  { value: 'mixed', label: 'Mixed' },
] as const;

function SSOButtons() {
  function handleSSO(provider: string) {
    toast('Coming soon — OAuth in Phase 2', { icon: '🔜' });
    void provider;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => handleSSO('google')}
        className="btn-ghost w-full gap-3 py-3"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2a10.3 10.3 0 0 0-.164-1.84H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.1 17.64 11.85 17.64 9.2Z" fill="#4285F4" />
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => handleSSO('apple')}
        className="btn-ghost w-full gap-3 py-3"
      >
        <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
          <path d="M13.083 9.3c-.02-2.14 1.748-3.172 1.827-3.22C13.803 4.23 11.97 4 11.298 4c-1.569-.066-3.065.942-3.86.942-.793 0-2.02-.922-3.335-.9C2.44 4.065.977 4.965.196 6.396c-1.572 2.726-.406 6.763 1.13 8.976.74 1.08 1.627 2.295 2.785 2.252 1.12-.044 1.544-.725 2.9-.725 1.35 0 1.73.725 2.91.703 1.205-.02 1.96-1.098 2.696-2.18a11.1 11.1 0 0 0 1.226-2.52c-.027-.013-2.35-.908-2.372-3.6h.012ZM10.32 2.63C10.93 1.895 11.35.886 11.23 0c-.865.038-1.91.578-2.53 1.31-.551.636-1.038 1.663-.906 2.645.955.073 1.928-.497 2.527-1.326Z" />
        </svg>
        Continue with Apple
      </button>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-line" />
        <span className="text-[12px] text-muted font-medium">or register with email</span>
        <div className="flex-1 h-px bg-line" />
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      city: 'Kuwait City',
      homeAirport: 'KWI',
      phone: { countryCode: '+965', number: '' },
      marketingOptIn: true,
    },
  });

  const password = watch('password') ?? '';

  async function onSubmit(data: RegisterInput) {
    try {
      setServerError(null);
      await registerUser(data);
      toast.success('Welcome! Your 10% member discount is now active. ✈');
      navigate('/');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Form panel ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col py-10 px-4 sm:px-8 lg:px-16 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full">
          {/* Header */}
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <Logo size={28} />
            <span className="font-bold text-lg tracking-tighter text-navy group-hover:text-green transition-colors">
              Travanora
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-navy tracking-tighter">Create your free account</h1>
          <p className="text-muted mt-2 mb-6">
            Join thousands of Kuwait-based travellers saving 10% on every flight.
          </p>

          <SSOButtons />

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8 mt-2">
            {/* ── Personal ─────────────────────────────────────────────── */}
            <section>
              <h2 className="text-[13px] font-bold text-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green text-white text-[11px] flex items-center justify-center font-bold">1</span>
                Personal
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="First name"
                    {...register('firstName')}
                    error={errors.firstName?.message}
                    autoComplete="given-name"
                  />
                  <FormField
                    label="Last name"
                    {...register('lastName')}
                    error={errors.lastName?.message}
                    autoComplete="family-name"
                  />
                </div>
                <FormField
                  label="Date of birth"
                  type="date"
                  {...register('dob')}
                  error={errors.dob?.message}
                  hint="Optional. Must be 18+"
                />
                <div className="flex flex-col gap-1">
                  <label className="label-text">Nationality</label>
                  <select
                    {...register('nationality')}
                    className="input-field"
                  >
                    <option value="">Select nationality (optional)</option>
                    {nationalities.map((n) => (
                      <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* ── Contact ──────────────────────────────────────────────── */}
            <section>
              <h2 className="text-[13px] font-bold text-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green text-white text-[11px] flex items-center justify-center font-bold">2</span>
                Contact
              </h2>
              <div className="space-y-4">
                <FormField
                  label="Email address"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  autoComplete="email"
                />

                {/* Phone */}
                <div className="flex flex-col gap-1">
                  <label className="label-text">Mobile number</label>
                  <div className="flex gap-2">
                    <select
                      {...register('phone.countryCode')}
                      className="input-field w-28 flex-shrink-0"
                    >
                      {countryCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      {...register('phone.number')}
                      type="tel"
                      placeholder="99887766"
                      inputMode="numeric"
                      className={`input-field flex-1 ${errors.phone?.number ? 'input-field-error' : ''}`}
                    />
                  </div>
                  {errors.phone?.number && (
                    <p className="text-[13px] text-red-500 font-medium">{errors.phone.number.message}</p>
                  )}
                  {errors.phone?.countryCode && (
                    <p className="text-[13px] text-red-500 font-medium">{errors.phone.countryCode.message}</p>
                  )}
                </div>

                <FormField
                  label="City"
                  {...register('city')}
                  error={errors.city?.message}
                  autoComplete="address-level2"
                />
              </div>
            </section>

            {/* ── Travel preferences ────────────────────────────────────── */}
            <section>
              <h2 className="text-[13px] font-bold text-navy uppercase tracking-wide mb-1 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green text-white text-[11px] flex items-center justify-center font-bold">3</span>
                Travel preferences
                <span className="text-muted font-normal normal-case tracking-normal ml-1">(optional)</span>
              </h2>
              <p className="text-[13px] text-muted mb-4">Help us personalise your experience.</p>
              <div className="space-y-4">
                <FormField
                  label="Home airport (IATA)"
                  {...register('homeAirport')}
                  error={errors.homeAirport?.message}
                  placeholder="KWI"
                  maxLength={3}
                  className="uppercase"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="label-text">Preferred cabin</label>
                    <select {...register('preferredCabin')} className="input-field">
                      <option value="">Any cabin</option>
                      {cabinOptions.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="label-text">Travel purpose</label>
                    <select {...register('travelPurpose')} className="input-field">
                      <option value="">Select</option>
                      {purposeOptions.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="label-text">How often do you travel?</label>
                  <select {...register('travelFrequency')} className="input-field">
                    <option value="">Select frequency</option>
                    {frequencyOptions.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* ── Security ─────────────────────────────────────────────── */}
            <section>
              <h2 className="text-[13px] font-bold text-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green text-white text-[11px] flex items-center justify-center font-bold">4</span>
                Security
              </h2>
              <div className="space-y-4">
                <div>
                  <FormField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    error={errors.password?.message}
                    autoComplete="new-password"
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
                  <PasswordStrength password={password} />
                </div>
                <FormField
                  label="Confirm password"
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  autoComplete="new-password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-muted hover:text-navy transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  }
                />
              </div>
            </section>

            {/* ── Consent ──────────────────────────────────────────────── */}
            <section className="space-y-3">
              <Controller
                control={control}
                name="termsAgreed"
                render={({ field }) => (
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-line text-green focus:ring-green/20"
                    />
                    <span className="text-[14px] text-muted leading-snug">
                      I agree to the{' '}
                      <a href="#" className="text-navy font-medium hover:text-green">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="text-navy font-medium hover:text-green">Privacy Policy</a>
                    </span>
                  </label>
                )}
              />
              {errors.termsAgreed && (
                <p className="text-[13px] text-red-500 font-medium">{errors.termsAgreed.message}</p>
              )}

              <Controller
                control={control}
                name="marketingOptIn"
                render={({ field }) => (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value ?? true}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-line text-green focus:ring-green/20"
                    />
                    <span className="text-[14px] text-muted leading-snug">
                      Send me flight deals and travel tips (you can unsubscribe anytime)
                    </span>
                  </label>
                )}
              />
            </section>

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
              {isSubmitting ? 'Creating account…' : 'Create free account'}
            </button>

            <p className="text-center text-[14px] text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-green font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* ── Side panel (desktop only) ────────────────────────────────────── */}
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
              &ldquo;Saved over KD 80 on my Dubai trip. The discount just works — no hoops.&rdquo;
            </p>
            <footer className="mt-4">
              <p className="text-white font-semibold">Ahmad Al-Salem</p>
              <p className="text-white/50 text-sm">Kuwait City · Free member</p>
            </footer>
          </blockquote>
          <div className="space-y-3 pt-4 border-t border-white/10">
            {[
              '✓ 10% off every flight, automatically',
              '✓ No promo codes — discount always applied',
              '✓ Free to join, free forever',
              '✓ Search 200+ airlines worldwide',
            ].map((benefit) => (
              <p key={benefit} className="text-white/70 text-sm font-medium">{benefit}</p>
            ))}
          </div>
        </div>
      </aside>
    </div>
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
