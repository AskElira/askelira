import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTierForEmail } from '@/lib/tiers';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const email = session.user.email;

    // Try DB, fall back to mock for local dev
    let plan = 'free';
    let debatesUsed = 0;

    try {
      const { getUserUsage } = await import('@/lib/db');
      const usage = await getUserUsage(email);
      plan = usage.plan;
      debatesUsed = usage.debatesUsed;
    } catch {
      // No DB connection — mock response for local dev
      plan = 'free';
      debatesUsed = 0;
    }

    const tier = getTierForEmail(email, plan);
    const limit = tier.unlimited ? 'unlimited' : tier.monthlyDebates;
    const remaining = tier.unlimited ? 'unlimited' : Math.max(0, tier.monthlyDebates - debatesUsed);

    return NextResponse.json({
      email,
      plan: tier.name.toLowerCase(),
      tier: tier.name,
      count: debatesUsed,
      limit,
      remaining,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[API /usage]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
