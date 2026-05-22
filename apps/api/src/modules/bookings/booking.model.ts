import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBookingPassenger {
  title: string;
  given_name: string;
  family_name: string;
  born_on: string;
  gender: string;
  email: string;
  phone_number: string;
}

export interface IBooking extends Document {
  userId: Types.ObjectId;
  duffelOrderId: string;
  bookingRef: string;
  offerId: string;
  totalAmount: number;
  savings: number;
  currency: string;
  status: 'confirmed' | 'cancelled';
  passengers: IBookingPassenger[];
  sliceSummary: {
    origin: string;
    destination: string;
    departureAt: string;
    arrivalAt: string;
    airlineName: string;
    airlineCode: string;
  }[];
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    duffelOrderId: { type: String, required: true, unique: true },
    bookingRef: { type: String, required: true, unique: true, index: true },
    offerId: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    savings: { type: Number, default: 0 },
    currency: { type: String, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    passengers: [
      {
        title: String,
        given_name: { type: String, required: true },
        family_name: { type: String, required: true },
        born_on: { type: String, required: true },
        gender: { type: String, required: true },
        email: { type: String, required: true },
        phone_number: { type: String, required: true },
      },
    ],
    sliceSummary: [
      {
        origin: String,
        destination: String,
        departureAt: String,
        arrivalAt: String,
        airlineName: String,
        airlineCode: String,
      },
    ],
  },
  { timestamps: true },
);

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
