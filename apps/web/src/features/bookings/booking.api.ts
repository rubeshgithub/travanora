import { api } from '@/lib/api.js';
import type { CreateOrderInput, OfferResponse, BookingConfirmation } from '@travanora/shared';

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
  bookingRef: string;
  totalAmount: number;
  savings: number;
  currency: string;
  status: 'confirmed' | 'cancelled';
  sliceSummary: MyBookingSlice[];
  createdAt: string;
}

export function fetchOffer(offerId: string): Promise<OfferResponse> {
  return api.get<OfferResponse>(`/api/flights/offers/${offerId}`);
}

export function createOrder(input: CreateOrderInput): Promise<BookingConfirmation> {
  return api.post<BookingConfirmation>('/api/flights/orders', input);
}

export function fetchMyBookings(): Promise<MyBooking[]> {
  return api.get<MyBooking[]>('/api/me/bookings');
}

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
  savings: number;
  currency: string;
  passengers: BookingPassenger[];
  sliceSummary: MyBookingSlice[];
  createdAt: string;
}

export function fetchBookingByRef(bookingRef: string): Promise<BookingDetail> {
  return api.get<BookingDetail>(`/api/me/bookings/${bookingRef}`);
}
