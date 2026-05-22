import { Router, type Router as ExpressRouter } from 'express';
import { duffel } from '../../lib/duffel.js';
import { logger } from '../../lib/logger.js';
import { asyncHandler } from '../../middleware/error.handler.js';
import type { Request, Response } from 'express';

const router: ExpressRouter = Router();

router.get('/suggestions', asyncHandler(async (req: Request, res: Response) => {
  const query = String(req.query.query ?? '').trim();
  if (query.length < 2) return res.json([]);

  logger.debug({ query }, 'Places suggestions request');

  const result = await duffel.suggestions.list({ query });

  logger.debug({ count: result.data?.length }, 'Duffel suggestions response');

  const places = (result.data ?? [])
    .filter((p) => p.iata_code)
    .map((p) => ({
      iataCode: p.iata_code,
      name: p.name,
      cityName: p.city_name ?? p.name,
      countryName: p.country_name ?? '',
      type: p.type,
    }));

  return res.json(places);
}));

export default router;
