import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { MemberShell } from '@/components/MemberShell.js';
import { useProfile, useUpdateProfile, useUpdatePreferences } from '@/features/account/useAccount.js';

// ── Validation schemas (subset matching API) ──────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters').max(50).trim(),
  lastName: z.string().min(2, 'At least 2 characters').max(50).trim(),
  dob: z.string().optional(),
  nationality: z.string().length(2).optional().or(z.literal('')),
  city: z.string().max(100).trim().optional(),
});

const preferencesSchema = z.object({
  homeAirport: z.string().length(3).toUpperCase().optional().or(z.literal('')),
  preferredCabin: z.enum(['economy', 'premium_economy', 'business', 'first']).optional().or(z.literal('')),
  travelFrequency: z.enum(['rarely', 'occasionally', 'frequently', 'very_frequently']).optional().or(z.literal('')),
  travelPurpose: z.enum(['leisure', 'business', 'both']).optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PreferencesForm = z.infer<typeof preferencesSchema>;

// ── Field components ──────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-navy mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[12px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ error, className, ...rest }, ref) => (
    <input
      {...rest}
      ref={ref}
      className={`w-full px-3.5 py-2.5 rounded-xl border text-[14px] text-navy placeholder-muted bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-green/30 ${
        error ? 'border-red-300 focus:ring-red-200' : 'border-line focus:border-green'
      } ${className ?? ''}`}
    />
  ),
);
Input.displayName = 'Input';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }>(
  ({ error, children, className, ...rest }, ref) => (
    <select
      {...rest}
      ref={ref}
      className={`w-full px-3.5 py-2.5 rounded-xl border text-[14px] text-navy bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-green/30 ${
        error ? 'border-red-300 focus:ring-red-200' : 'border-line focus:border-green'
      } ${className ?? ''}`}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

// ── Profile form ──────────────────────────────────────────────────────────────

function ProfileForm() {
  const { data: profile } = useProfile();
  const { mutateAsync: save, isPending } = useUpdateProfile();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', dob: '', nationality: '', city: '' },
  });

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        dob: profile.dob ?? '',
        nationality: profile.nationality ?? '',
        city: profile.city ?? '',
      });
    }
  }, [profile, reset]);

  async function onSubmit(data: ProfileForm) {
    try {
      await save({
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob || undefined,
        nationality: data.nationality || undefined,
        city: data.city || undefined,
      });
      toast.success('Profile updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-line rounded-xl p-6 space-y-5">
      <h2 className="text-[16px] font-semibold text-navy">Personal information</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First name" error={errors.firstName?.message}>
          <Input {...register('firstName')} error={!!errors.firstName} placeholder="First name" />
        </Field>
        <Field label="Last name" error={errors.lastName?.message}>
          <Input {...register('lastName')} error={!!errors.lastName} placeholder="Last name" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of birth" error={errors.dob?.message}>
          <Input {...register('dob')} type="date" error={!!errors.dob} />
        </Field>
        <Field label="Nationality (2-letter ISO)" error={errors.nationality?.message}>
          <Input
            {...register('nationality')}
            error={!!errors.nationality}
            placeholder="KW"
            maxLength={2}
            className="uppercase"
          />
        </Field>
      </div>

      <Field label="City" error={errors.city?.message}>
        <Input {...register('city')} error={!!errors.city} placeholder="Kuwait City" />
      </Field>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="btn-primary text-[13px] px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

// ── Preferences form ──────────────────────────────────────────────────────────

function PreferencesForm() {
  const { data: profile } = useProfile();
  const { mutateAsync: save, isPending } = useUpdatePreferences();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { homeAirport: '', preferredCabin: '', travelFrequency: '', travelPurpose: '' },
  });

  useEffect(() => {
    if (profile?.preferences) {
      reset({
        homeAirport: profile.preferences.homeAirport ?? '',
        preferredCabin: (profile.preferences.preferredCabin as PreferencesForm['preferredCabin']) ?? '',
        travelFrequency: (profile.preferences.travelFrequency as PreferencesForm['travelFrequency']) ?? '',
        travelPurpose: (profile.preferences.travelPurpose as PreferencesForm['travelPurpose']) ?? '',
      });
    }
  }, [profile, reset]);

  async function onSubmit(data: PreferencesForm) {
    try {
      await save({
        homeAirport: data.homeAirport || undefined,
        preferredCabin: data.preferredCabin || undefined,
        travelFrequency: data.travelFrequency || undefined,
        travelPurpose: data.travelPurpose || undefined,
      });
      toast.success('Preferences saved');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save preferences');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-line rounded-xl p-6 space-y-5">
      <h2 className="text-[16px] font-semibold text-navy">Travel preferences</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Home airport (IATA code)" error={errors.homeAirport?.message}>
          <Input
            {...register('homeAirport')}
            error={!!errors.homeAirport}
            placeholder="KWI"
            maxLength={3}
            className="uppercase"
          />
        </Field>
        <Field label="Preferred cabin" error={errors.preferredCabin?.message}>
          <Select {...register('preferredCabin')} error={!!errors.preferredCabin}>
            <option value="">No preference</option>
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium Economy</option>
            <option value="business">Business</option>
            <option value="first">First class</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Travel frequency" error={errors.travelFrequency?.message}>
          <Select {...register('travelFrequency')} error={!!errors.travelFrequency}>
            <option value="">Select…</option>
            <option value="rarely">Rarely (1–2/year)</option>
            <option value="occasionally">Occasionally (3–5/year)</option>
            <option value="frequently">Frequently (6–12/year)</option>
            <option value="very_frequently">Very frequently (12+/year)</option>
          </Select>
        </Field>
        <Field label="Travel purpose" error={errors.travelPurpose?.message}>
          <Select {...register('travelPurpose')} error={!!errors.travelPurpose}>
            <option value="">Select…</option>
            <option value="leisure">Leisure</option>
            <option value="business">Business</option>
            <option value="both">Both</option>
          </Select>
        </Field>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="btn-primary text-[13px] px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </form>
  );
}

// ── Read-only email strip ─────────────────────────────────────────────────────

function EmailStrip({ email }: { email: string }) {
  return (
    <div className="bg-surface border border-line rounded-xl px-5 py-4 flex items-center justify-between">
      <div>
        <p className="text-[12px] text-muted font-medium">Email address</p>
        <p className="text-[14px] font-semibold text-navy mt-0.5">{email}</p>
      </div>
      <span className="text-[11px] text-muted bg-white border border-line px-2.5 py-1 rounded-full">
        Read-only
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function AccountSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 bg-line rounded w-32" />
      <div className="h-12 bg-line rounded-xl" />
      <div className="h-64 bg-line rounded-xl" />
      <div className="h-48 bg-line rounded-xl" />
    </div>
  );
}

export function AccountPage() {
  const { data: profile, isPending } = useProfile();

  return (
    <MemberShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">My Profile</h1>
          <p className="text-muted text-sm mt-0.5">Manage your personal details and preferences</p>
        </div>

        {isPending && <AccountSkeleton />}

        {profile && (
          <>
            <EmailStrip email={profile.email} />
            <ProfileForm />
            <PreferencesForm />
          </>
        )}
      </div>
    </MemberShell>
  );
}
