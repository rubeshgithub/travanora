import { Request, Response } from 'express';
import { UpdateProfileSchema, UpdatePreferencesSchema, ChangePasswordSchema } from '@travanora/shared';
import * as accountService from './account.service.js';
import { AppError } from '../../middleware/error.handler.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE = 'refreshToken';

function cookieOptions(expiry: Date) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    domain: env.COOKIE_DOMAIN,
    expires: expiry,
    path: '/',
  };
}

export async function getProfileHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return res.json(await accountService.getProfile(req.user.sub));
}

export async function updateProfileHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = UpdateProfileSchema.parse(req.body);
  return res.json(await accountService.updateProfile(req.user.sub, data));
}

export async function updatePreferencesHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = UpdatePreferencesSchema.parse(req.body);
  return res.json(await accountService.updatePreferences(req.user.sub, data));
}

export async function changePasswordHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);
  const result = await accountService.changePassword(req.user.sub, currentPassword, newPassword);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(result.refreshTokenExpiry));
  return res.json({ success: true, accessToken: result.accessToken });
}
