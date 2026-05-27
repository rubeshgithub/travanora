import { useState } from 'react';
import { MemberShell } from '@/components/MemberShell.js';
import { api } from '@/lib/api.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/lib/flightUtils.js';

interface PendingRefund {
  id: string;
  bookingId: string;
  bookingRef?: string;
  passengerName?: string;
  contactEmail?: string;
  reason: string;
  customerRefundAmount: number;
  customerRefundCurrency: string;
  customerRefundStatus: string;
  customerRefundReference?: string;
  customerRefundProvider: string;
  createdAt: string;
}

async function fetchPendingRefunds(): Promise<PendingRefund[]> {
  return api.get('/api/admin/refunds/pending');
}

async function resolveRefund(params: {
  ledgerId: string;
  status: 'completed' | 'failed';
  reference?: string;
  note?: string;
}): Promise<void> {
  const { ledgerId, ...body } = params;
  return api.post(`/api/admin/refunds/${ledgerId}/resolve`, body);
}

const STATUS_STYLE: Record<string, string> = {
  manual_required: 'bg-red-50 text-red-600 border border-red-100',
  pending: 'bg-amber-50 text-amber-600 border border-amber-100',
  failed: 'bg-red-50 text-red-600 border border-red-100',
};

const STATUS_LABEL: Record<string, string> = {
  manual_required: 'Manual required',
  pending: 'Pending',
  failed: 'Failed',
};

function ResolveModal({
  ledger,
  onClose,
  onResolve,
}: {
  ledger: PendingRefund;
  onClose: () => void;
  onResolve: (params: { status: 'completed' | 'failed'; reference?: string; note?: string }) => void;
}) {
  const [status, setStatus] = useState<'completed' | 'failed'>('completed');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-navy mb-1">Resolve refund</h2>
        <p className="text-[13px] text-muted mb-4">
          {ledger.bookingRef && <span className="font-mono">{ledger.bookingRef} · </span>}
          {formatPrice(ledger.customerRefundAmount, ledger.customerRefundCurrency)}
          {ledger.passengerName && <> · {ledger.passengerName}</>}
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-navy block mb-1.5">Resolution</label>
            <div className="flex gap-2">
              <button
                onClick={() => setStatus('completed')}
                className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${
                  status === 'completed'
                    ? 'bg-green text-amber-ink border-green'
                    : 'bg-white text-muted border-line hover:border-navy'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatus('failed')}
                className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${
                  status === 'failed'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-muted border-line hover:border-navy'
                }`}
              >
                Failed
              </button>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-navy block mb-1.5">
              Reference <span className="text-muted font-normal">(transfer ID, wire ref, etc.)</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. WIRE-2026-0042"
              className="w-full border border-line rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-navy block mb-1.5">
              Note <span className="text-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full border border-line rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-navy resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold border border-line text-muted hover:text-navy transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onResolve({ status, reference: reference || undefined, note: note || undefined })}
              className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold bg-navy text-white hover:bg-navy/90 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-KW', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminRefundsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PendingRefund | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ['admin', 'refunds', 'pending'],
    queryFn: fetchPendingRefunds,
  });

  const resolve = useMutation({
    mutationFn: resolveRefund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'refunds', 'pending'] });
      setSelected(null);
    },
  });

  return (
    <MemberShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Refund queue</h1>
          <p className="text-muted text-sm mt-0.5">Manual refunds needing ops resolution</p>
        </div>

        {isPending && (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-line rounded-xl" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
            {(error as Error).message}
          </div>
        )}

        {data && data.length === 0 && (
          <div className="bg-white border border-dashed border-line rounded-2xl px-6 py-10 text-center">
            <p className="text-2xl mb-2">✓</p>
            <p className="font-semibold text-navy">Queue is clear</p>
            <p className="text-muted text-sm mt-1">No pending manual refunds</p>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-navy">
                {data.length} pending
              </h2>
            </div>
            <div className="divide-y divide-line">
              {data.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {r.bookingRef && (
                        <span className="text-[12px] font-mono text-muted">{r.bookingRef}</span>
                      )}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[r.customerRefundStatus] ?? ''}`}>
                        {STATUS_LABEL[r.customerRefundStatus] ?? r.customerRefundStatus}
                      </span>
                      <span className="text-[11px] text-muted capitalize">{r.reason.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-[14px] font-semibold text-navy">
                      {formatPrice(r.customerRefundAmount, r.customerRefundCurrency)}
                    </p>
                    <p className="text-[12px] text-muted">
                      {r.passengerName ?? '—'}
                      {r.contactEmail && <> · {r.contactEmail}</>}
                      {' · '}{formatDate(r.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(r)}
                    className="text-[13px] font-semibold px-4 py-2 bg-navy text-white rounded-xl hover:bg-navy/90 transition-colors flex-shrink-0"
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <ResolveModal
          ledger={selected}
          onClose={() => setSelected(null)}
          onResolve={(params) =>
            resolve.mutate({ ledgerId: selected.id, ...params })
          }
        />
      )}
    </MemberShell>
  );
}
