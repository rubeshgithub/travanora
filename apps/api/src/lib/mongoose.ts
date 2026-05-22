import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from './logger.js';

// Drop any non-sparse unique indexes on these fields so that multiple draft
// bookings (which leave these fields absent) can coexist without E11000 errors.
async function ensureSparseBookingIndexes(): Promise<void> {
  try {
    const col = mongoose.connection.collection('bookings');
    const indexes = await col.indexes();
    const sparseFields = ['duffelOrderId', 'bookingRef', 'stripePaymentIntentId'];
    for (const field of sparseFields) {
      const bad = indexes.find((idx) => idx.key[field] !== undefined && !idx.sparse);
      if (bad) {
        logger.warn({ field, name: bad.name }, 'Dropping non-sparse unique index; will be recreated as sparse');
        await col.dropIndex(bad.name as string);
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Index check skipped (collection may not exist yet)');
  }
}

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  await ensureSparseBookingIndexes();
}
