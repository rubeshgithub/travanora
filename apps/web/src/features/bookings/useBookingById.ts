import { useQuery } from '@tanstack/react-query';
import { fetchBookingById } from './booking.api.js';

export function useBookingById(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBookingById(bookingId!),
    enabled: !!bookingId,
    staleTime: 30 * 1000,
    retry: false,
  });
}
