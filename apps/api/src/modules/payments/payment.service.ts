import Stripe from 'stripe';
import { Types } from 'mongoose';
import { DuffelError } from '@duffel/api';
import type { DuffelPassengerTitle, DuffelPassengerGender } from '@duffel/api/types';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { duffel } from '../../lib/duffel.js';
import { Booking } from '../bookings/booking.model.js';
import { WebhookEvent } from './webhook-event.model.js';
import { AppError } from '../../middleware/error.handler.js';
import { sendBookingConfirmation } from '../emails/email.service.js';
import { RefundLedger } from '../refunds/refund-ledger.model.js';
import { AuditLog } from '../audit/audit-log.model.js';

// ─── Currency helpers ─────────────────────────────────────────────────────────

const THREE_DECIMAL = new Set(['KWD', 'BHD', 'JOD', 'OMR', 'TND']);
const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);

function toSmallestUnit(amount: number, currency: string): number {
  const c = currency.toUpperCase();
  if (THREE_DECIMAL.has(c)) return Math.round(amount * 1000);
  if (ZERO_DECIMAL.has(c)) return Math.round(amount);
  return Math.round(amount * 100);
}

function toE164(phone: string): string {
  const stripped = phone.replace(/[^\d+]/g, '');
  return stripped.startsWith('+') ? stripped : `+${stripped}`;
}

// ─── Stripe client ────────────────────────────────────────────────────────────

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError(503, 'STRIPE_NOT_CONFIGURED', 'Payment processing is not configured');
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

// ─── Create payment intent ────────────────────────────────────────────────────

export async function createPaymentIntent(
  userId: Types.ObjectId,
  bookingId: string,
): Promise<{ clientSecret: string }> {
  const stripe = getStripe();

  const booking = await Booking.findOne({ _id: bookingId, userId });
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');

  if (booking.status !== 'draft' && booking.status !== 'pending_payment') {
    throw new AppError(409, 'BOOKING_NOT_PAYABLE', `Booking cannot be paid (status: ${booking.status})`);
  }

  // Idempotent — if a PaymentIntent was already created, return its secret
  if (booking.stripePaymentIntentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
      if (existing.client_secret && existing.status !== 'canceled') {
        return { clientSecret: existing.client_secret };
      }
    } catch {
      // PI not found or stale — create a fresh one below
    }
  }

  const amount = toSmallestUnit(booking.totalAmount, booking.currency);
  const pi = await stripe.paymentIntents.create({
    amount,
    currency: booking.currency.toLowerCase(),
    metadata: {
      bookingId,
      userId: userId.toString(),
    },
  });

  if (!pi.client_secret) {
    throw new AppError(500, 'STRIPE_ERROR', 'Failed to create payment intent');
  }

  // Atomic CAS: only one concurrent caller wins; the other cancels its PI and returns the winner's secret
  const updated = await Booking.findOneAndUpdate(
    { _id: bookingId, status: 'draft' },
    { stripePaymentIntentId: pi.id, status: 'pending_payment' },
    { new: true },
  );

  if (!updated) {
    await stripe.paymentIntents.cancel(pi.id).catch(() => {});
    const refreshed = await Booking.findById(bookingId);
    const winner = await stripe.paymentIntents.retrieve(refreshed!.stripePaymentIntentId!);
    logger.info({ bookingId, loserPiId: pi.id, winnerPiId: winner.id }, 'Lost PI race — returning winner secret');
    return { clientSecret: winner.client_secret! };
  }

  logger.info({ bookingId, piId: pi.id, amount, currency: booking.currency }, 'Payment intent created');

  return { clientSecret: pi.client_secret };
}

// ─── Webhook handling ─────────────────────────────────────────────────────────

export async function handleWebhookEvent(payload: Buffer, signature: string): Promise<void> {
  const stripe = getStripe();

  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(503, 'WEBHOOK_NOT_CONFIGURED', 'Webhook secret not configured');
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new AppError(400, 'WEBHOOK_INVALID', `Stripe signature verification failed: ${(err as Error).message}`);
  }

  // Idempotency — skip already-processed events
  const already = await WebhookEvent.findOne({ eventId: event.id });
  if (already) {
    logger.info({ eventId: event.id, type: event.type }, 'Webhook event already processed');
    return;
  }
  await WebhookEvent.create({ eventId: event.id, processedAt: new Date() });

  logger.info({ eventId: event.id, type: event.type }, 'Processing Stripe webhook event');

  if (event.type === 'payment_intent.succeeded') {
    await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
  } else if (event.type === 'payment_intent.payment_failed') {
    await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
  } else if (event.type === 'charge.refunded') {
    await handleChargeRefunded(event.data.object as Stripe.Charge);
  } else if (event.type === 'refund.updated') {
    await handleRefundUpdated(event.data.object as Stripe.Refund);
  }
}

