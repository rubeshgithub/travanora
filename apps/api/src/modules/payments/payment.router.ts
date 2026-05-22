import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.guard.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import { createIntentHandler } from './payment.controller.js';

// Note: the webhook route is mounted directly in app.ts (before express.json())
// because it needs the raw request body for Stripe signature verification.

const router: ExpressRouter = Router();

// POST /api/payments/create-intent
router.post('/create-intent', requireAuth, asyncHandler(createIntentHandler));

export default router;
