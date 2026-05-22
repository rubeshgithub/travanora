import { Duffel } from '@duffel/api';
import { env } from '../config/env.js';

export const duffel = new Duffel({
  token: env.DUFFEL_ACCESS_TOKEN,
});
