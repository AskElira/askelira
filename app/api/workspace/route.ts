import { readAllWorkspace, writeAgents } from '@/lib/workspace/workspace-manager';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = await readAllWorkspace();
    return Response.json({ ok: true, workspace });
  } catch {
    return Response.json({ ok: true, workspace: { soul: '', agents: '', tools: '' } });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
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
}
