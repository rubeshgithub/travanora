import { Router, type IRouter } from 'express';
import { asyncHandler } from '../../middleware/error.handler.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.guard.js';
import { listPendingRefundsHandler, resolveRefundHandler } from './admin.controller.js';

const router: IRouter = Router();

router.use(requireAuth, requireAdmin);

router.get('/refunds/pending', asyncHandler(listPendingRefundsHandler));
router.post('/refunds/:ledgerId/resolve', asyncHandler(resolveRefundHandler));

export default router;
