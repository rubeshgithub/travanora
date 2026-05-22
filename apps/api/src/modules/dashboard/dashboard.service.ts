import { Member } from '../auth/member.model.js';
import { Booking } from '../bookings/booking.model.js';
import { AppError } from '../../middleware/error.handler.js';

export interface BookingSummary {
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
  createdAt: Date;
}

export interface DashboardData {
  member: { tier: string; discountPercent: number; joinedAt: Date };
  nextTrip: BookingSummary | null;
  stats: { totalTrips: number; totalSavedAmount: number; upcomingCount: number };
  recentTrips: BookingSummary[];
}

function toSummary(b: Record<string, unknown>): BookingSummary {
  const slices = (b.sliceSummary as Array<Record<string, string>> | undefined) ?? [];
  const first = slices[0];
  return {
    id:            String(b._id),
    bookingRef:    b.bookingRef as string | undefined,
    status:        b.status as string,
    origin:        first?.origin,
    destination:   first?.destination,
    departureAt:   first?.departureAt,
    arrivalAt:     first?.arrivalAt,
    airlineName:   first?.airlineName,
    airlineCode:   first?.airlineCode,
    isReturn:      slices.length > 1,
    totalAmount:   (b.totalAmount as number) ?? 0,
    memberDiscount:(b.memberDiscount as number) ?? 0,
    currency:      (b.currency as string) ?? 'KWD',
    createdAt:     b.createdAt as Date,
  };
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  const [member, bookings] = await Promise.all([
    Member.findOne({ userId }),
    Booking.find({ userId, status: 'confirmed' })
      .sort({ createdAt: -1 })
      .lean<Record<string, unknown>[]>(),
  ]);

  if (!member) throw new AppError(500, 'MEMBER_NOT_FOUND', 'Member profile missing');

  const now = new Date().toISOString();

  const upcoming = bookings
    .filter((b) => {
      const slices = b.sliceSummary as Array<{ departureAt?: string }> | undefined;
      const dep = slices?.[0]?.departureAt;
      return dep && dep > now;
    })
    .sort((a, b) => {
      const slicesA = a.sliceSummary as Array<{ departureAt?: string }> | undefined;
      const slicesB = b.sliceSummary as Array<{ departureAt?: string }> | undefined;
      return (slicesA?.[0]?.departureAt ?? '').localeCompare(slicesB?.[0]?.departureAt ?? '');
    });

  const totalSavedAmount = bookings.reduce((sum, b) => sum + ((b.memberDiscount as number) ?? 0), 0);

  return {
    member: {
      tier:            member.tier,
      discountPercent: member.discountPercent,
      joinedAt:        member.joinedAt,
    },
    nextTrip:    upcoming[0] ? toSummary(upcoming[0]) : null,
    stats: {
      totalTrips:       bookings.length,
      totalSavedAmount: Math.round(totalSavedAmount * 1000) / 1000,
      upcomingCount:    upcoming.length,
    },
    recentTrips: bookings.slice(0, 3).map(toSummary),
  };
}
