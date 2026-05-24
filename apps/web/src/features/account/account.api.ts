import { api } from '@/lib/api.js';

export interface AccountProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dob?: string;
  nationality?: string;
  phone?: { countryCode: string; number: string };
  city?: string;
  preferences?: {
    homeAirport?: string;
    preferredCabin?: string;
    travelFrequency?: string;
    travelPurpose?: string;
  };
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  dob?: string;
  nationality?: string;
  phone?: { countryCode: string; number: string };
  city?: string;
}

export interface UpdatePreferencesInput {
  homeAirport?: string;
  preferredCabin?: string;
  travelFrequency?: string;
  travelPurpose?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  accessToken: string;
}

export function fetchProfile(): Promise<AccountProfile> {
  return api.get<AccountProfile>('/api/account');
}

export function updateProfile(input: UpdateProfileInput): Promise<AccountProfile> {
  return api.patch<AccountProfile>('/api/account', input);
}

export function updatePreferences(input: UpdatePreferencesInput): Promise<AccountProfile> {
  return api.patch<AccountProfile>('/api/account/preferences', input);
}

export function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResponse> {
  return api.post<ChangePasswordResponse>('/api/account/change-password', input);
}
