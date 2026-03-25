/**
 * Agent Logs API — Phase CLI-2
 * GET /api/goals/[id]/logs?limit=20&agent=Alba&floor=xyz
 *
 * Returns agent_logs for a goal, with optional filters.
 * Auth: Unified auth (NextAuth session or header-based).
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Unified auth: support both NextAuth session (web) and header-based auth (CLI)
    const auth = await authenticate(req);
    if (!auth.authenticated || !auth.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.id;

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 },
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const agentFilter = searchParams.get('agent') || undefined;
    const floorFilter = searchParams.get('floor') || undefined;

    try {
      const { sql } = await import('@vercel/postgres');

      // Build query with optional filters
      let query: string;
      const values: unknown[] = [goalId];
      let paramIdx = 2;

      query = `
        SELECT
          id,
          floor_id AS "floorId",
          goal_id AS "goalId",
          agent_name AS "agentName",
          iteration,
          action,
          input_summary AS "inputSummary",
          output_summary AS "outputSummary",
          tool_calls_made AS "toolCallsMade",
          tokens_used AS "tokensUsed",
          duration_ms AS "durationMs",
          timestamp
        FROM agent_logs
        WHERE goal_id = $1
      `;

      if (agentFilter) {
        query += ` AND LOWER(agent_name) = LOWER($${paramIdx})`;
        values.push(agentFilter);
        paramIdx++;
      }

      if (floorFilter) {
        query += ` AND floor_id = $${paramIdx}`;
        values.push(floorFilter);
        paramIdx++;
      }

      query += ` ORDER BY timestamp DESC LIMIT $${paramIdx}`;
      values.push(limit);

      // Use sql.query for dynamic queries with parameter array
      const { rows } = await sql.query(query, values);

      const logs = rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        floorId: r.floorId,
        goalId: r.goalId,
        agentName: r.agentName,
        iteration: r.iteration,
        action: r.action,
        inputSummary: r.inputSummary,
        outputSummary: r.outputSummary,
        toolCallsMade: r.toolCallsMade || [],
        tokensUsed: r.tokensUsed || 0,
        durationMs: r.durationMs || 0,
        timestamp:
          r.timestamp instanceof Date
            ? (r.timestamp as Date).toISOString()
            : r.timestamp,
      }));

      return NextResponse.json({ logs });
    } catch (dbErr: unknown) {
      const message =
        dbErr instanceof Error ? dbErr.message : 'Database error';
      console.error('[API /goals/[id]/logs] DB error:', message);

      // Return 503 for DB errors so callers know the data is unavailable
      // (not that there are zero logs)
      return NextResponse.json(
        { error: 'Database unavailable', logs: [] },
        { status: 503 },
      );
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error('[API /goals/[id]/logs]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
