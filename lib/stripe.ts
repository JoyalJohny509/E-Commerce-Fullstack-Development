import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    'STRIPE_SECRET_KEY is not set. Stripe payments will not work. ' +
    'Get your test key from https://dashboard.stripe.com/test/apikeys'
  );
}

/**
 * Stripe client singleton for server-side operations.
 * Uses the latest API version for full TypeScript support.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  typescript: true,
});
