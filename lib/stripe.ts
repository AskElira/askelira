import Stripe from 'stripe';

// [BUG-5-07] The non-null assertion `!` on STRIPE_SECRET_KEY caused a Stripe
// client to be created with `undefined` as the key when the env var is missing.
// This crashes at import time in some SDK versions or causes cryptic auth errors
// later. Use lazy initialization so the module can be imported safely, and throw
// a clear error only when the client is actually used without the key.
let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        '[Stripe] STRIPE_SECRET_KEY is not set. Billing features are unavailable.',
      );
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

// Preserve backward compatibility: `import { stripe } from '@/lib/stripe'`
// uses a Proxy that lazily initializes on first property access.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripeClient(), prop, receiver);
  },
});
