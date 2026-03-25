import { readAllWorkspace, writeAgents } from '@/lib/workspace/workspace-manager';
import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    // Unified auth: support both NextAuth session (web) and header-based auth (CLI)
    const auth = await authenticate(req);
    if (!auth.authenticated || !auth.customerId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = await readAllWorkspace();
    return Response.json({ ok: true, workspace });
  } catch {
    return Response.json({ ok: true, workspace: { soul: '', agents: '', tools: '' } });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Unified auth: support both NextAuth session (web) and header-based auth (CLI)
    const auth = await authenticate(req);
    if (!auth.authenticated || !auth.customerId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { agents } = body;

    if (typeof agents !== 'string') {
      return Response.json(
        { error: 'agents must be a string' },
        { status: 400 },
      );
    }

    if (agents.length > 100_000) {
      return Response.json(
        { error: 'agents content exceeds maximum size (100KB)' },
        { status: 400 },
      );
    }

    await writeAgents(agents);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[API /workspace POST]', err instanceof Error ? err.message : err);
    return Response.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}