// ─── Payment succeeded ────────────────────────────────────────────────────────

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  logger.info({ piId: pi.id }, 'Payment succeeded — creating Duffel order');

  const booking = await Booking.findOne({ stripePaymentIntentId: pi.id });
  if (!booking) {
    logger.warn({ piId: pi.id }, 'No booking found for payment intent — skipping');
    return;
  }
  if (booking.status === 'confirmed') {
    logger.info({ bookingId: String(booking._id) }, 'Booking already confirmed — skipping');
    return;
  }

  const bookingId = String(booking._id);
  const snapshot = booking.offerSnapshot;
  const passengers = booking.passengers as unknown as Array<Record<string, unknown>>;

  try {
    const rawOffer = await duffel.offers.get(booking.duffelOfferId!);
    const duffelPassengerIds = rawOffer.data.passengers.map((p) => p.id);

    if (passengers.length !== duffelPassengerIds.length) {
      throw new Error(
        `Passenger count mismatch: booking has ${passengers.length}, offer has ${duffelPassengerIds.length}`,
      );
    }

    const order = await duffel.orders.create({
      type: 'instant',
      selected_offers: [booking.duffelOfferId!],
      passengers: passengers.map((p, i) => ({
        id: duffelPassengerIds[i]!,
        title: p.title as DuffelPassengerTitle,
        gender: p.gender as DuffelPassengerGender,
        given_name: (p.firstName ?? p.given_name) as string,
        family_name: (p.lastName ?? p.family_name) as string,
        born_on: p.dob instanceof Date
          ? p.dob.toISOString().slice(0, 10)
          : (p.dob ?? p.born_on) as string,
        email: p.email as string,
        phone_number: toE164(
          p.phone
            ? `${(p.phone as { countryCode: string }).countryCode}${(p.phone as { number: string }).number}`
            : (p.phone_number as string) ?? '',
        ),
      })),
      payments: [
        {
          type: 'balance',
          amount: rawOffer.data.total_amount,
          currency: rawOffer.data.total_currency,
        },
      ],
    });

    const bookingRef = order.data.booking_reference;
    const duffelOrderId = order.data.id;

    // Build sliceSummary for backward compat with MyBookingsPage
    const sliceSummary = snapshot?.slices.map((s) => ({
      origin: s.origin,
      destination: s.destination,
      departureAt: s.departureAt,
      arrivalAt: s.arrivalAt,
      airlineName: snapshot.airline,
      airlineCode: snapshot.airlineCode,
    })) ?? [];

    await Booking.findByIdAndUpdate(bookingId, {
      status: 'confirmed',
      duffelOrderId,
      bookingRef,
      paidAt: new Date(),
      confirmedAt: new Date(),
      sliceSummary,
    });

    logger.info({ bookingId, bookingRef, duffelOrderId }, 'Booking confirmed');

    // Send confirmation email (failure doesn't roll back the booking)
    const recipient = (booking.contactEmail ?? (passengers[0]?.email as string)) || '';
    if (recipient) {
      try {
        await sendBookingConfirmation(recipient, {
          bookingRef,
          passengerName: [passengers[0]?.firstName, passengers[0]?.lastName]
            .filter(Boolean)
            .join(' '),
          passengers: passengers.map((p) => ({
            firstName: (p.firstName ?? p.given_name ?? '') as string,
            lastName: (p.lastName ?? p.family_name ?? '') as string,
            dob: p.dob instanceof Date
              ? p.dob.toISOString().slice(0, 10)
              : (p.dob ?? p.born_on) as string | undefined,
          })),
          totalAmount: booking.totalAmount,
          currency: booking.currency,
          slices: snapshot?.slices ?? [],
          airline: snapshot?.airline ?? '',
          bookingId,
        });
        await Booking.findByIdAndUpdate(bookingId, { confirmationEmailSentAt: new Date() });
      } catch (emailErr) {
        logger.error({ err: emailErr, bookingId }, 'Confirmation email failed (non-fatal)');
      }
    }
  } catch (err) {
    const isDuffelError = err instanceof DuffelError;
    logger.error(
      { err, piId: pi.id, bookingId, isDuffelError },
      'Duffel order creation failed after payment',
    );
    await Booking.findByIdAndUpdate(bookingId, {
      status: 'payment_succeeded_booking_failed',
      failureReason: (err as Error).message,
      failedAt: new Date(),
      refundRequiredAt: new Date(),
    });

    // Hop 1 = not_applicable (order never created, no airline refund)
    // Hop 2 = pending (we owe the customer their totalAmount back via Stripe)
    await RefundLedger.create({
      bookingId: booking._id,
      userId: booking.userId,
      reason: 'booking_failed',
      airlineRefundAmount: 0,
      airlineRefundCurrency: booking.currency,
      airlineRefundStatus: 'not_applicable',
      customerRefundAmount: booking.totalAmount,
      customerRefundCurrency: booking.currency,
      customerRefundStatus: 'pending',
      customerRefundProvider: 'stripe',
    });

    await AuditLog.create({
      actorUserId: booking.userId,
      bookingId: booking._id,
      action: 'customer_refund_initiated',
      payloadSummary: {
        reason: 'booking_failed',
        customerRefundAmount: booking.totalAmount,
        currency: booking.currency,
        piId: pi.id,
        errorMessage: (err as Error).message,
      },
      result: 'failure',
      error: 'Duffel order creation failed — refund queued',
    });
  }
}

