import { useQuery } from '@tanstack/react-query';
import { fetchOffer } from './booking.api.js';
export function useOffer(offerId) {
    return useQuery({
        queryKey: ['offer', offerId],
        queryFn: () => fetchOffer(offerId),
        staleTime: 2 * 60 * 1000,
        retry: false,
    });
}
//# sourceMappingURL=useOffer.js.map