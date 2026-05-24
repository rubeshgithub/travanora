import { api } from '@/lib/api.js';

export interface DashboardMember {
  tier: string;
  discountPercent: number;
  joinedAt: string;
}

export interface DashboardStats {
  totalTrips: number;
  totalSavedAmount: number;
  upcomingCount: number;
}

// Matches BookingSummary returned by dashboard.service.ts
export interface DashboardBooking {
  id: string;
  bookingRef?: string;
  status: string;
  origin?: string;
  destination?: string;
  departureAt?: string;
  arrivalAt?: string;
  airlineName?: string;
  airlineCode?: string;
  isReturn: boolean;
  totalAmount: number;
  memberDiscount: number;
  currency: string;
  createdAt: string;
}

export interface DashboardData {
  member: DashboardMember;
  nextTrip: DashboardBooking | null;
  stats: DashboardStats;
  recentTrips: DashboardBooking[];
}

export function fetchDashboard(): Promise<DashboardData> {
  return api.get<DashboardData>('/api/dashboard');
}
