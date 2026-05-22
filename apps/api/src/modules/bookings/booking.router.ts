import { Router, type Router as ExpressRouter } from 'express';
import { optionalAuth, requireAuth } from '../../middleware/auth.guard.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import { getOfferHandler, createOrderHandler } from './booking.controller.js';

const router: ExpressRouter = Router();

router.get('/offers/:offerId', optionalAuth, asyncHandler(getOfferHandler));
router.post('/orders', requireAuth, asyncHandler(createOrderHandler));

export default router;
