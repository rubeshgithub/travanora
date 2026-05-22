import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.guard.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import { getMemberHandler } from './members.controller.js';

const router: ExpressRouter = Router();

router.get('/', requireAuth, asyncHandler(getMemberHandler));

export default router;
