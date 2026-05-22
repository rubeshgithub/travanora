import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.guard.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import { writeLimiter } from '../../middleware/rate-limiter.js';
import * as controller from './passenger.controller.js';

const router: ExpressRouter = Router();

router.get('/',     requireAuth, asyncHandler(controller.listHandler));
router.post('/',    requireAuth, writeLimiter, asyncHandler(controller.createHandler));
router.patch('/:id', requireAuth, writeLimiter, asyncHandler(controller.updateHandler));
router.delete('/:id', requireAuth, writeLimiter, asyncHandler(controller.deleteHandler));

export default router;
