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

  const { agents } = await req.json();
  await writeAgents(agents);
  return Response.json({ ok: true });
}
