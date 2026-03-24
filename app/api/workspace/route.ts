import { readAllWorkspace, writeAgents } from '@/lib/workspace/workspace-manager';

export async function GET() {
  try {
    const workspace = await readAllWorkspace();
    return Response.json({ ok: true, workspace });
  } catch {
    return Response.json({ ok: true, workspace: { soul: '', agents: '', tools: '' } });
  }
}

export async function POST(req: Request) {
  const { agents } = await req.json();
  await writeAgents(agents);
  return Response.json({ ok: true });
}
