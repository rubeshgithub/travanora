import { useQuery } from '@tanstack/react-query';
import { fetchMyBookings } from './booking.api.js';

export function useMyBookings() {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: fetchMyBookings,
  });
}
