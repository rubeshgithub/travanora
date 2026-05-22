import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service.js';
import { AppError } from '../../middleware/error.handler.js';

export async function getDashboardHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return res.json(await dashboardService.getDashboard(req.user.sub));
}
