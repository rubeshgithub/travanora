import { Request, Response } from 'express';
import { Member } from '../auth/member.model.js';
import { AppError } from '../../middleware/error.handler.js';

export async function getMemberHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const member = await Member.findOne({ userId: req.user.sub });
  if (!member) throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member profile not found');

  return res.json(member.toJSON());
}
