import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many attempts. Please try again in 15 minutes.',
    },
  },
  skipSuccessfulRequests: true,
});

// 5 change-password attempts per 15 min, keyed by authenticated user ID
export const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as { user?: { sub: string } }).user?.sub ?? req.ip ?? 'unknown',
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many password change attempts. Please try again in 15 minutes.',
    },
  },
  skipSuccessfulRequests: true,
});

// 30 writes per min for profile/passenger mutations
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down.',
    },
  },
});

export const flightSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many search requests. Please slow down.',
    },
  },
});
