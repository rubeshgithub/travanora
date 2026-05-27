import { Types } from 'mongoose';
import { DuffelError } from '@duffel/api';
import { duffel } from '../../lib/duffel.js';
import { logger } from '../../lib/logger.js';
import { Booking } from '../bookings/booking.model.js';
import { CancellationRecord } from './cancellation-record.model.js';
import { ChangeRecord } from './change-record.model.js';
import { RefundLedger } from '../refunds/refund-ledger.model.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AppError } from '../../middleware/error.handler.js';
import { loadBookingForUser } from '../bookings/booking.service.js';
import { refundCustomer } from '../refunds/refund-customer.service.js';
import {
  sendCancellationConfirmedEmail,
  sendChangeConfirmedEmail,
} from '../emails/email.service.js';

// ─── Raw Duffel shape helpers (local — not exported) ─────────────────────────

interface DuffelSegmentRaw {
  id: string;
  departing_at: string;
  arriving_at: string;
  origin: { iata_code: string; name?: string };
  destination: { iata_code: string; name?: string };
  marketing_carrier?: { iata_code: string; name: string };
  marketing_carrier_flight_number?: string;
  operating_carrier?: { iata_code: string; name: string };
  operating_carrier_flight_number?: string;
  passengers?: Array<{ cabin_class?: string }>;
}

interface DuffelSliceRaw {
  id: string;
  origin: { iata_code: string; name?: string };
  destination: { iata_code: string; name?: string };
  duration?: string | null;
  segments: DuffelSegmentRaw[];
}

interface DuffelOrderRaw {
  available_actions?: string[];
  slices: DuffelSliceRaw[];
}

interface DuffelChangeOfferRaw {
  id: string;
  change_total_amount: string;
  change_total_currency: string;
  new_total_amount: string;
  expires_at: string | null;
  slices?: {
    add?: Array<{
      id: string;
      duration: string | null;
      origin: { iata_code: string };
      destination: { iata_code: string };
      segments: DuffelSegmentRaw[];
    }>;
  };
}

