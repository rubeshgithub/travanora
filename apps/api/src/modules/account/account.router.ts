import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.guard.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import { changePasswordLimiter, writeLimiter } from '../../middleware/rate-limiter.js';
import * as controller from './account.controller.js';

const router: ExpressRouter = Router();

router.get('/',                requireAuth, asyncHandler(controller.getProfileHandler));
router.patch('/',              requireAuth, writeLimiter, asyncHandler(controller.updateProfileHandler));
router.patch('/preferences',   requireAuth, writeLimiter, asyncHandler(controller.updatePreferencesHandler));
router.post('/change-password', requireAuth, changePasswordLimiter, asyncHandler(controller.changePasswordHandler));

export default router;
