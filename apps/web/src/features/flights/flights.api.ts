import { api } from '@/lib/api.js';
import type { FlightSearchInput, FlightSearchResponse } from '@travanora/shared';

export async function searchFlights(input: FlightSearchInput): Promise<FlightSearchResponse> {
  return api.post<FlightSearchResponse>('/api/flights/search', input);
}
