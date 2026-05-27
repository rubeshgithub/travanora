import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  dob?: Date;
  nationality?: string;
  phone: { countryCode: string; number: string };
  city: string;
  emailVerified: boolean;
  isAdmin: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  marketingOptIn: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dob: { type: Date },
    nationality: { type: String },
    phone: {
      countryCode: { type: String, required: true },
      number: { type: String, required: true },
    },
    city: { type: String, default: 'Kuwait City', trim: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    marketingOptIn: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

// Never return passwordHash in JSON responses
userSchema.set('toJSON', {
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r.passwordHash;
    delete r.__v;
    r.id = r._id;
    delete r._id;
    return r;
  },
});

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
