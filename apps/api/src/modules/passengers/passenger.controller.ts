import { Request, Response } from 'express';
import { SavedPassengerSchema } from '@travanora/shared';
import * as passengerService from './passenger.service.js';
import { AppError } from '../../middleware/error.handler.js';

export async function listHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const passengers = await passengerService.listPassengers(req.user.sub);
  return res.json({ passengers });
}

export async function createHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = SavedPassengerSchema.parse(req.body);
  const passenger = await passengerService.createPassenger(req.user.sub, data);
  return res.status(201).json({ passenger });
}

export async function updateHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = SavedPassengerSchema.partial().parse(req.body);
  const passenger = await passengerService.updatePassenger(req.user.sub, req.params['id']!, data);
  return res.json({ passenger });
}

export async function deleteHandler(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await passengerService.deletePassenger(req.user.sub, req.params['id']!);
  return res.status(204).end();
}
