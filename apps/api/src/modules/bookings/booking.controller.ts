import { Request, Response } from 'express';
import { CreateOrderInputSchema, BookingDraftInputSchema } from '@travanora/shared';
import { Member } from '../auth/member.model.js';
import { AppError } from '../../middleware/error.handler.js';
import { getOffer, createOrder, createDraft, loadBookingForUser } from './booking.service.js';
import { Booking } from './booking.model.js';
import { Types } from 'mongoose';

async function getMemberDiscount(userId: string): Promise<number> {
  const member = await Member.findOne({ userId });
  return member?.discountPercent ?? 0;
}

export async function getOfferHandler(req: Request, res: Response) {
  const { offerId } = req.params as { offerId: string };
  const discountPercent = req.user ? await getMemberDiscount(req.user.sub) : 0;
  const result = await getOffer(offerId, discountPercent);
  return res.json(result);
}

export async function createOrderHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const input = CreateOrderInputSchema.parse(req.body);
  const discountPercent = await getMemberDiscount(req.user.sub);

  const result = await createOrder(new Types.ObjectId(req.user.sub), input, discountPercent);
  return res.status(201).json(result);
}

export async function listBookingsHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const bookings = await Booking.find({
    userId: new Types.ObjectId(req.user.sub),
    status: { $in: ['confirmed', 'paid', 'changed', 'cancelling', 'cancelled', 'payment_succeeded_booking_failed'] },
  })
    .sort({ createdAt: -1 });

  return res.json(bookings);
}

// ─── Phase 2 handlers ────────────────────────────────────────────────────────

export async function createDraftHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const input = BookingDraftInputSchema.parse(req.body);
  const discountPercent = await getMemberDiscount(req.user.sub);

  const result = await createDraft(new Types.ObjectId(req.user.sub), input, discountPercent);
  return res.status(201).json(result);
}

export async function getBookingByIdHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const { id } = req.params as { id: string };
  const booking = await loadBookingForUser(id, new Types.ObjectId(req.user.sub));
  return res.json(booking);
}

// ─── Phase 1 handlers (kept for /api/me/bookings compat) ─────────────────────

export async function getBookingByRefHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const { bookingRef } = req.params as { bookingRef: string };
  const booking = await Booking.findOne({
    bookingRef,
    userId: new Types.ObjectId(req.user.sub),
  }).lean();

  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  return res.json(booking);
}
