import { useQuery } from '@tanstack/react-query';
import { fetchBookingById } from './booking.api.js';
export function useBookingById(bookingId) {
    return useQuery({
        queryKey: ['booking', bookingId],
        queryFn: () => fetchBookingById(bookingId),
        enabled: !!bookingId,
        staleTime: 30 * 1000,
        retry: false,
    });
}
//# sourceMappingURL=useBookingById.js.map