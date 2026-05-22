import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PassengerRelationship = 'self' | 'spouse' | 'child' | 'parent' | 'colleague' | 'other';

export interface ISavedPassenger extends Document {
  userId: Types.ObjectId;
  title: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr';
  firstName: string;
  lastName: string;
  dob: Date;
  gender: 'm' | 'f';
  nationality: string;
  passportNumber?: string;        // AES-256-GCM encrypted at rest
  passportExpiry?: Date;
  passportIssuingCountry?: string;
  relationship?: PassengerRelationship;
  isSelf: boolean;
  deletedAt?: Date;               // soft delete — keeps past booking snapshots intact
  createdAt: Date;
  updatedAt: Date;
}

const savedPassengerSchema = new Schema<ISavedPassenger>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:       { type: String, enum: ['mr', 'ms', 'mrs', 'miss', 'dr'], required: true },
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    dob:         { type: Date, required: true },
    gender:      { type: String, enum: ['m', 'f'], required: true },
    nationality: { type: String, required: true },
    passportNumber:         { type: String },
    passportExpiry:         { type: Date },
    passportIssuingCountry: { type: String },
    relationship: {
      type: String,
      enum: ['self', 'spouse', 'child', 'parent', 'colleague', 'other'],
    },
    isSelf:    { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

// List active passengers for a user, newest first
savedPassengerSchema.index({ userId: 1, createdAt: -1 });

// Active-only lookups (excludes soft-deleted docs)
savedPassengerSchema.index(
  { userId: 1, deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: false } } },
);

savedPassengerSchema.set('toJSON', {
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r.__v;
    r.id = r._id;
    delete r._id;
    // Never serialise the raw ciphertext — caller must decrypt before sending to client
    delete r.passportNumber;
    return r;
  },
});

export const SavedPassenger: Model<ISavedPassenger> =
  mongoose.model<ISavedPassenger>('SavedPassenger', savedPassengerSchema);
