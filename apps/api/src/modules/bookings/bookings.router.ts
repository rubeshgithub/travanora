import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.guard.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import { createDraftHandler, getBookingByIdHandler } from './booking.controller.js';

const router: ExpressRouter = Router();

// POST /api/bookings/draft — create a draft booking (passenger details captured, no payment yet)
router.post('/draft', requireAuth, asyncHandler(createDraftHandler));

// GET /api/bookings/:id — fetch booking by MongoDB ID (used throughout the booking flow)
router.get('/:id', requireAuth, asyncHandler(getBookingByIdHandler));

export default router;
