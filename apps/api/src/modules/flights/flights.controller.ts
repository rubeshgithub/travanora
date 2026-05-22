import { Request, Response } from 'express';
import { FlightSearchSchema } from '@travanora/shared';
import { Member } from '../auth/member.model.js';
import { searchFlights } from './flights.service.js';

export async function searchFlightsHandler(req: Request, res: Response) {
  const input = FlightSearchSchema.parse(req.body);

  let isMember = false;
  let discountPercent = 0;

  if (req.user) {
    const member = await Member.findOne({ userId: req.user.sub });
    if (member) {
      isMember = true;
      discountPercent = member.discountPercent;
    }
  }

  const { offers, searchId } = await searchFlights(input, discountPercent);

  return res.json({ offers, isMember, discountPercent, searchId });
}
