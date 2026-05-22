import type { CreateOrderInput, OfferResponse, BookingConfirmation, BookingDraftInput } from '@travanora/shared';
export interface MyBookingSlice {
    origin: string;
    destination: string;
    departureAt: string;
    arrivalAt: string;
    airlineName: string;
    airlineCode: string;
}
export interface MyBooking {
    id: string;
    bookingRef?: string;
    totalAmount: number;
    savings: number;
    currency: string;
    status: 'confirmed' | 'cancelled' | 'payment_succeeded_booking_failed' | 'failed';
    sliceSummary: MyBookingSlice[];
    createdAt: string;
}
export declare function fetchOffer(offerId: string): Promise<OfferResponse>;
export declare function createOrder(input: CreateOrderInput): Promise<BookingConfirmation>;
export declare function fetchMyBookings(): Promise<MyBooking[]>;
export interface BookingPassenger {
    title: string;
    given_name: string;
    family_name: string;
    born_on: string;
    gender: string;
    email: string;
    phone_number: string;
}
export interface BookingDetail {
    id: string;
    bookingRef: string;
    status: 'confirmed' | 'cancelled';
    totalAmount: number;
    publicPrice: number;
    memberDiscount: number;
    discountPercent: number;
    savings: number;
    currency: string;
    passengers: BookingPassenger[];
    sliceSummary: MyBookingSlice[];
    paidAt?: string;
    createdAt: string;
}
export declare function fetchBookingByRef(bookingRef: string): Promise<BookingDetail>;
export interface BookingSliceV2 {
    origin: string;
    originName?: string;
    destination: string;
    destinationName?: string;
    departureAt: string;
    arrivalAt: string;
    durationMinutes?: number;
    stops?: number;
    segments?: Array<{
        flightNumber: string;
        airlineName: string;
        airlineCode: string;
        departureAt: string;
        arrivalAt: string;
        origin: string;
        destination: string;
    }>;
}
export interface BookingPassengerV2 {
    type?: string;
    title: string;
    firstName?: string;
    lastName?: string;
    dob?: string;
    gender: string;
    nationality?: string;
    passportNumber?: string;
    passportExpiry?: string;
    passportIssuingCountry?: string;
    email: string;
    phone?: {
        countryCode: string;
        number: string;
    };
}
export interface BookingDetailV2 {
    id: string;
    status: string;
    duffelOfferId?: string;
    duffelOrderId?: string;
    bookingRef?: string;
    pnr?: string;
    offerSnapshot?: {
        slices: BookingSliceV2[];
        airline: string;
        airlineCode: string;
        cabinClass: string;
    };
    passengers: BookingPassengerV2[];
    contactEmail?: string;
    contactPhone?: string;
    publicPrice: number;
    memberDiscount: number;
    totalAmount: number;
    currency: string;
    discountPercent: number;
    duffelOfferExpiresAt?: string;
    stripePaymentIntentId?: string;
    paidAt?: string;
    confirmedAt?: string;
    createdAt: string;
    updatedAt: string;
}
export interface BookingDraftAPIResponse {
    bookingId: string;
    totalAmount: number;
    currency: string;
    expiresAt: string;
    publicPrice: number;
    memberDiscount: number;
    discountPercent: number;
}
export declare function createBookingDraft(input: BookingDraftInput): Promise<BookingDraftAPIResponse>;
export declare function fetchBookingById(bookingId: string): Promise<BookingDetailV2>;
export declare function createPaymentIntent(bookingId: string): Promise<{
    clientSecret: string;
}>;
//# sourceMappingURL=booking.api.d.ts.map