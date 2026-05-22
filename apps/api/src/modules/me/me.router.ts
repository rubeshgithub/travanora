import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.guard.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import { meHandler } from '../auth/auth.controller.js';
import { listBookingsHandler, getBookingByRefHandler } from '../bookings/booking.controller.js';

const router: ExpressRouter = Router();

router.get('/', requireAuth, asyncHandler(meHandler));
router.get('/bookings', requireAuth, asyncHandler(listBookingsHandler));
router.get('/bookings/:bookingRef', requireAuth, asyncHandler(getBookingByRefHandler));

export default router;
