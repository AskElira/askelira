/**
 * Data Export Endpoint -- Steven Delta SD-006
 *
 * GET /api/user/export
 * Returns all user data (goals, floors, logs) as a JSON download.
 * GDPR-friendly data portability.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const { sql } = await import('@vercel/postgres');

    // Gather all user data
    const [goalsResult, debatesResult, usageResult] = await Promise.all([
      sql`
        SELECT g.*, json_agg(
          json_build_object(
            'id', f.id,
            'floor_number', f.floor_number,
            'name', f.name,
            'status', f.status,
            'created_at', f.created_at,
            'completed_at', f.completed_at
          ) ORDER BY f.floor_number
        ) FILTER (WHERE f.id IS NOT NULL) AS floors
        FROM goals g
        LEFT JOIN floors f ON f.goal_id = g.id
        WHERE g.customer_id = ${email}
          AND g.deleted_at IS NULL
        GROUP BY g.id
        ORDER BY g.created_at DESC
      `,
      sql`
        SELECT id, question, decision, cost, duration_ms, created_at
        FROM debates
        WHERE user_email = ${email}
        ORDER BY created_at DESC
      `.catch(() => ({ rows: [] })),
      sql`
        SELECT * FROM users WHERE email = ${email}
      `.catch(() => ({ rows: [] })),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        email,
        profile: usageResult.rows[0] ?? null,
      },
      goals: goalsResult.rows,
      debates: debatesResult.rows,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="askelira-export-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    console.error('[API /user/export]', message);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
