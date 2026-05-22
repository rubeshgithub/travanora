import { useMutation } from '@tanstack/react-query';
import { searchFlights } from './flights.api.js';
import type { FlightSearchInput, FlightSearchResponse } from '@travanora/shared';

export function useFlightSearch() {
  return useMutation<FlightSearchResponse, Error, FlightSearchInput>({
    mutationFn: searchFlights,
  });
}