interface DuffelChangeRequestRaw {
  id: string;
  order_change_offers: DuffelChangeOfferRaw[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDurationMinutes(iso: string): number | undefined {
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return undefined;
  return (parseInt(m[1] ?? '0', 10) * 1440) +
         (parseInt(m[2] ?? '0', 10) * 60) +
         parseInt(m[3] ?? '0', 10);
}

function mapSegment(seg: DuffelSegmentRaw) {
  return {
    flightNumber: seg.marketing_carrier_flight_number ?? seg.operating_carrier_flight_number ?? '',
    airlineName:  seg.marketing_carrier?.name ?? seg.operating_carrier?.name ?? '',
    airlineCode:  seg.marketing_carrier?.iata_code ?? seg.operating_carrier?.iata_code ?? '',
    departureAt:  seg.departing_at,
    arrivalAt:    seg.arriving_at,
    origin:       seg.origin.iata_code,
    destination:  seg.destination.iata_code,
  };
}

function mapDuffelOrderSlices(order: DuffelOrderRaw) {
  return (order.slices ?? []).map((s) => {
    const segs = s.segments ?? [];
    return {
      origin:          s.origin.iata_code,
      originName:      s.origin.name,
      destination:     s.destination.iata_code,
      destinationName: s.destination.name,
      departureAt:     segs[0]?.departing_at ?? '',
      arrivalAt:       segs[segs.length - 1]?.arriving_at ?? '',
      durationMinutes: s.duration ? parseDurationMinutes(s.duration) : undefined,
      stops:           Math.max(0, segs.length - 1),
      segments:        segs.map(mapSegment),
    };
  });
}

// ─── Conditions ───────────────────────────────────────────────────────────────

export interface TripConditions {
  canCancel: boolean;
  canChange: boolean;
  refundCondition: {
    allowed: boolean;
    penaltyAmount: number | null;
    penaltyCurrency: string | null;
  } | null;
  changeCondition: {
    allowed: boolean;
    penaltyAmount: number | null;
    penaltyCurrency: string | null;
  } | null;
}

export async function getConditions(
  bookingId: string,
  userId: Types.ObjectId,
): Promise<TripConditions> {
  const booking = await loadBookingForUser(bookingId, userId);

  if (booking.status !== 'confirmed' && booking.status !== 'changed') {
    return { canCancel: false, canChange: false, refundCondition: null, changeCondition: null };
  }

  if (!booking.duffelOrderId) {
    logger.warn({ bookingId }, 'No duffelOrderId — cannot fetch conditions');
    return { canCancel: false, canChange: false, refundCondition: null, changeCondition: null };
  }

  const order = await duffel.orders.get(booking.duffelOrderId);
  const actions: string[] = (order.data as unknown as { available_actions?: string[] }).available_actions ?? [];
  const conditions = (order.data as unknown as {
    conditions?: {
      refund_before_departure?: { allowed: boolean; penalty_amount?: string | null; penalty_currency?: string | null };
      change_before_departure?: { allowed: boolean; penalty_amount?: string | null; penalty_currency?: string | null };
    };
  }).conditions ?? {};

  const parseCondition = (
    raw: { allowed: boolean; penalty_amount?: string | null; penalty_currency?: string | null } | undefined,
  ) => {
    if (!raw) return null;
    return {
      allowed: raw.allowed,
      penaltyAmount: raw.penalty_amount != null ? parseFloat(raw.penalty_amount) : null,
      penaltyCurrency: raw.penalty_currency ?? null,
    };
  };

  logger.info({ bookingId, actions }, 'Fetched order conditions from Duffel');

  return {
    canCancel: actions.includes('cancel'),
    canChange: actions.includes('change'),
    refundCondition: parseCondition(conditions.refund_before_departure),
    changeCondition: parseCondition(conditions.change_before_departure),
  };
}

// ─── Cancellation quote ───────────────────────────────────────────────────────

export interface CancellationQuote {
  cancellationId: string;
  refundAmount: number | null;
  refundCurrency: string | null;
  penalty: number;
  expiresAt: string | null;
  isRefundUnknown: boolean;
}

export async function quoteCancellation(
  bookingId: string,
  userId: Types.ObjectId,
): Promise<CancellationQuote> {
  const booking = await loadBookingForUser(bookingId, userId);

  if (booking.status !== 'confirmed' && booking.status !== 'changed') {
    throw new AppError(409, 'BOOKING_NOT_CANCELLABLE', `Booking cannot be cancelled (status: ${booking.status})`);
  }
  if (!booking.duffelOrderId) {
    throw new AppError(409, 'NO_DUFFEL_ORDER', 'Booking has no airline order on record');
  }

  // Verify cancel is in available_actions before calling Duffel
  const order = await duffel.orders.get(booking.duffelOrderId);
  const actions: string[] = (order.data as unknown as { available_actions?: string[] }).available_actions ?? [];
  if (!actions.includes('cancel')) {
    throw new AppError(422, 'CANCEL_NOT_ALLOWED', 'This booking cannot be cancelled online');
  }

  await AuditLog.create({
    actorUserId: userId,
    bookingId: booking._id,
    action: 'cancellation_quote',
    payloadSummary: { duffelOrderId: booking.duffelOrderId },
    result: 'success',
  });

  const quote = await duffel.orderCancellations.create({ order_id: booking.duffelOrderId });
  const { id, refund_amount, refund_currency, expires_at } = quote.data;

  const airlineRefundAmount = refund_amount != null ? parseFloat(refund_amount) : null;
  // penalty = what the airline keeps from the full public price
  const penalty = airlineRefundAmount != null
    ? Math.max(0, booking.publicPrice - airlineRefundAmount)
    : 0;

  logger.info({ bookingId, cancellationId: id, refund_amount }, 'Cancellation quote created');

  return {
    cancellationId: id,
    refundAmount: airlineRefundAmount != null
      ? computeCustomerRefund(booking.totalAmount, booking.publicPrice, airlineRefundAmount)
      : null,
    refundCurrency: refund_currency,
    penalty,
    expiresAt: expires_at ?? null,
    isRefundUnknown: refund_amount == null,
  };
}

// ─── Cancellation confirm ─────────────────────────────────────────────────────

export interface CancellationResult {
  status: 'cancelled';
  customerRefundAmount: number;
  customerRefundStatus: string;
  isManualRefund: boolean;
}

export async function confirmCancellation(
  bookingId: string,
  userId: Types.ObjectId,
): Promise<CancellationResult> {
  // Atomic status transition: confirmed/changed → cancelling (prevents double-submit)
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, userId, status: { $in: ['confirmed', 'changed'] } },
    { status: 'cancelling' },
    { new: false }, // return the old doc to capture previous status
  );

