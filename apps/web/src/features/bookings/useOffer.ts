import { useQuery } from '@tanstack/react-query';
import { fetchOffer } from './booking.api.js';

export function useOffer(offerId: string) {
  return useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => fetchOffer(offerId),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}
