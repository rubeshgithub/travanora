import { Request, Response } from 'express';
import { CreateOrderInputSchema } from '@travanora/shared';
import { Member } from '../auth/member.model.js';
import { AppError } from '../../middleware/error.handler.js';
import { getOffer, createOrder } from './booking.service.js';
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

  const bookings = await Booking.find({ userId: new Types.ObjectId(req.user.sub) })
    .sort({ createdAt: -1 })
    .lean();

  return res.json(bookings);
}

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
