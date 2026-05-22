import { useMutation } from '@tanstack/react-query';
import { searchFlights } from './flights.api.js';
export function useFlightSearch() {
    return useMutation({
        mutationFn: searchFlights,
    });
}
//# sourceMappingURL=useFlightSearch.js.map