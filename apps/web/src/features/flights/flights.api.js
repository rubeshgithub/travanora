import { api } from '@/lib/api.js';
export async function searchFlights(input) {
    return api.post('/api/flights/search', input);
}
//# sourceMappingURL=flights.api.js.map