import { api } from '@/lib/api.js';

export interface SavedPassenger {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportIssuingCountry?: string;
  relationship: string;
  isSelf: boolean;
  createdAt: string;
}

export interface SavedPassengerInput {
  title: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportIssuingCountry?: string;
  relationship: string;
}

export function fetchPassengers(): Promise<SavedPassenger[]> {
  return api.get<{ passengers: SavedPassenger[] }>('/api/passengers').then((r) => r.passengers);
}

export function createPassenger(input: SavedPassengerInput): Promise<SavedPassenger> {
  return api.post<{ passenger: SavedPassenger }>('/api/passengers', input).then((r) => r.passenger);
}

export function updatePassenger(id: string, input: Partial<SavedPassengerInput>): Promise<SavedPassenger> {
  return api.patch<{ passenger: SavedPassenger }>(`/api/passengers/${id}`, input).then((r) => r.passenger);
}

export function deletePassenger(id: string): Promise<void> {
  return api.delete<void>(`/api/passengers/${id}`);
}
