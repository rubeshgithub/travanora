import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AuditAction =
  | 'cancellation_quote'
  | 'cancellation_confirm'
  | 'change_request'
  | 'change_confirm'
  | 'customer_refund_initiated'
  | 'customer_refund_completed'
  | 'customer_refund_failed'
  | 'change_payment_collected';

export interface IAuditLog extends Document {
  actorUserId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  action: AuditAction;
  payloadSummary: Record<string, unknown>;
  result: 'success' | 'failure';
  error?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    action: {
      type: String,
      enum: [
        'cancellation_quote',
        'cancellation_confirm',
        'change_request',
        'change_confirm',
        'customer_refund_initiated',
        'customer_refund_completed',
        'customer_refund_failed',
        'change_payment_collected',
      ],
      required: true,
      index: true,
    },
    payloadSummary: { type: Schema.Types.Mixed, required: true },
    result: { type: String, enum: ['success', 'failure'], required: true },
    error: { type: String },
  },
  {
    timestamps: true,
    // Audit logs are immutable — no updates allowed
  },
);

auditLogSchema.index({ bookingId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

auditLogSchema.set('toJSON', {
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r.__v;
    r.id = r._id;
    delete r._id;
    return r;
  },
});

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
