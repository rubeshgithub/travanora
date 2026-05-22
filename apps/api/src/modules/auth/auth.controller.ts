import { Request, Response } from 'express';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema } from '@travanora/shared';
import * as authService from './auth.service.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../middleware/error.handler.js';

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

export async function registerHandler(req: Request, res: Response) {
  const input = RegisterSchema.parse(req.body);
  const result = await authService.register(input);

  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(result.refreshTokenExpiry));

  return res.status(201).json({
    user: result.user,
    member: result.member,
    accessToken: result.accessToken,
  });
}

export async function loginHandler(req: Request, res: Response) {
  const input = LoginSchema.parse(req.body);
  const result = await authService.login(input);

  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(result.refreshTokenExpiry));

  return res.json({
    user: result.user,
    member: result.member,
    accessToken: result.accessToken,
  });
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies[REFRESH_COOKIE] as string | undefined;
  if (!token) throw new AppError(401, 'NO_REFRESH_TOKEN', 'No refresh token present');

  const { accessToken, newRefreshToken, expiry } = await authService.refresh(
    token,
    req.headers['user-agent'],
    req.ip,
  );

  res.cookie(REFRESH_COOKIE, newRefreshToken, cookieOptions(expiry));
  return res.json({ accessToken });
}

export async function logoutHandler(req: Request, res: Response) {
  const token = req.cookies[REFRESH_COOKIE] as string | undefined;
  if (token) {
    await authService.logout(token);
  }

  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/',
  });

  return res.json({ ok: true });
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const { email } = ForgotPasswordSchema.parse(req.body);
  // Phase 1 stub — real email sending in Phase 2
  logger.info({ email }, '[STUB] Forgot password requested');
  // Always return 200 to avoid leaking whether email exists
  return res.json({ ok: true, message: 'If that email exists, a reset link has been sent.' });
}

export async function meHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const result = await authService.getMe(req.user.sub);
  return res.json(result);
}
