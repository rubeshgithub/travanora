import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.guard.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import {
  conditionsHandler,
  cancellationQuoteHandler,
  cancellationConfirmHandler,
  refundLedgerHandler,
  changeSearchHandler,
  changeConfirmHandler,
} from './trips.controller.js';

const router: ExpressRouter = Router();

// GET  /api/trips/:id/conditions
router.get('/:id/conditions', requireAuth, asyncHandler(conditionsHandler));

// POST /api/trips/:id/cancellation-quote
router.post('/:id/cancellation-quote', requireAuth, asyncHandler(cancellationQuoteHandler));

// POST /api/trips/:id/cancellation-confirm
router.post('/:id/cancellation-confirm', requireAuth, asyncHandler(cancellationConfirmHandler));

// GET  /api/trips/refunds/:bookingId
router.get('/refunds/:bookingId', requireAuth, asyncHandler(refundLedgerHandler));

// POST /api/trips/:id/change-search
router.post('/:id/change-search', requireAuth, asyncHandler(changeSearchHandler));

// POST /api/trips/:id/change-confirm
router.post('/:id/change-confirm', requireAuth, asyncHandler(changeConfirmHandler));

export default router;
