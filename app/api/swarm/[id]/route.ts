import { NextRequest, NextResponse } from 'next/server';
import { getDebateResult } from '@/lib/results';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const result = await getDebateResult(params.id);

  if (!result) {
    return NextResponse.json(
      { error: 'Debate result not found or expired' },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
