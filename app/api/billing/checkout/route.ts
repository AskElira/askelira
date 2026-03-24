import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { goalId } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 },
      );
    }

    // Dev mode bypass — no Stripe configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('[Billing] Dev mode — returning mock checkout URL');
      return NextResponse.json({
        checkoutUrl: `/buildings/${goalId}?checkout=success`,
        devMode: true,
      });
    }

    // Load goal from DB
    const { getGoal } = await import('@/lib/building-manager');
    const { createSubscription, getSubscription } = await import(
      '@/lib/subscription-manager'
    );
    const { stripe } = await import('@/lib/stripe');

    let goal;
    try {
      goal = await getGoal(goalId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('not found')) {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      throw err;
    }

    // Create subscription record if one doesn't exist
    let sub = await getSubscription(goalId);
    if (!sub) {
      sub = await createSubscription({
        customerId: goal.customerId,
        goalId,
      });
    }

    // Determine customer email from context
    const customerEmail =
      (goal.customerContext as Record<string, unknown>)?.email as
        | string
        | undefined;

    // Build Stripe checkout session
    const origin =
      request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [
        // $99 one-time plan design fee
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AskElira Building Plan',
              description: 'One-time building design and setup fee',
            },
            unit_amount: 9900,
          },
          quantity: 1,
        },
        // $49/month per floor subscription
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AskElira Floor Subscription',
              description: 'Per-floor monthly automation maintenance',
            },
            unit_amount: 4900,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        goalId,
        customerId: goal.customerId,
        subscriptionId: sub.id,
      },
      success_url: `${origin}/buildings/${goalId}?checkout=success`,
      cancel_url: `${origin}/onboard?step=3&goalId=${goalId}`,
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      checkoutUrl: session.url,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[API /billing/checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
