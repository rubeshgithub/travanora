import { useMutation } from '@tanstack/react-query';
import type { BookingDraftInput } from '@travanora/shared';
import { createBookingDraft } from './booking.api.js';

export function useBookingDraft() {
  return useMutation({
    mutationFn: (input: BookingDraftInput) => createBookingDraft(input),
  });
}
