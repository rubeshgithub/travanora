import { Router, type Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../middleware/error.handler.js';
import { authLimiter } from '../../middleware/rate-limiter.js';
import * as controller from './auth.controller.js';

const router: ExpressRouter = Router();

router.post('/register', asyncHandler(controller.registerHandler));
router.post('/login', authLimiter, asyncHandler(controller.loginHandler));
router.post('/refresh', asyncHandler(controller.refreshHandler));
router.post('/logout', asyncHandler(controller.logoutHandler));
router.post('/forgot-password', asyncHandler(controller.forgotPasswordHandler));

export default router;
