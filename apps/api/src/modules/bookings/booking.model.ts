import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ─── Status ───────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'failed'
  | 'cancelled'
  | 'cancelling'
  | 'change_in_progress'
  | 'changed'
  | 'payment_succeeded_booking_failed';

// ─── Passenger ────────────────────────────────────────────────────────────────
// Phase 2 uses camelCase. Phase 1 docs stored snake_case — the schema is Mixed
// so both shapes are accepted. Access Phase 1 fields via type assertion if needed.

export interface IBookingPassenger {
  type?: 'adult' | 'child' | 'infant_without_seat';
  title: string;
  firstName?: string;
  lastName?: string;
  dob?: Date;
  gender: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: Date;
  passportIssuingCountry?: string;
  email: string;
  phone?: { countryCode: string; number: string };
}

// ─── Offer snapshot ───────────────────────────────────────────────────────────

export interface IOfferSnapshot {
  slices: Array<{
    origin: string;
    originName?: string;
    destination: string;
    destinationName?: string;
    departureAt: string;
    arrivalAt: string;
    durationMinutes?: number;
    stops?: number;
    segments?: Array<{
      flightNumber: string;
      airlineName: string;
      airlineCode: string;
      departureAt: string;
      arrivalAt: string;
      origin: string;
      destination: string;
    }>;
  }>;
  airline: string;
  airlineCode: string;
  cabinClass: string;
}

// ─── Main interface ───────────────────────────────────────────────────────────

export interface IBooking extends Document {
  userId: Types.ObjectId;
  status: BookingStatus;

  // Duffel
  duffelOfferId?: string;
  duffelOrderId?: string;
  duffelOfferExpiresAt?: Date;
  pnr?: string;
  bookingRef?: string;

  // Offer data
  offerSnapshot?: IOfferSnapshot;
  // Phase 1 compat — sliceSummary kept so existing /api/me/bookings still serialises
  sliceSummary?: Array<{
    origin: string;
    destination: string;
    departureAt: string;
    arrivalAt: string;
    airlineName: string;
    airlineCode: string;
  }>;

  // Passengers (Mixed — see note above)
  passengers: IBookingPassenger[];
  contactEmail?: string;
  contactPhone?: string;

  // Pricing
  publicPrice: number;
  memberDiscount: number;
  totalAmount: number;
  currency: string;
  discountPercent: number;
  savings?: number; // Phase 1 compat alias for memberDiscount

  // Phase 1 compat
  offerId?: string;

  // Stripe
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  paidAt?: Date;

  // Confirmation
  confirmedAt?: Date;
  confirmationEmailSentAt?: Date;

  // Failure
  failureReason?: string;
  failedAt?: Date;

  // Cancellation / change (set when those flows complete)
  cancelledAt?: Date;
  changedAt?: Date;
  refundRequiredAt?: Date;   // set by Phase 2 on payment_succeeded_booking_failed; consumed by RefundLedger

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

// strict:false allows both Phase 1 (snake_case) and Phase 2 (camelCase) passenger shapes
const passengerSchema = new Schema({}, { strict: false, _id: false });

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: ['draft', 'pending_payment', 'paid', 'confirmed', 'failed', 'cancelled', 'cancelling', 'change_in_progress', 'changed', 'payment_succeeded_booking_failed'],
      default: 'draft',
      index: true,
    },

    // Duffel — sparse so drafts (no orderId yet) don't conflict
    duffelOfferId: { type: String },
    duffelOrderId: { type: String, unique: true, sparse: true },
    duffelOfferExpiresAt: { type: Date },
    pnr: { type: String },
    bookingRef: { type: String, unique: true, sparse: true, index: true },

    // Offer snapshot (Mixed for flexibility across phases)
    offerSnapshot: { type: Schema.Types.Mixed },
    sliceSummary: { type: [Schema.Types.Mixed] },

    // Passengers — strict:false subdoc accepts Phase 1 (snake_case) + Phase 2 (camelCase)
    passengers: { type: [passengerSchema], default: [] },
    contactEmail: { type: String },
    contactPhone: { type: String },

    // Pricing
    publicPrice: { type: Number, default: 0 },
    memberDiscount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'KWD' },
    discountPercent: { type: Number, default: 0 },
    savings: { type: Number, default: 0 }, // Phase 1 compat

    // Phase 1 compat
    offerId: { type: String },

    // Stripe
    stripePaymentIntentId: { type: String, unique: true, sparse: true },
    stripeChargeId: { type: String },
    paidAt: { type: Date },

    // Confirmation
    confirmedAt: { type: Date },
    confirmationEmailSentAt: { type: Date },

    // Failure
    failureReason: { type: String },
    failedAt: { type: Date },

    // Cancellation / change
    cancelledAt: { type: Date },
    changedAt: { type: Date },
    refundRequiredAt: { type: Date },
  },
  { timestamps: true },
);

// Compound indexes for common queries
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });

bookingSchema.set('toJSON', {
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r.__v;
    r.id = r._id;
    delete r._id;
    return r;
  },
});

export const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);
