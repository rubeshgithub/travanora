import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  tier: string;
  isAdmin: boolean;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(userId: string, rememberMe: boolean): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: (rememberMe ? env.JWT_REFRESH_TTL_REMEMBER_ME : env.JWT_REFRESH_TTL) as jwt.SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiry(rememberMe: boolean): Date {
  const now = Date.now();
  const days = rememberMe ? 30 : 7;
  return new Date(now + days * 24 * 60 * 60 * 1000);
}
