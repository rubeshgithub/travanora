import { useMutation } from '@tanstack/react-query';
import { createOrder } from './booking.api.js';
import type { CreateOrderInput, BookingConfirmation } from '@travanora/shared';

export function useCreateOrder() {
  return useMutation<BookingConfirmation, Error, CreateOrderInput>({
    mutationFn: createOrder,
  });
}
