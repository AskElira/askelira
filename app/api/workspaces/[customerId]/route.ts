/**
 * GET /api/workspaces/[customerId]
 *
 * Lists files in a customer workspace (2 levels deep).
 * Phase 3 (CLI Phase 3).
 */

import { NextRequest } from 'next/server';
import { listWorkspaceFiles } from '@/lib/workspace-paths';

export async function GET(
  _request: NextRequest,
  { params }: { params: { customerId: string } },
) {
  const { customerId } = params;

  if (!customerId) {
    return Response.json({ error: 'Missing customerId' }, { status: 400 });
  }

  try {
    const files = await listWorkspaceFiles(customerId);
    return Response.json({ ok: true, customerId, files });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
