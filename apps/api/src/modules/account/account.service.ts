import bcrypt from 'bcrypt';
import { User } from '../auth/user.model.js';
import { Member } from '../auth/member.model.js';
import { RefreshToken } from '../auth/refresh-token.model.js';
import { AppError } from '../../middleware/error.handler.js';
import { signAccessToken, signRefreshToken, getRefreshTokenExpiry, hashToken } from '../../lib/jwt.js';
import { sendPasswordChangedEmail } from '../emails/email.service.js';
import { logger } from '../../lib/logger.js';
import type { UpdateProfileInput, UpdatePreferencesInput } from '@travanora/shared';

const BCRYPT_ROUNDS = 12;

export async function getProfile(userId: string) {
  const [user, member] = await Promise.all([
    User.findById(userId),
    Member.findOne({ userId }),
  ]);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  if (!member) throw new AppError(500, 'MEMBER_NOT_FOUND', 'Member profile missing');
  return { user: user.toJSON(), member: member.toJSON() };
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const $set: Record<string, unknown> = {};
  if (data.firstName  !== undefined) $set.firstName  = data.firstName;
  if (data.lastName   !== undefined) $set.lastName   = data.lastName;
  if (data.dob        !== undefined) $set.dob        = new Date(data.dob);
  if (data.nationality !== undefined) $set.nationality = data.nationality;
  if (data.phone      !== undefined) $set.phone      = data.phone;
  if (data.city       !== undefined) $set.city       = data.city;

  if (Object.keys($set).length === 0) return getProfile(userId);

  const user = await User.findByIdAndUpdate(userId, { $set }, { new: true, runValidators: true });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  return { user: user.toJSON() };
}

export async function updatePreferences(userId: string, data: UpdatePreferencesInput) {
  const $set: Record<string, unknown> = {};
  if (data.homeAirport     !== undefined) $set.homeAirport     = data.homeAirport;
  if (data.preferredCabin  !== undefined) $set.preferredCabin  = data.preferredCabin;
  if (data.travelFrequency !== undefined) $set.travelFrequency = data.travelFrequency;
  if (data.travelPurpose   !== undefined) $set.travelPurpose   = data.travelPurpose;

  const member = await Member.findOneAndUpdate({ userId }, { $set }, { new: true, runValidators: true });
  if (!member) throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member profile not found');
  return { member: member.toJSON() };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ accessToken: string; refreshToken: string; refreshTokenExpiry: Date }> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(400, 'WRONG_PASSWORD', 'Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await User.findByIdAndUpdate(userId, { passwordHash: newHash });

  // Revoke all active refresh tokens — forces sign-in on other devices
  await RefreshToken.updateMany({ userId, revokedAt: { $exists: false } }, { revokedAt: new Date() });

  // Issue fresh tokens for the current session
  const member = await Member.findOne({ userId });
  const accessToken = signAccessToken({
    sub: userId,
    email: user.email,
    tier: member?.tier ?? 'free',
  });
  const rawRefreshToken = signRefreshToken(userId, false);
  const expiry = getRefreshTokenExpiry(false);
  await RefreshToken.create({ userId, tokenHash: hashToken(rawRefreshToken), expiresAt: expiry });

  sendPasswordChangedEmail(user.email, user.firstName).catch((err) =>
    logger.error({ err, userId }, 'Password changed email failed (non-fatal)'),
  );

  return { accessToken, refreshToken: rawRefreshToken, refreshTokenExpiry: expiry };
}
