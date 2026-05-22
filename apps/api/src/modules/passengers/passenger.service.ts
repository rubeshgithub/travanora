import { Types } from 'mongoose';
import { SavedPassenger, type ISavedPassenger } from './saved-passenger.model.js';
import { AppError } from '../../middleware/error.handler.js';
import { encryptField, decryptField } from '../../lib/crypto.js';
import { logger } from '../../lib/logger.js';
import type { SavedPassengerInput } from '@travanora/shared';

const MAX_PASSENGERS = 10;

// toJSON strips passportNumber (raw ciphertext). Re-add it decrypted.
function serialize(doc: ISavedPassenger): Record<string, unknown> {
  const rawPassport = doc.passportNumber;
  const obj = doc.toJSON() as Record<string, unknown>;
  if (rawPassport) {
    try {
      obj.passportNumber = decryptField(rawPassport);
    } catch (err) {
      logger.error({ err, id: String(doc._id) }, 'Passport decryption failed — omitting field');
    }
  }
  return obj;
}

async function loadPassengerForUser(userId: string, id: string): Promise<ISavedPassenger> {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'NOT_FOUND', 'Passenger not found');
  const doc = await SavedPassenger.findOne({ _id: id, userId, deletedAt: { $exists: false } });
  if (!doc) throw new AppError(404, 'NOT_FOUND', 'Passenger not found');
  return doc;
}

export async function listPassengers(userId: string): Promise<Record<string, unknown>[]> {
  const docs = await SavedPassenger.find({ userId, deletedAt: { $exists: false } }).sort({ createdAt: -1 });
  return docs.map(serialize);
}

export async function createPassenger(userId: string, data: SavedPassengerInput): Promise<Record<string, unknown>> {
  const activeCount = await SavedPassenger.countDocuments({ userId, deletedAt: { $exists: false } });
  if (activeCount >= MAX_PASSENGERS) {
    throw new AppError(422, 'PASSENGER_LIMIT', `You can save up to ${MAX_PASSENGERS} passengers`);
  }

  const doc = await SavedPassenger.create({
    userId,
    title:       data.title,
    firstName:   data.firstName,
    lastName:    data.lastName,
    dob:         new Date(data.dob),
    gender:      data.gender,
    nationality: data.nationality,
    passportNumber:         data.passportNumber ? encryptField(data.passportNumber) : undefined,
    passportExpiry:         data.passportExpiry ? new Date(data.passportExpiry) : undefined,
    passportIssuingCountry: data.passportIssuingCountry,
    relationship: data.relationship,
  });

  return serialize(doc);
}

export async function updatePassenger(
  userId: string,
  id: string,
  data: Partial<SavedPassengerInput>,
): Promise<Record<string, unknown>> {
  await loadPassengerForUser(userId, id); // ownership check

  const $set: Record<string, unknown> = {};
  if (data.title       !== undefined) $set.title       = data.title;
  if (data.firstName   !== undefined) $set.firstName   = data.firstName;
  if (data.lastName    !== undefined) $set.lastName    = data.lastName;
  if (data.dob         !== undefined) $set.dob         = new Date(data.dob);
  if (data.gender      !== undefined) $set.gender      = data.gender;
  if (data.nationality !== undefined) $set.nationality = data.nationality;
  if (data.relationship !== undefined) $set.relationship = data.relationship;
  if (data.passportNumber         !== undefined) $set.passportNumber         = encryptField(data.passportNumber);
  if (data.passportExpiry         !== undefined) $set.passportExpiry         = new Date(data.passportExpiry);
  if (data.passportIssuingCountry !== undefined) $set.passportIssuingCountry = data.passportIssuingCountry;

  const updated = await SavedPassenger.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true });
  if (!updated) throw new AppError(404, 'NOT_FOUND', 'Passenger not found');
  return serialize(updated);
}

export async function deletePassenger(userId: string, id: string): Promise<void> {
  await loadPassengerForUser(userId, id); // ownership check
  await SavedPassenger.findByIdAndUpdate(id, { deletedAt: new Date() });
}
