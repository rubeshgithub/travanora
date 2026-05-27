import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../middleware/error.handler.js';
import { RefundLedger, type RefundReason, type CustomerRefundStatus } from './refund-ledger.model.js';
import { AuditLog } from '../audit/audit-log.model.js';
import type { IBooking } from '../bookings/booking.model.js';

// ─── Currency helper (mirrors payment.service.ts) ─────────────────────────────

const THREE_DECIMAL = new Set(['KWD', 'BHD', 'JOD', 'OMR', 'TND']);
const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);

function toSmallestUnit(amount: number, currency: string): number {
  const c = currency.toUpperCase();
  if (THREE_DECIMAL.has(c)) return Math.round(amount * 1000);
  if (ZERO_DECIMAL.has(c)) return Math.round(amount);
  return Math.round(amount * 100);
}

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError(503, 'STRIPE_NOT_CONFIGURED', 'Payment processing is not configured');
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RefundCustomerResult {
  status: CustomerRefundStatus;
  providerReference?: string;
}

export async function refundCustomer(params: {
  booking: IBooking;
  amount: number;
  currency: string;
  reason: RefundReason;
  ledgerId: string;
}): Promise<RefundCustomerResult> {
  const { booking, amount, currency, reason, ledgerId } = params;
  const bookingId = String(booking._id);

  // ── Guard: zero refund (non-refundable fare) ──────────────────────────────
  if (amount <= 0) {
    await RefundLedger.findByIdAndUpdate(ledgerId, {
      customerRefundStatus: 'completed',
      completedAt: new Date(),
    });
    await AuditLog.create({
      actorUserId: booking.userId,
      bookingId: booking._id,
      action: 'customer_refund_completed',
      payloadSummary: { reason, amount: 0, currency, note: 'non-refundable fare' },
      result: 'success',
    });
    logger.info({ bookingId, reason }, 'Zero refund — non-refundable fare');
    return { status: 'completed' };
  }

  // ── Guard: no Stripe payment intent ──────────────────────────────────────
  if (!booking.stripePaymentIntentId) {
    logger.warn({ bookingId, reason }, 'No stripePaymentIntentId — manual refund required');
    return await markManual(booking, amount, currency, reason, ledgerId, 'No Stripe payment intent on record');
  }

  // ── Guard: over-refund protection ─────────────────────────────────────────
  // Option A: customer gets back max what they paid. Stripe also enforces this
  // but we check first to avoid an API error.
  if (amount > booking.totalAmount) {
    logger.warn({ bookingId, amount, totalAmount: booking.totalAmount }, 'Refund exceeds original charge — manual required');
    return await markManual(booking, amount, currency, reason, ledgerId, 'Refund amount exceeds original charge');
  }

  const stripe = getStripe();

  try {
    const idempotencyKey = `refund_${bookingId}_${reason}`;
    const stripeAmount = toSmallestUnit(amount, currency);

    const refund = await stripe.refunds.create(
      {
        payment_intent: booking.stripePaymentIntentId,
        amount: stripeAmount,
        metadata: { bookingId, reason },
      },
      { idempotencyKey },
    );

    const status: CustomerRefundStatus =
      refund.status === 'succeeded' ? 'completed' : 'processing';

    await RefundLedger.findByIdAndUpdate(ledgerId, {
      customerRefundStatus: status,
      customerRefundReference: refund.id,
      ...(status === 'completed' ? { completedAt: new Date() } : {}),
    });

    await AuditLog.create({
      actorUserId: booking.userId,
      bookingId: booking._id,
      action: 'customer_refund_initiated',
      payloadSummary: { reason, amount, currency, stripeRefundId: refund.id, status },
      result: 'success',
    });

    logger.info({ bookingId, refundId: refund.id, status, amount, currency }, 'Stripe refund created');
    return { status, providerReference: refund.id };

  } catch (err) {
    const errMsg = (err as Error).message;
    logger.error({ err, bookingId, reason }, 'Stripe refund failed — marking manual');

    await RefundLedger.findByIdAndUpdate(ledgerId, { customerRefundStatus: 'manual_required' });
    await AuditLog.create({
      actorUserId: booking.userId,
      bookingId: booking._id,
      action: 'customer_refund_failed',
      payloadSummary: { reason, amount, currency, error: errMsg },
      result: 'failure',
      error: errMsg,
    });

    return { status: 'manual_required' };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function markManual(
  booking: IBooking,
  amount: number,
  currency: string,
  reason: RefundReason,
  ledgerId: string,
  note: string,
): Promise<RefundCustomerResult> {
  await RefundLedger.findByIdAndUpdate(ledgerId, { customerRefundStatus: 'manual_required' });
  await AuditLog.create({
    actorUserId: booking.userId,
    bookingId: booking._id,
    action: 'customer_refund_initiated',
    payloadSummary: { reason, amount, currency, note, provider: 'manual' },
    result: 'failure',
    error: note,
  });
  return { status: 'manual_required' };
}
