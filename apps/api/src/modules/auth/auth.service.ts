import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User } from './user.model.js';
import { Member } from './member.model.js';
import { RefreshToken } from './refresh-token.model.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from '../../lib/jwt.js';
import { AppError } from '../../middleware/error.handler.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from '../emails/email.service.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import type { RegisterInput, LoginInput } from '@travanora/shared';
import type { Types } from 'mongoose';

const BCRYPT_ROUNDS = 12;

export interface AuthResult {
  user: Record<string, unknown>;
  member: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiry: Date;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with that email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    dob: input.dob ? new Date(input.dob) : undefined,
    nationality: input.nationality,
    phone: input.phone,
    city: input.city,
    marketingOptIn: input.marketingOptIn,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  });

  const member = await Member.create({
    userId: user._id,
    homeAirport: input.homeAirport,
    preferredCabin: input.preferredCabin,
    travelFrequency: input.travelFrequency,
    travelPurpose: input.travelPurpose,
  });

  const verificationUrl = `${env.APP_URL}/verify-email?token=${verificationToken}`;
  sendVerificationEmail(input.email, input.firstName, verificationUrl).catch((err) =>
    logger.error({ err, email: input.email }, 'Registration verification email failed (non-fatal)'),
  );

  return issueTokens(user._id as Types.ObjectId, user.toJSON() as Record<string, unknown>, member.toJSON() as Record<string, unknown>, false);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  // Constant-time comparison even on not-found to prevent timing attacks
  const dummyHash = '$2b$12$invalidhashpaddingtomaintaintime';
  const passwordHash = user?.passwordHash ?? dummyHash;
  const valid = await bcrypt.compare(input.password, passwordHash);

  if (!user || !valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }

  const member = await Member.findOne({ userId: user._id });
  if (!member) {
    throw new AppError(500, 'MEMBER_NOT_FOUND', 'Member profile is missing — contact support');
  }

  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  return issueTokens(
    user._id as Types.ObjectId,
    user.toJSON() as Record<string, unknown>,
    member.toJSON() as Record<string, unknown>,
    input.rememberMe,
  );
}

export async function refresh(
  rawRefreshToken: string,
  userAgent?: string,
  ip?: string,
): Promise<{ accessToken: string; newRefreshToken: string; expiry: Date }> {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AppError(401, 'TOKEN_INVALID', 'Refresh token is invalid or expired');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await RefreshToken.findOne({ tokenHash, revokedAt: { $exists: false } });

  if (!stored || stored.expiresAt < new Date()) {
    // If token was already used, revoke all tokens for this user (token reuse attack)
    if (!stored) {
      await RefreshToken.updateMany(
        { userId: payload.sub, revokedAt: { $exists: false } },
        { revokedAt: new Date() },
      );
    }
    throw new AppError(401, 'TOKEN_REUSED', 'Refresh token has already been used');
  }

  // Revoke the used token
  await RefreshToken.findByIdAndUpdate(stored._id, { revokedAt: new Date() });

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, 'USER_NOT_FOUND', 'User no longer exists');

  const member = await Member.findOne({ userId: user._id });
  if (!member) throw new AppError(500, 'MEMBER_NOT_FOUND', 'Member profile missing');

  const rememberMe = stored.expiresAt.getTime() - Date.now() > 7 * 24 * 60 * 60 * 1000;

  const newRefreshToken = signRefreshToken(user.id as string, rememberMe);
  const expiry = getRefreshTokenExpiry(rememberMe);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: expiry,
    userAgent,
    ip,
  });

  const accessToken = signAccessToken({
    sub: user.id as string,
    email: user.email,
    tier: member.tier,
    isAdmin: user.isAdmin ?? false,
  });

  return { accessToken, newRefreshToken, expiry };
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.findOneAndUpdate({ tokenHash }, { revokedAt: new Date() });
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

  const member = await Member.findOne({ userId: user._id });
  if (!member) throw new AppError(500, 'MEMBER_NOT_FOUND', 'Member profile missing');

  return { user: user.toJSON(), member: member.toJSON() };
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return; // don't leak whether the email exists

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await User.findByIdAndUpdate(user._id, {
    passwordResetToken: resetToken,
    passwordResetExpires: resetExpires,
  });

  const resetUrl = `${env.APP_URL}/reset-password?token=${resetToken}`;
  sendPasswordResetEmail(user.email, user.firstName, resetUrl).catch((err) =>
    logger.error({ err, email }, 'Password reset email failed (non-fatal)'),
  );
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError(400, 'INVALID_TOKEN', 'Reset link is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await User.findByIdAndUpdate(user._id, {
    passwordHash,
    $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
  });

  // Revoke all existing refresh tokens so old sessions can't continue
  await RefreshToken.updateMany({ userId: user._id, revokedAt: { $exists: false } }, { revokedAt: new Date() });

  sendPasswordChangedEmail(user.email, user.firstName).catch((err) =>
    logger.error({ err, email: user.email }, 'Password changed email failed (non-fatal)'),
  );
}

export async function verifyEmail(token: string): Promise<void> {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new AppError(400, 'INVALID_TOKEN', 'Verification link is invalid or has expired');
  }

  await User.findByIdAndUpdate(user._id, {
    emailVerified: true,
    $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
  });
}

async function issueTokens(
  userId: Types.ObjectId,
  user: Record<string, unknown>,
  member: Record<string, unknown>,
  rememberMe: boolean,
): Promise<AuthResult> {
  const accessToken = signAccessToken({
    sub: userId.toString(),
    email: user['email'] as string,
    tier: (member['tier'] as string) ?? 'free',
    isAdmin: (user['isAdmin'] as boolean) ?? false,
  });

  const rawRefreshToken = signRefreshToken(userId.toString(), rememberMe);
  const expiry = getRefreshTokenExpiry(rememberMe);

  await RefreshToken.create({
    userId,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt: expiry,
  });

  return { user, member, accessToken, refreshToken: rawRefreshToken, refreshTokenExpiry: expiry };
}
