import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchConditions,
  fetchRefundLedger,
  fetchCancellationQuote,
  confirmCancellation,
  searchFlightChange,
  confirmFlightChange,
} from './trips.api.js';

export function useConditions(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['trip-conditions', bookingId],
    queryFn: () => fetchConditions(bookingId!),
    enabled: !!bookingId,
    staleTime: 2 * 60_000,
  });
}

export function useCancellationQuote(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['cancellation-quote', bookingId],
    queryFn: () => fetchCancellationQuote(bookingId!),
    enabled: !!bookingId,
    staleTime: 0,        // always fresh — quote has an expiry
    retry: false,        // don't retry on 422 (action not allowed)
  });
}

export function useConfirmCancellation(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => confirmCancellation(bookingId),
    onSuccess: () => {
      // Invalidate booking and conditions so TripDetailPage reflects cancelled state
      qc.invalidateQueries({ queryKey: ['booking', bookingId] });
      qc.invalidateQueries({ queryKey: ['trip-conditions', bookingId] });
      qc.invalidateQueries({ queryKey: ['refund-ledger', bookingId] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}

export function useRefundLedger(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['refund-ledger', bookingId],
    queryFn: () => fetchRefundLedger(bookingId!),
    enabled: !!bookingId,
    staleTime: 30_000,
  });
}

export function useChangeSearch(bookingId: string | undefined) {
  return useMutation({
    mutationFn: (body: { departureDate: string; sliceIndex?: number }) =>
      searchFlightChange(bookingId!, body),
  });
}

export function useConfirmChange(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { offerId: string }) => confirmFlightChange(bookingId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking', bookingId] });
      qc.invalidateQueries({ queryKey: ['trip-conditions', bookingId] });
      qc.invalidateQueries({ queryKey: ['refund-ledger', bookingId] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}
