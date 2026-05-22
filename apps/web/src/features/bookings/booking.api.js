import { api } from '@/lib/api.js';
export function fetchOffer(offerId) {
    return api.get(`/api/flights/offers/${offerId}`);
}
export function createOrder(input) {
    return api.post('/api/flights/orders', input);
}
export function fetchMyBookings() {
    return api.get('/api/me/bookings');
}
export function fetchBookingByRef(bookingRef) {
    return api.get(`/api/me/bookings/${bookingRef}`);
}
export function createBookingDraft(input) {
    return api.post('/api/bookings/draft', input);
}
export function fetchBookingById(bookingId) {
    return api.get(`/api/bookings/${bookingId}`);
}
export function createPaymentIntent(bookingId) {
    return api.post('/api/payments/create-intent', { bookingId });
}
//# sourceMappingURL=booking.api.js.map