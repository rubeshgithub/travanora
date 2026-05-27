import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt.js';
import { AppError } from './error.handler.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(new AppError(401, 'TOKEN_INVALID', 'Access token is invalid or expired'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return next(new AppError(403, 'FORBIDDEN', 'Admin access required'));
  }
  return next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  // Token was sent — if it's invalid, propagate 401 so the client can refresh
  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(new AppError(401, 'TOKEN_INVALID', 'Access token is invalid or expired'));
  }
}
