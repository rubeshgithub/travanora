import { loadStripe } from '@stripe/stripe-js';
import { env } from './env.js';
export const stripePromise = env.VITE_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(env.VITE_STRIPE_PUBLISHABLE_KEY)
    : null;
//# sourceMappingURL=stripe.js.map