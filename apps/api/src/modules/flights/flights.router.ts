import { Router, type Router as ExpressRouter } from 'express';
import { optionalAuth } from '../../middleware/auth.guard.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import { flightSearchLimiter } from '../../middleware/rate-limiter.js';
import { searchFlightsHandler } from './flights.controller.js';

const router: ExpressRouter = Router();

router.post('/search', flightSearchLimiter, optionalAuth, asyncHandler(searchFlightsHandler));

export default router;
