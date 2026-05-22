import mongoose, { Schema, Document, Model } from 'mongoose';

// Stores processed Stripe webhook event IDs to guarantee idempotency.
// TTL of 7 days — Stripe retries within that window.

export interface IWebhookEvent extends Document {
  eventId: string;
  processedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>({
  eventId: { type: String, required: true, unique: true },
  processedAt: { type: Date, required: true, default: Date.now },
});

// Auto-delete after 7 days
webhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export const WebhookEvent: Model<IWebhookEvent> = mongoose.model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