// ─── Refund webhook handlers ──────────────────────────────────────────────────

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const refund = charge.refunds?.data?.[0];
  if (!refund) return;

  const booking = await Booking.findOne({ stripePaymentIntentId: charge.payment_intent as string });
  if (!booking) return;

  const ledger = await RefundLedger.findOneAndUpdate(
    { bookingId: booking._id, customerRefundReference: refund.id },
    { customerRefundStatus: 'completed', completedAt: new Date() },
    { new: true },
  );
  if (!ledger) return;

  logger.info({ bookingId: String(booking._id), refundId: refund.id }, 'Refund completed via charge.refunded');
  await AuditLog.create({
    actorUserId: booking.userId,
    bookingId: booking._id,
    action: 'customer_refund_completed',
    payloadSummary: { refundId: refund.id, amount: refund.amount, currency: refund.currency },
    result: 'success',
  });
}

async function handleRefundUpdated(refund: Stripe.Refund): Promise<void> {
  if (refund.status !== 'succeeded' && refund.status !== 'failed') return;

  const ledger = await RefundLedger.findOne({ customerRefundReference: refund.id });
  if (!ledger) return;

  if (refund.status === 'succeeded') {
    await ledger.updateOne({ customerRefundStatus: 'completed', completedAt: new Date() });
    logger.info({ refundId: refund.id }, 'Refund completed via refund.updated');
    await AuditLog.create({
      actorUserId: ledger.userId,
      bookingId: ledger.bookingId,
      action: 'customer_refund_completed',
      payloadSummary: { refundId: refund.id, amount: refund.amount, currency: refund.currency },
      result: 'success',
    });
  } else {
    await ledger.updateOne({ customerRefundStatus: 'failed' });
    logger.warn({ refundId: refund.id }, 'Stripe refund failed — ledger marked for manual review');
    await AuditLog.create({
      actorUserId: ledger.userId,
      bookingId: ledger.bookingId,
      action: 'customer_refund_failed',
      payloadSummary: { refundId: refund.id, failureReason: refund.failure_reason },
      result: 'failure',
      error: refund.failure_reason ?? 'Stripe refund failed',
    });
  }
}

// ─── Payment failed ───────────────────────────────────────────────────────────

async function handlePaymentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  logger.info({ piId: pi.id }, 'Payment failed');

  await Booking.findOneAndUpdate(
    { stripePaymentIntentId: pi.id },
    {
      status: 'failed',
      failureReason: pi.last_payment_error?.message ?? 'Payment declined',
      failedAt: new Date(),
    },
  );
}
