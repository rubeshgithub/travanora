import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.guard.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import { getDashboardHandler } from './dashboard.controller.js';

const router: ExpressRouter = Router();

router.get('/', requireAuth, asyncHandler(getDashboardHandler));

export default router;
