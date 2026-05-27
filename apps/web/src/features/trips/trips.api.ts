import { api } from '@/lib/api.js';

export interface TripConditions {
  canCancel: boolean;
  canChange: boolean;
  refundCondition: {
    allowed: boolean;
    penaltyAmount: number | null;
    penaltyCurrency: string | null;
  } | null;
  changeCondition: {
    allowed: boolean;
    penaltyAmount: number | null;
    penaltyCurrency: string | null;
  } | null;
}

export interface RefundLedgerEntry {
  id: string;
  bookingId: string;
  reason: 'cancellation' | 'change_difference' | 'booking_failed';
  airlineRefundAmount: number;
  airlineRefundCurrency: string;
  airlineRefundStatus: 'pending' | 'received' | 'not_applicable';
  customerRefundAmount: number;
  customerRefundCurrency: string;
  customerRefundStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'manual_required';
  customerRefundReference?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CancellationQuote {
  cancellationId: string;
  refundAmount: number | null;
  refundCurrency: string | null;
  penalty: number;
  expiresAt: string | null;
  isRefundUnknown: boolean;
}

export interface CancellationResult {
  status: 'cancelled';
  customerRefundAmount: number;
  customerRefundStatus: string;
  isManualRefund: boolean;
}

export function fetchConditions(bookingId: string): Promise<TripConditions> {
  return api.get<TripConditions>(`/api/trips/${bookingId}/conditions`);
}

export function fetchCancellationQuote(bookingId: string): Promise<CancellationQuote> {
  return api.post<CancellationQuote>(`/api/trips/${bookingId}/cancellation-quote`, {});
}

export function confirmCancellation(bookingId: string): Promise<CancellationResult> {
  return api.post<CancellationResult>(`/api/trips/${bookingId}/cancellation-confirm`, {});
}

export function fetchRefundLedger(bookingId: string): Promise<RefundLedgerEntry[]> {
  return api.get<{ refunds: RefundLedgerEntry[] }>(`/api/trips/refunds/${bookingId}`).then((r) => r.refunds);
}

// ─── Change ───────────────────────────────────────────────────────────────────

export interface ChangeOfferSlice {
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes?: number;
  stops: number;
  segments: Array<{
    flightNumber: string;
    airlineName: string;
    airlineCode: string;
    departureAt: string;
    arrivalAt: string;
    origin: string;
    destination: string;
  }>;
}

export interface ChangeOffer {
  id: string;
  changeTotalAmount: number;
  changeTotalCurrency: string;
  newTotalAmount: number;
  expiresAt: string | null;
  slices: ChangeOfferSlice[];
}

export interface ChangeSearchResult {
  changeRequestId: string;
  sliceIndex: number;
  origin: string;
  destination: string;
  offers: ChangeOffer[];
}

export interface ChangeResult {
  status: 'changed';
  changeTotalAmount: number;
  currency: string;
  isRefund: boolean;
  customerRefundStatus?: string;
}

export function searchFlightChange(
  bookingId: string,
  body: { departureDate: string; sliceIndex?: number },
): Promise<ChangeSearchResult> {
  return api.post<ChangeSearchResult>(`/api/trips/${bookingId}/change-search`, body);
}

export function confirmFlightChange(
  bookingId: string,
  body: { offerId: string },
): Promise<ChangeResult> {
  return api.post<ChangeResult>(`/api/trips/${bookingId}/change-confirm`, body);
}
