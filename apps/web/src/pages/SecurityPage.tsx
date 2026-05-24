import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { MemberShell } from '@/components/MemberShell.js';
import { PasswordStrength } from '@/components/PasswordStrength.js';
import { useChangePassword } from '@/features/account/useAccount.js';
import { useAuthStore } from '@/features/auth/auth.store.js';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
  confirmPassword: z.string().min(1, 'Confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type Form = z.infer<typeof schema>;

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10M8 3C4.5 3 2 8 2 8s.7 1.4 2 2.5M14 8s-2.5 5-7 5c-.6 0-1.2-.1-1.8-.2" />
    </svg>
  );
}

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; watch?: string }
>(({ label, error, watch, ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[13px] font-semibold text-navy mb-1.5">{label}</label>
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={show ? 'text' : 'password'}
          className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-[14px] text-navy placeholder-muted bg-white transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-300 focus:ring-red-200'
              : 'border-line focus:border-green focus:ring-green/30'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy transition-colors"
          tabIndex={-1}
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {watch !== undefined && <PasswordStrength password={watch} />}
      {error && <p className="text-[12px] text-red-500 mt-1">{error}</p>}
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export function SecurityPage() {
  const { mutateAsync: changePassword, isPending } = useChangePassword();
  const updateToken = useAuthStore((s) => s.updateToken);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const newPasswordValue = watch('newPassword', '');

  async function onSubmit(data: Form) {
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      updateToken(result.accessToken);
      toast.success('Password changed successfully');
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      toast.error(msg);
    }
  }

  return (
    <MemberShell>
      <div className="space-y-5 max-w-lg">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Security</h1>
          <p className="text-muted text-sm mt-0.5">Keep your account safe</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-line rounded-xl p-6 space-y-5"
        >
          <h2 className="text-[16px] font-semibold text-navy">Change password</h2>

          <PasswordInput
            label="Current password"
            error={errors.currentPassword?.message}
            placeholder="Your current password"
            {...register('currentPassword')}
          />

          <PasswordInput
            label="New password"
            error={errors.newPassword?.message}
            placeholder="At least 8 characters"
            watch={newPasswordValue}
            {...register('newPassword')}
          />

          <PasswordInput
            label="Confirm new password"
            error={errors.confirmPassword?.message}
            placeholder="Repeat new password"
            {...register('confirmPassword')}
          />

          <div className="pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary text-[13px] px-6 py-2.5 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Changing password…' : 'Change password'}
            </button>
          </div>

          <p className="text-[12px] text-muted text-center">
            Changing your password will sign you out of all other devices.
          </p>
        </form>
      </div>
    </MemberShell>
  );
}
