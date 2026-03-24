import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Dev mode bypass
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        portalUrl: null,
        devMode: true,
        message: 'Billing portal not available in dev mode',
      });
    }

    const { stripe } = await import('@/lib/stripe');
    const { sql } = await import('@vercel/postgres');

    // Find the most recent subscription with a stripe customer ID
    const { rows } = await sql`
      SELECT stripe_customer_id FROM subscriptions
      WHERE stripe_customer_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (rows.length === 0 || !rows[0].stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 },
      );
    }

    const origin =
      request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: rows[0].stripe_customer_id as string,
      return_url: `${origin}/billing`,
    });

    return NextResponse.json({
      portalUrl: portalSession.url,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[API /billing/portal]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
