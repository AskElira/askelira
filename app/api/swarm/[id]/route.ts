import { NextRequest, NextResponse } from 'next/server';
import { getDebateResult } from '@/lib/results';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await getDebateResult(params.id);

  if (!result) {
    return NextResponse.json(
      { error: 'Debate result not found or expired' },
      { status: 404 },
    );
  }

  // [BUG-5-09] IDOR: Verify the debate belongs to the authenticated user.
  // Without this check, any authenticated user can fetch any debate result
  // by guessing/enumerating debate IDs (sw_xxxxx format).
  // Check DB for ownership if result came from DB, or check cache metadata.
  try {
    const { sql } = await import('@vercel/postgres');
    const { rows } = await sql`
      SELECT user_email FROM debates WHERE id = ${params.id} LIMIT 1
    `;
    // If the debate exists in DB and belongs to a different user, deny access
    if (rows.length > 0 && rows[0].user_email !== session.user.email) {
      return NextResponse.json(
        { error: 'Debate result not found or expired' },
        { status: 404 },
      );
    }
  } catch {
    // DB unavailable (local dev) -- allow access to cached results only
    // In production, DB should always be available
  }

  return NextResponse.json(result);
}
