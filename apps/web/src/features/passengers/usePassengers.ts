import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPassengers,
  createPassenger,
  updatePassenger,
  deletePassenger,
  type SavedPassengerInput,
} from './passenger.api.js';

export function usePassengers() {
  return useQuery({
    queryKey: ['saved-passengers'],
    queryFn: fetchPassengers,
    staleTime: 5 * 60_000,
  });
}

export function useCreatePassenger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SavedPassengerInput) => createPassenger(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-passengers'] }),
  });
}

export function useUpdatePassenger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SavedPassengerInput> }) =>
      updatePassenger(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-passengers'] }),
  });
}

export function useDeletePassenger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePassenger(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-passengers'] }),
  });
}
