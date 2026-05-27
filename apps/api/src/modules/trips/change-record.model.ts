import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IChangeRecord extends Document {
  bookingId: Types.ObjectId;
  userId: Types.ObjectId;
  duffelOrderChangeId: string;
  changeTotalAmount: number;
  changeTotalCurrency: string;
  previousItinerary: Record<string, unknown>;
  newItinerary: Record<string, unknown>;
  extraPaymentIntentId?: string;
  confirmedAt: Date;
  createdAt: Date;
}

const changeRecordSchema = new Schema<IChangeRecord>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    duffelOrderChangeId: { type: String, required: true, unique: true },
    changeTotalAmount: { type: Number, required: true },
    changeTotalCurrency: { type: String, required: true },
    previousItinerary: { type: Schema.Types.Mixed, required: true },
    newItinerary: { type: Schema.Types.Mixed, required: true },
    extraPaymentIntentId: { type: String },
    confirmedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

changeRecordSchema.set('toJSON', {
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r.__v;
    r.id = r._id;
    delete r._id;
    return r;
  },
});

export const ChangeRecord: Model<IChangeRecord> = mongoose.model<IChangeRecord>(
  'ChangeRecord',
  changeRecordSchema,
);
