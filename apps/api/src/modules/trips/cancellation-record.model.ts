import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICancellationRecord extends Document {
  bookingId: Types.ObjectId;
  userId: Types.ObjectId;
  duffelCancellationId: string;
  airlineRefundAmount: number;
  airlineRefundCurrency: string;
  penaltyAmount: number;
  customerRefundAmount: number;
  quotedAt: Date;
  confirmedAt: Date;
  createdAt: Date;
}

const cancellationRecordSchema = new Schema<ICancellationRecord>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    duffelCancellationId: { type: String, required: true, unique: true },
    airlineRefundAmount: { type: Number, required: true },
    airlineRefundCurrency: { type: String, required: true },
    penaltyAmount: { type: Number, required: true, default: 0 },
    customerRefundAmount: { type: Number, required: true },
    quotedAt: { type: Date, required: true },
    confirmedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

cancellationRecordSchema.set('toJSON', {
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r.__v;
    r.id = r._id;
    delete r._id;
    return r;
  },
});

export const CancellationRecord: Model<ICancellationRecord> = mongoose.model<ICancellationRecord>(
  'CancellationRecord',
  cancellationRecordSchema,
);
