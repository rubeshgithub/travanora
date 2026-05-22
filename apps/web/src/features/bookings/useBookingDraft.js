import { useMutation } from '@tanstack/react-query';
import { createBookingDraft } from './booking.api.js';
export function useBookingDraft() {
    return useMutation({
        mutationFn: (input) => createBookingDraft(input),
    });
}
//# sourceMappingURL=useBookingDraft.js.map