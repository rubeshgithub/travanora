import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from './dashboard.api.js';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 60_000,
  });
}
