import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const templateId = params.id;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 },
      );
    }

    const { getTemplate } = await import('@/lib/building-manager');
    const template = await getTemplate(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: template.id,
      goalText: template.goalText,
      buildingSummary: template.buildingSummary,
      category: template.category,
      floorBlueprints: template.floorBlueprints,
      useCount: template.useCount,
      avgCompletionHours: template.avgCompletionHours,
      isPublic: template.isPublic,
      sourceGoalId: template.sourceGoalId,
      createdAt: template.createdAt.toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch template';
    console.error('[API /templates/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