  if (!booking) {
    // Either not found, not owned, or already cancelling/cancelled
    const existing = await Booking.findOne({ _id: bookingId, userId });
    if (!existing) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    if (existing.status === 'cancelled') throw new AppError(409, 'ALREADY_CANCELLED', 'Booking is already cancelled');
    if (existing.status === 'cancelling') throw new AppError(409, 'CANCEL_IN_PROGRESS', 'Cancellation already in progress');
    throw new AppError(409, 'BOOKING_NOT_CANCELLABLE', `Booking cannot be cancelled (status: ${existing.status})`);
  }

  if (!booking.duffelOrderId) {
    // Revert — shouldn't happen but be safe
    await Booking.findByIdAndUpdate(bookingId, { status: booking.status });
    throw new AppError(409, 'NO_DUFFEL_ORDER', 'Booking has no airline order on record');
  }

  const previousStatus = booking.status;

  try {
    // Always create a FRESH quote immediately before confirming — never confirm a stale quote
    const freshQuote = await duffel.orderCancellations.create({ order_id: booking.duffelOrderId });
    const freshId = freshQuote.data.id;

    const confirmed = await duffel.orderCancellations.confirm(freshId);
    const { refund_amount, refund_currency } = confirmed.data;

    const airlineRefundAmount = refund_amount != null ? parseFloat(refund_amount) : 0;
    const airlineRefundCurrency = refund_currency ?? booking.currency;
    const customerRefundAmount = computeCustomerRefund(
      booking.totalAmount,
      booking.publicPrice,
      airlineRefundAmount,
    );
    const penaltyAmount = Math.max(0, booking.publicPrice - airlineRefundAmount);
    const quotedAt = new Date(freshQuote.data.created_at);
    const confirmedAt = new Date();

    // Persist state BEFORE calling Stripe — crash-safe
    await Booking.findByIdAndUpdate(bookingId, {
      status: 'cancelled',
      cancelledAt: confirmedAt,
    });

    await CancellationRecord.create({
      bookingId: booking._id,
      userId,
      duffelCancellationId: freshId,
      airlineRefundAmount,
      airlineRefundCurrency,
      penaltyAmount,
      customerRefundAmount,
      quotedAt,
      confirmedAt,
    });

    // Hop 1 complete (airline → our balance); create ledger row for hop 2
    const ledger = await RefundLedger.create({
      bookingId: booking._id,
      userId,
      reason: 'cancellation',
      airlineRefundAmount,
      airlineRefundCurrency,
      airlineRefundStatus: 'received',
      customerRefundAmount,
      customerRefundCurrency: airlineRefundCurrency,
      customerRefundStatus: 'pending',
      customerRefundProvider: refund_amount != null ? 'stripe' : 'manual',
    });

    await AuditLog.create({
      actorUserId: userId,
      bookingId: booking._id,
      action: 'cancellation_confirm',
      payloadSummary: {
        duffelCancellationId: freshId,
        airlineRefundAmount,
        customerRefundAmount,
        currency: airlineRefundCurrency,
      },
      result: 'success',
    });

    logger.info(
      { bookingId, duffelCancellationId: freshId, airlineRefundAmount, customerRefundAmount },
      'Cancellation confirmed — initiating customer refund',
    );

    // Hop 2: balance → customer (Stripe). Non-blocking — ledger tracks the result.
    const refundResult = await refundCustomer({
      booking,
      amount: customerRefundAmount,
      currency: airlineRefundCurrency,
      reason: 'cancellation',
      ledgerId: String(ledger._id),
    });

    logger.info({ bookingId, refundStatus: refundResult.status }, 'Customer refund initiated');

    const result: CancellationResult = {
      status: 'cancelled',
      customerRefundAmount,
      customerRefundStatus: refundResult.status,
      isManualRefund: refundResult.status === 'manual_required',
    };

    // Fire-and-forget confirmation email
    const recipient = booking.contactEmail ?? (booking.passengers[0] as { email?: string })?.email;
    if (recipient) {
      const outbound = booking.offerSnapshot?.slices?.[0];
      sendCancellationConfirmedEmail(recipient, {
        bookingRef:     booking.bookingRef ?? bookingId,
        passengerName:  (booking.passengers[0] as { firstName?: string })?.firstName ?? 'Valued Customer',
        origin:         outbound?.origin ?? '',
        destination:    outbound?.destination ?? '',
        departureAt:    outbound?.departureAt ?? '',
        airline:        booking.offerSnapshot?.airline,
        refundAmount:   customerRefundAmount,
        currency:       airlineRefundCurrency,
        isManualRefund: result.isManualRefund,
        bookingId:      bookingId,
      }).catch(() => undefined);
    }

    return result;

  } catch (err) {
    const isDuffelError = err instanceof DuffelError;

    // Revert booking status so the user can try again or get support
    await Booking.findByIdAndUpdate(bookingId, { status: previousStatus });

    await AuditLog.create({
      actorUserId: userId,
      bookingId: booking._id,
      action: 'cancellation_confirm',
      payloadSummary: { duffelOrderId: booking.duffelOrderId, isDuffelError },
      result: 'failure',
      error: (err as Error).message,
    });

    logger.error({ err, bookingId, isDuffelError }, 'Cancellation confirm failed — booking reverted');

    if (err instanceof AppError) throw err;

    const msg = isDuffelError
      ? ((err as InstanceType<typeof DuffelError>).errors[0]?.message ?? 'Cancellation failed')
      : 'Cancellation failed — please try again or contact support';
    throw new AppError(502, 'CANCELLATION_FAILED', msg);
  }
}

