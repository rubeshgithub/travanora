import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type RefundReason = 'cancellation' | 'change_difference' | 'booking_failed';
export type AirlineRefundStatus = 'pending' | 'received' | 'not_applicable';
export type CustomerRefundStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'manual_required';

export interface IRefundLedger extends Document {
  bookingId: Types.ObjectId;
  userId: Types.ObjectId;
  reason: RefundReason;
  // Hop 1: airline → our balance
  airlineRefundAmount: number;
  airlineRefundCurrency: string;
  airlineRefundStatus: AirlineRefundStatus;
  // Hop 2: our balance → customer
  customerRefundAmount: number;
  customerRefundCurrency: string;
  customerRefundStatus: CustomerRefundStatus;
  customerRefundProvider: 'stripe' | 'manual';
  customerRefundReference?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const refundLedgerSchema = new Schema<IRefundLedger>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: {
      type: String,
      enum: ['cancellation', 'change_difference', 'booking_failed'],
      required: true,
    },
    airlineRefundAmount: { type: Number, required: true },
    airlineRefundCurrency: { type: String, required: true },
    airlineRefundStatus: {
      type: String,
      enum: ['pending', 'received', 'not_applicable'],
      default: 'pending',
    },
    customerRefundAmount: { type: Number, required: true },
    customerRefundCurrency: { type: String, required: true },
    customerRefundStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'manual_required'],
      default: 'pending',
      index: true,
    },
    customerRefundProvider: {
      type: String,
      enum: ['stripe', 'manual'],
      required: true,
    },
    customerRefundReference: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

// Ops queue: find all refunds that need manual attention or are still pending
refundLedgerSchema.index({ customerRefundStatus: 1, createdAt: -1 });

refundLedgerSchema.set('toJSON', {
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r.__v;
    r.id = r._id;
    delete r._id;
    return r;
  },
});

export const RefundLedger: Model<IRefundLedger> = mongoose.model<IRefundLedger>(
  'RefundLedger',
  refundLedgerSchema,
);
