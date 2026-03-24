import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getPublicTemplates } = await import('@/lib/building-manager');
    const templates = await getPublicTemplates(20);

    return NextResponse.json({
      templates: templates.map((t) => ({
        id: t.id,
        goalText: t.goalText,
        buildingSummary: t.buildingSummary,
        category: t.category,
        floorCount: t.floorBlueprints.length,
        useCount: t.useCount,
        avgCompletionHours: t.avgCompletionHours,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (err: unknown) {
    // [BUG-5-05] Never expose internal error details (DB connection strings,
    // stack traces, etc.) in API responses. Log the real error server-side,
    // return a generic message to the client.
    const internalMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API /templates]', internalMsg);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 },
    );
  }
}
