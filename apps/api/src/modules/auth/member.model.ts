import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type MemberTier = 'free' | 'gold' | 'platinum' | 'corporate';
export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';
export type TravelFrequency = 'occasional' | 'frequent' | 'very_frequent' | 'road_warrior';
export type TravelPurpose = 'business' | 'leisure' | 'mixed';

export interface IMember extends Document {
  userId: Types.ObjectId;
  tier: MemberTier;
  discountPercent: number;
  homeAirport: string;
  preferredCabin?: CabinClass;
  travelFrequency?: TravelFrequency;
  travelPurpose?: TravelPurpose;
  joinedAt: Date;
  upgradedAt?: Date;
}

const memberSchema = new Schema<IMember>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  tier: {
    type: String,
    enum: ['free', 'gold', 'platinum', 'corporate'],
    default: 'free',
  },
  discountPercent: { type: Number, default: 10 },
  homeAirport: { type: String, default: 'KWI', uppercase: true },
  preferredCabin: {
    type: String,
    enum: ['economy', 'premium_economy', 'business', 'first'],
  },
  travelFrequency: {
    type: String,
    enum: ['occasional', 'frequent', 'very_frequent', 'road_warrior'],
  },
  travelPurpose: {
    type: String,
    enum: ['business', 'leisure', 'mixed'],
  },
  joinedAt: { type: Date, default: Date.now },
  upgradedAt: { type: Date },
});

memberSchema.set('toJSON', {
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r.__v;
    r.id = r._id;
    delete r._id;
    return r;
  },
});

export const Member: Model<IMember> = mongoose.model<IMember>('Member', memberSchema);