// ─── Customer refund amount (Option A) ────────────────────────────────────────
// penalty = what the airline keeps from the full public price
// customer absorbs the same penalty; Travanora keeps its discount margin regardless
//
// Example: publicPrice=100, totalPaid=90, airlineRefund=80 (KD20 penalty)
//   penalty=20, customerRefund=max(0, 90-20)=70 → Travanora breaks even
//
// Example: publicPrice=100, totalPaid=90, airlineRefund=100 (no penalty)
//   penalty=0, customerRefund=90 → Travanora keeps the KD10 margin

export function computeCustomerRefund(
  totalAmountPaid: number,
  publicPrice: number,
  airlineRefundAmount: number,
): number {
  const penalty = Math.max(0, publicPrice - airlineRefundAmount);
  return Math.max(0, Math.round((totalAmountPaid - penalty) * 1000) / 1000);
}

// ─── Refund ledger (for /api/refunds/:bookingId) ──────────────────────────────

export async function getRefundLedger(bookingId: string, userId: Types.ObjectId) {
  await loadBookingForUser(bookingId, userId);
  return RefundLedger.find({ bookingId: new Types.ObjectId(bookingId) }).sort({ createdAt: -1 });
}

// ─── Change search ────────────────────────────────────────────────────────────

export interface ChangeOfferSlice {
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes?: number;
  stops: number;
  segments: Array<{
    flightNumber: string;
    airlineName: string;
    airlineCode: string;
    departureAt: string;
    arrivalAt: string;
    origin: string;
    destination: string;
  }>;
}

export interface ChangeOffer {
  id: string;
  changeTotalAmount: number;
  changeTotalCurrency: string;
  newTotalAmount: number;
  expiresAt: string | null;
  slices: ChangeOfferSlice[];
}

export interface ChangeSearchResult {
  changeRequestId: string;
  sliceIndex: number;
  origin: string;
  destination: string;
  offers: ChangeOffer[];
}

