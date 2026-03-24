import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10/hour per IP
    const ip = getClientIp(req.headers);
    const rateCheck = checkRateLimit(`goals_new:${ip}`, 10, 3600000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { goalText, customerId, customerContext } = body;

    // Validate required fields
    if (!goalText || typeof goalText !== 'string' || goalText.trim().length === 0) {
      return NextResponse.json(
        { error: 'goalText is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    if (!customerId || typeof customerId !== 'string') {
      return NextResponse.json(
        { error: 'customerId is required and must be a string' },
        { status: 400 },
      );
    }

    // Try DB, return error if unavailable
    try {
      const { createGoal } = await import('@/lib/building-manager');
      const goal = await createGoal({
        customerId,
        goalText: goalText.trim(),
        customerContext: customerContext ?? {},
      });

      return NextResponse.json({
        goalId: goal.id,
        status: goal.status,
        createdAt: goal.createdAt.toISOString(),
      });
    } catch (dbErr: unknown) {
      const message = dbErr instanceof Error ? dbErr.message : 'Database error';
      console.error('[API /goals/new] DB error:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[API /goals/new]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
