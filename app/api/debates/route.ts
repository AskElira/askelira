import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const emailParam = req.nextUrl.searchParams.get('email');
    const email = session?.user?.email || emailParam;

    if (!email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Try DB, fall back to empty array for local dev
    try {
      const { sql } = await import('@vercel/postgres');
      const { rows } = await sql`
        SELECT id, question, decision, confidence, cost, duration_ms, created_at
        FROM debates
        WHERE user_email = ${email}
        ORDER BY created_at DESC
        LIMIT 50
      `;
      return NextResponse.json(rows);
    } catch {
      // No DB — return empty array
      return NextResponse.json([]);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[API /debates]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