export async function changeSearch(
  bookingId: string,
  userId: Types.ObjectId,
  body: { departureDate: string; sliceIndex?: number },
): Promise<ChangeSearchResult> {
  const booking = await loadBookingForUser(bookingId, userId);

  if (booking.status !== 'confirmed' && booking.status !== 'changed') {
    throw new AppError(409, 'BOOKING_NOT_CHANGEABLE', `Booking cannot be changed (status: ${booking.status})`);
  }
  if (!booking.duffelOrderId) {
    throw new AppError(409, 'NO_DUFFEL_ORDER', 'Booking has no airline order on record');
  }

  const orderResp = await duffel.orders.get(booking.duffelOrderId);
  const orderData = orderResp.data as unknown as DuffelOrderRaw;

  const actions: string[] = orderData.available_actions ?? [];
  if (!actions.includes('change')) {
    throw new AppError(422, 'CHANGE_NOT_ALLOWED', 'This booking cannot be changed online');
  }

  const sliceIndex = body.sliceIndex ?? 0;
  const targetSlice = orderData.slices[sliceIndex];
  if (!targetSlice) {
    throw new AppError(400, 'INVALID_SLICE_INDEX', `Slice ${sliceIndex} not found in booking`);
  }

  await AuditLog.create({
    actorUserId: userId,
    bookingId: booking._id,
    action: 'change_request',
    payloadSummary: { duffelOrderId: booking.duffelOrderId, departureDate: body.departureDate, sliceIndex },
    result: 'success',
  });

  const changeReqResp = await duffel.orderChangeRequests.create({
    order_id: booking.duffelOrderId,
    slices: {
      remove: [{ slice_id: targetSlice.id }],
      // cabin_class omitted — Duffel will return offers across all cabin classes
      add: [{
        departure_date: body.departureDate,
        origin: targetSlice.origin.iata_code,
        destination: targetSlice.destination.iata_code,
      }],
    },
  });

  const raw = changeReqResp.data as unknown as DuffelChangeRequestRaw;

  const offers: ChangeOffer[] = (raw.order_change_offers ?? []).map((offer) => {
    const addedSlice = offer.slices?.add?.[0];
    const segs = addedSlice?.segments ?? [];
    return {
      id: offer.id,
      changeTotalAmount: parseFloat(offer.change_total_amount ?? '0'),
      changeTotalCurrency: offer.change_total_currency ?? booking.currency,
      newTotalAmount: parseFloat(offer.new_total_amount ?? '0'),
      expiresAt: offer.expires_at ?? null,
      slices: addedSlice ? [{
        origin:          addedSlice.origin?.iata_code ?? '',
        destination:     addedSlice.destination?.iata_code ?? '',
        departureAt:     segs[0]?.departing_at ?? '',
        arrivalAt:       segs[segs.length - 1]?.arriving_at ?? '',
        durationMinutes: addedSlice.duration ? parseDurationMinutes(addedSlice.duration) : undefined,
        stops:           Math.max(0, segs.length - 1),
        segments:        segs.map(mapSegment),
      }] : [],
    };
  });

  logger.info({ bookingId, changeRequestId: raw.id, offerCount: offers.length }, 'Change search complete');

  return {
    changeRequestId: raw.id,
    sliceIndex,
    origin: targetSlice.origin.iata_code,
    destination: targetSlice.destination.iata_code,
    offers,
  };
}

// ─── Change confirm ───────────────────────────────────────────────────────────

export interface ChangeResult {
  status: 'changed';
  changeTotalAmount: number;
  currency: string;
  isRefund: boolean;
  customerRefundStatus?: string;
}

