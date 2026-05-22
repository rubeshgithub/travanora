import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailLog extends Document {
  recipient: string;
  template: string;
  sentAt: Date;
  sesMessageId?: string;
  error?: string;
  bookingId?: string;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    recipient: { type: String, required: true, index: true },
    template: { type: String, required: true },
    sentAt: { type: Date, required: true },
    sesMessageId: { type: String },
    error: { type: String },
    bookingId: { type: String, index: true },
  },
  { timestamps: false },
);

emailLogSchema.set('toJSON', {
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r.__v;
    r.id = r._id;
    delete r._id;
    return r;
  },
});

export const EmailLog: Model<IEmailLog> = mongoose.model<IEmailLog>('EmailLog', emailLogSchema);
