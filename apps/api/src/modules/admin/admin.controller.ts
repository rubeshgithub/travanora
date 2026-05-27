import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { RefundLedger } from '../refunds/refund-ledger.model.js';
import { Booking } from '../bookings/booking.model.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AppError } from '../../middleware/error.handler.js';

export async function listPendingRefundsHandler(_req: Request, res: Response) {
  const ledgers = await RefundLedger.find({
    customerRefundStatus: { $in: ['manual_required', 'pending', 'failed'] },
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const bookingIds = ledgers.map((l) => l.bookingId);
  const bookings = await Booking.find({ _id: { $in: bookingIds } })
    .select('bookingRef passengers contactEmail')
    .lean();
  const bookingMap = new Map(bookings.map((b) => [String(b._id), b]));

  const result = ledgers.map((l) => {
    const b = bookingMap.get(String(l.bookingId));
    const p0 = b?.passengers?.[0] as { firstName?: string; lastName?: string } | undefined;
    return {
      ...l,
      id: l._id,
      bookingRef: b?.bookingRef,
      passengerName: p0 ? `${p0.firstName ?? ''} ${p0.lastName ?? ''}`.trim() : undefined,
      contactEmail: b?.contactEmail,
    };
  });

  return res.json(result);
}

export async function resolveRefundHandler(req: Request, res: Response) {
  const { ledgerId } = req.params as { ledgerId: string };
  const { status, reference, note } = req.body as {
    status: 'completed' | 'failed';
    reference?: string;
    note?: string;
  };

  if (status !== 'completed' && status !== 'failed') {
    throw new AppError(400, 'INVALID_STATUS', 'status must be "completed" or "failed"');
  }

  const ledger = await RefundLedger.findById(ledgerId);
  if (!ledger) throw new AppError(404, 'NOT_FOUND', 'Refund ledger entry not found');

  await RefundLedger.findByIdAndUpdate(ledgerId, {
    customerRefundStatus: status,
    ...(reference ? { customerRefundReference: reference } : {}),
    ...(status === 'completed' ? { completedAt: new Date() } : {}),
  });

  await AuditLog.create({
    actorUserId: new Types.ObjectId(req.user!.sub),
    bookingId: ledger.bookingId,
    action: 'admin_refund_resolve',
    payloadSummary: { ledgerId, status, reference, note },
    result: 'success',
  });

  return res.json({ ok: true });
}
