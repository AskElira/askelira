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

  return NextResponse.json(result);
}
