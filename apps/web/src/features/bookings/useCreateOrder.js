import { useMutation } from '@tanstack/react-query';
import { createOrder } from './booking.api.js';
export function useCreateOrder() {
    return useMutation({
        mutationFn: createOrder,
    });
}
//# sourceMappingURL=useCreateOrder.js.map