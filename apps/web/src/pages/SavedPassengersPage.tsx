import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { COUNTRIES } from '@/lib/countries.js';
import toast from 'react-hot-toast';
import { MemberShell } from '@/components/MemberShell.js';
import {
  usePassengers,
  useCreatePassenger,
  useUpdatePassenger,
  useDeletePassenger,
} from '@/features/passengers/usePassengers.js';
import type { SavedPassenger } from '@/features/passengers/passenger.api.js';

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.enum(['mr', 'mrs', 'ms', 'miss', 'dr']),
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  dob: z.string().min(1, 'Required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  gender: z.enum(['m', 'f']),
  nationality: z.string().length(2, 'Please select a country'),
  passportNumber: z.string().max(20).optional().or(z.literal('')),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  passportIssuingCountry: z.string().length(2).optional().or(z.literal('')),
  relationship: z.enum(['self', 'spouse', 'child', 'parent', 'colleague', 'other']),
});

type PassengerForm = z.infer<typeof schema>;

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-navy mb-1">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ error, className, ...rest }, ref) => (
    <input
      {...rest}
      ref={ref}
      className={`w-full px-3 py-2 rounded-lg border text-[13px] text-navy placeholder-muted bg-white focus:outline-none focus:ring-2 focus:ring-green/30 ${
        error ? 'border-red-300' : 'border-line focus:border-green'
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
      className={`w-full px-3 py-2 rounded-lg border text-[13px] text-navy bg-white focus:outline-none focus:ring-2 focus:ring-green/30 ${
        error ? 'border-red-300' : 'border-line focus:border-green'
      } ${className ?? ''}`}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

// ── Passenger form modal ──────────────────────────────────────────────────────

interface PassengerModalProps {
  existing?: SavedPassenger;
  onClose: () => void;
}

function PassengerModal({ existing, onClose }: PassengerModalProps) {
  const { mutateAsync: create, isPending: creating } = useCreatePassenger();
  const { mutateAsync: update, isPending: updating } = useUpdatePassenger();
  const isPending = creating || updating;

  const { register, handleSubmit, formState: { errors } } = useForm<PassengerForm>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
          title: existing.title as PassengerForm['title'],
          firstName: existing.firstName,
          lastName: existing.lastName,
          dob: existing.dob,
          gender: existing.gender as PassengerForm['gender'],
          nationality: existing.nationality,
          passportNumber: existing.passportNumber ?? '',
          passportExpiry: existing.passportExpiry ?? '',
          passportIssuingCountry: existing.passportIssuingCountry ?? '',
          relationship: existing.relationship as PassengerForm['relationship'],
        }
      : {
          title: 'mr',
          firstName: '',
          lastName: '',
          dob: '',
          gender: 'm',
          nationality: '',
          passportNumber: '',
          passportExpiry: '',
          passportIssuingCountry: '',
          relationship: 'self',
        },
  });

  async function onSubmit(data: PassengerForm) {
    const payload = {
      title: data.title,
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      gender: data.gender,
      nationality: data.nationality,
      relationship: data.relationship,
      passportNumber: data.passportNumber || undefined,
      passportExpiry: data.passportExpiry || undefined,
      passportIssuingCountry: data.passportIssuingCountry || undefined,
    };

    try {
      if (existing) {
        await update({ id: existing.id, input: payload });
        toast.success('Passenger updated');
      } else {
        await create(payload);
        toast.success('Passenger added');
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-white z-10">
          <h2 className="text-[16px] font-semibold text-navy">
            {existing ? 'Edit passenger' : 'Add passenger'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-navy hover:bg-surface transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Title + Name */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Title" error={errors.title?.message}>
              <Select {...register('title')} error={!!errors.title}>
                <option value="mr">Mr</option>
                <option value="mrs">Mrs</option>
                <option value="ms">Ms</option>
                <option value="miss">Miss</option>
                <option value="dr">Dr</option>
              </Select>
            </Field>
            <Field label="First name" error={errors.firstName?.message}>
              <Input {...register('firstName')} error={!!errors.firstName} placeholder="First name" />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <Input {...register('lastName')} error={!!errors.lastName} placeholder="Last name" />
            </Field>
          </div>

          {/* DOB + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of birth" error={errors.dob?.message}>
              <Input {...register('dob')} type="date" error={!!errors.dob} />
            </Field>
            <Field label="Gender" error={errors.gender?.message}>
              <Select {...register('gender')} error={!!errors.gender}>
                <option value="m">Male</option>
                <option value="f">Female</option>
              </Select>
            </Field>
          </div>

          {/* Nationality + Relationship */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nationality" error={errors.nationality?.message}>
              <Select {...register('nationality')} error={!!errors.nationality}>
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Relationship" error={errors.relationship?.message}>
              <Select {...register('relationship')} error={!!errors.relationship}>
                <option value="self">Self</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="colleague">Colleague</option>
                <option value="other">Other</option>
              </Select>
            </Field>
          </div>

          {/* Passport section */}
          <div className="border-t border-line pt-4">
            <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-3">
              Passport (optional)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Passport number" error={errors.passportNumber?.message}>
                <Input
                  {...register('passportNumber')}
                  error={!!errors.passportNumber}
                  placeholder="A12345678"
                />
              </Field>
              <Field label="Expiry date" error={errors.passportExpiry?.message}>
                <Input
                  {...register('passportExpiry')}
                  type="date"
                  error={!!errors.passportExpiry}
                />
              </Field>
              <Field label="Issuing country" error={errors.passportIssuingCountry?.message}>
                <Select {...register('passportIssuingCountry')} error={!!errors.passportIssuingCountry}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 py-2.5 text-[13px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary flex-1 py-2.5 text-[13px] disabled:opacity-50"
            >
              {isPending ? 'Saving…' : existing ? 'Save changes' : 'Add passenger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirm dialog ─────────────────────────────────────────────────────

function DeleteConfirm({ passenger, onConfirm, onCancel }: {
  passenger: SavedPassenger;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-[16px] font-semibold text-navy">Remove passenger?</h2>
        <p className="text-[14px] text-muted">
          Remove <span className="font-semibold text-navy">{passenger.firstName} {passenger.lastName}</span> from your saved passengers?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 py-2.5 text-[13px]">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-[13px] font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Passenger card ────────────────────────────────────────────────────────────

function PassengerCard({
  passenger,
  onEdit,
  onDelete,
}: {
  passenger: SavedPassenger;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const titleMap: Record<string, string> = { mr: 'Mr', mrs: 'Mrs', ms: 'Ms', miss: 'Miss', dr: 'Dr' };
  const relMap: Record<string, string> = {
    self: 'Self', spouse: 'Spouse', child: 'Child', parent: 'Parent', colleague: 'Colleague', other: 'Other',
  };

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="bg-white border border-line rounded-xl p-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-green-tint flex items-center justify-center flex-shrink-0">
        <span className="text-[13px] font-bold text-green">
          {(passenger.firstName[0] ?? '?').toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[14px] font-semibold text-navy">
            {titleMap[passenger.title] ?? passenger.title} {passenger.firstName} {passenger.lastName}
          </p>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-line text-muted capitalize">
            {relMap[passenger.relationship] ?? passenger.relationship}
          </span>
          {passenger.isSelf && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-tint text-green font-medium">
              Me
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted mt-0.5">
          {COUNTRIES.find((c) => c.code === passenger.nationality)?.name ?? passenger.nationality}
          {' · '}Born {formatDate(passenger.dob)}
          {passenger.passportNumber && ` · Passport: ••••${passenger.passportNumber.slice(-4)}`}
        </p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-muted hover:text-navy hover:bg-surface transition-colors"
          title="Edit"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M10.5 2l2.5 2.5L5 12.5H2.5V10L10.5 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Remove"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M2 4h11M5 4V2.5h5V4M6 7v4M9 7v4M3 4l1 9h7l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SavedPassengersPage() {
  const { data: passengers, isPending, error } = usePassengers();
  const { mutateAsync: deletePassenger } = useDeletePassenger();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SavedPassenger | undefined>();
  const [deleting, setDeleting] = useState<SavedPassenger | undefined>();

  const count = passengers?.length ?? 0;
  const atCap = count >= 10;

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deletePassenger(deleting.id);
      toast.success('Passenger removed');
    } catch {
      toast.error('Failed to remove passenger');
    } finally {
      setDeleting(undefined);
    }
  }

  return (
    <MemberShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight">Saved Passengers</h1>
            <p className="text-muted text-sm mt-0.5">
              {count}/10 saved · pre-filled when booking
            </p>
          </div>
          <button
            onClick={() => { setEditing(undefined); setShowModal(true); }}
            disabled={atCap}
            className="btn-primary text-[13px] px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title={atCap ? 'Maximum 10 passengers' : undefined}
          >
            + Add passenger
          </button>
        </div>

        {atCap && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-[13px] text-amber-700">
            You&apos;ve reached the 10-passenger limit. Remove one to add another.
          </div>
        )}

        {isPending && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-line rounded-xl p-4 animate-pulse flex gap-4">
                <div className="w-10 h-10 rounded-full bg-line flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-line rounded w-40" />
                  <div className="h-3 bg-line rounded w-56" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
            {error.message}
          </div>
        )}

        {!isPending && !error && count === 0 && (
          <div className="text-center py-16 border border-dashed border-line rounded-xl">
            <p className="text-3xl mb-3">👤</p>
            <h3 className="font-semibold text-navy">No passengers saved yet</h3>
            <p className="text-muted text-sm mt-1 mb-5">
              Add frequent travellers to speed up booking.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-sm px-6 py-2.5"
            >
              Add your first passenger
            </button>
          </div>
        )}

        {passengers && passengers.length > 0 && (
          <div className="space-y-3">
            {passengers.map((p) => (
              <PassengerCard
                key={p.id}
                passenger={p}
                onEdit={() => { setEditing(p); setShowModal(true); }}
                onDelete={() => setDeleting(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <PassengerModal
          existing={editing}
          onClose={() => { setShowModal(false); setEditing(undefined); }}
        />
      )}
      {deleting && (
        <DeleteConfirm
          passenger={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(undefined)}
        />
      )}
    </MemberShell>
  );
}