export async function confirmChange(
  bookingId: string,
  userId: Types.ObjectId,
  body: { offerId: string },
): Promise<ChangeResult> {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, userId, status: { $in: ['confirmed', 'changed'] } },
    { status: 'change_in_progress' },
    { new: false },
  );

  if (!booking) {
    const existing = await Booking.findOne({ _id: bookingId, userId });
    if (!existing) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    if (existing.status === 'change_in_progress') throw new AppError(409, 'CHANGE_IN_PROGRESS', 'A change is already in progress');
    throw new AppError(409, 'BOOKING_NOT_CHANGEABLE', `Booking cannot be changed (status: ${existing.status})`);
  }

  const previousStatus = booking.status;

  try {
    const orderChangeResp = await duffel.orderChanges.create({
      selected_order_change_offer: body.offerId,
    });
    const orderChangeId = orderChangeResp.data.id;
    const orderChangeData = orderChangeResp.data as unknown as {
      change_total_amount: string;
      change_total_currency: string;
    };

    const changeTotalAmount = parseFloat(orderChangeData.change_total_amount ?? '0');
    const changeTotalCurrency = orderChangeData.change_total_currency ?? booking.currency;

    // Confirm — pass balance payment only when there is an extra charge
    const confirmPayment = changeTotalAmount > 0
      ? { payment: { type: 'balance' as const, amount: String(changeTotalAmount), currency: changeTotalCurrency } }
      : {};
    await duffel.orderChanges.confirm(orderChangeId, confirmPayment);
    const confirmedAt = new Date();

    // Re-fetch order to get the updated slices
    const updatedOrderResp = await duffel.orders.get(booking.duffelOrderId!);
    const updatedOrder = updatedOrderResp.data as unknown as DuffelOrderRaw;
    const newSlices = mapDuffelOrderSlices(updatedOrder);

    await Booking.findByIdAndUpdate(bookingId, {
      status: 'changed',
      changedAt: confirmedAt,
      'offerSnapshot.slices': newSlices,
      sliceSummary: newSlices.map((s) => ({
        origin:      s.origin,
        destination: s.destination,
        departureAt: s.departureAt,
        arrivalAt:   s.arrivalAt,
        airlineName: booking.offerSnapshot?.airline ?? '',
        airlineCode: booking.offerSnapshot?.airlineCode ?? '',
      })),
    });

    await ChangeRecord.create({
      bookingId:          booking._id,
      userId,
      duffelOrderChangeId: orderChangeId,
      changeTotalAmount,
      changeTotalCurrency,
      previousItinerary:  booking.offerSnapshot?.slices ?? [],
      newItinerary:       newSlices,
      confirmedAt,
    });

    await AuditLog.create({
      actorUserId: userId,
      bookingId:   booking._id,
      action:      'change_confirm',
      payloadSummary: { orderChangeId, changeTotalAmount, currency: changeTotalCurrency },
      result: 'success',
    });

    let customerRefundStatus: string | undefined;
    const isRefund = changeTotalAmount < 0;

    if (isRefund) {
      const refundAmount = Math.abs(changeTotalAmount);
      const ledger = await RefundLedger.create({
        bookingId:              booking._id,
        userId,
        reason:                 'change_difference',
        airlineRefundAmount:    refundAmount,
        airlineRefundCurrency:  changeTotalCurrency,
        airlineRefundStatus:    'received',
        customerRefundAmount:   refundAmount,
        customerRefundCurrency: changeTotalCurrency,
        customerRefundStatus:   'pending',
        customerRefundProvider: 'stripe',
      });

      const result = await refundCustomer({
        booking,
        amount:   refundAmount,
        currency: changeTotalCurrency,
        reason:   'change_difference',
        ledgerId: String(ledger._id),
      });

      customerRefundStatus = result.status;
    }

    logger.info({ bookingId, orderChangeId, changeTotalAmount }, 'Flight change confirmed');

    // Fire-and-forget confirmation email
    const recipient = booking.contactEmail ?? (booking.passengers[0] as { email?: string })?.email;
    if (recipient) {
      sendChangeConfirmedEmail(recipient, {
        bookingRef:        booking.bookingRef ?? bookingId,
        passengerName:     (booking.passengers[0] as { firstName?: string })?.firstName ?? 'Valued Customer',
        newSlices:         newSlices.map((s) => ({
          origin:      s.origin,
          destination: s.destination,
          departureAt: s.departureAt,
          arrivalAt:   s.arrivalAt,
        })),
        airline:           booking.offerSnapshot?.airline,
        changeTotalAmount,
        currency:          changeTotalCurrency,
        isRefund,
        bookingId:         bookingId,
      }).catch(() => undefined);
    }

    return { status: 'changed', changeTotalAmount, currency: changeTotalCurrency, isRefund, customerRefundStatus };

  } catch (err) {
    await Booking.findByIdAndUpdate(bookingId, { status: previousStatus });

    await AuditLog.create({
      actorUserId: userId,
      bookingId:   booking._id,
      action:      'change_confirm',
      payloadSummary: { offerId: body.offerId },
      result: 'failure',
      error:  (err as Error).message,
    });

    logger.error({ err, bookingId }, 'Change confirm failed — booking reverted');

    if (err instanceof AppError) throw err;
    const isDuffelError = err instanceof DuffelError;
    const msg = isDuffelError
      ? ((err as InstanceType<typeof DuffelError>).errors[0]?.message ?? 'Change failed')
      : 'Change failed — please try again or contact support';
    throw new AppError(502, 'CHANGE_FAILED', msg);
  }
}
