/**
 * GET /api/workspaces/[customerId]/[...path]
 *
 * Reads a file from a customer workspace.
 * Path traversal protection: resolved path must start with workspace root.
 * Phase 3 (CLI Phase 3).
 */

import { NextRequest } from 'next/server';
import { readWorkspaceFile, isPathSafe } from '@/lib/workspace-paths';

export async function GET(
  _request: NextRequest,
  { params }: { params: { customerId: string; path: string[] } },
) {
  const { customerId, path: pathSegments } = params;

  if (!customerId || !pathSegments || pathSegments.length === 0) {
    return Response.json({ error: 'Missing path' }, { status: 400 });
  }

  const filePath = pathSegments.join('/');

  // Path traversal protection
  if (!isPathSafe(customerId, filePath)) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const content = await readWorkspaceFile(customerId, filePath);

    if (content === null) {
      return Response.json({ error: 'File not found' }, { status: 404 });
    }

    return Response.json({
      ok: true,
      customerId,
      path: filePath,
      content,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
