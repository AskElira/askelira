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
    const message = err instanceof Error ? err.message : 'Failed to fetch templates';
    console.error('[API /templates]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
