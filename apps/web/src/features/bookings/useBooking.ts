import { useQuery } from '@tanstack/react-query';
import { fetchBookingByRef } from './booking.api.js';

export function useBooking(bookingRef: string) {
  return useQuery({
    queryKey: ['booking', bookingRef],
    queryFn: () => fetchBookingByRef(bookingRef),
    enabled: !!bookingRef,
  });
}
