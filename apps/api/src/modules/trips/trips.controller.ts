import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../../middleware/error.handler.js';
import {
  getConditions,
  getRefundLedger,
  quoteCancellation,
  confirmCancellation,
  changeSearch,
  confirmChange,
} from './trips.service.js';

export async function conditionsHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { id } = req.params as { id: string };
  const result = await getConditions(id, new Types.ObjectId(req.user.sub));
  return res.json(result);
}

export async function cancellationQuoteHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { id } = req.params as { id: string };
  const result = await quoteCancellation(id, new Types.ObjectId(req.user.sub));
  return res.json(result);
}

export async function cancellationConfirmHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { id } = req.params as { id: string };
  const result = await confirmCancellation(id, new Types.ObjectId(req.user.sub));
  return res.json(result);
}

export async function refundLedgerHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { bookingId } = req.params as { bookingId: string };
  const entries = await getRefundLedger(bookingId, new Types.ObjectId(req.user.sub));
  return res.json({ refunds: entries });
}

export async function changeSearchHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { id } = req.params as { id: string };
  const { departureDate, sliceIndex } = req.body as { departureDate?: string; sliceIndex?: number };
  if (!departureDate) throw new AppError(400, 'MISSING_DATE', 'departureDate is required');
  const result = await changeSearch(id, new Types.ObjectId(req.user.sub), { departureDate, sliceIndex });
  return res.json(result);
}

export async function changeConfirmHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { id } = req.params as { id: string };
  const { offerId } = req.body as { offerId?: string };
  if (!offerId) throw new AppError(400, 'MISSING_OFFER', 'offerId is required');
  const result = await confirmChange(id, new Types.ObjectId(req.user.sub), { offerId });
  return res.json(result);
}
