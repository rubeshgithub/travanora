import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  type UpdateProfileInput,
  type UpdatePreferencesInput,
  type ChangePasswordInput,
} from './account.api.js';

export function useProfile() {
  return useQuery({
    queryKey: ['account-profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['account-profile'] }),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePreferencesInput) => updatePreferences(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['account-profile'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
  });
}
