import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../../middleware/error.handler.js';
import { createPaymentIntent, handleWebhookEvent } from './payment.service.js';

export async function createIntentHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const { bookingId } = req.body as { bookingId?: string };
  if (!bookingId) throw new AppError(400, 'MISSING_BOOKING_ID', 'bookingId is required');

  const result = await createPaymentIntent(new Types.ObjectId(req.user.sub), bookingId);
  return res.json(result);
}

export async function webhookHandler(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // req.body is a Buffer (raw body middleware applied in app.ts)
  await handleWebhookEvent(req.body as Buffer, signature);

  return res.json({ received: true });
}
