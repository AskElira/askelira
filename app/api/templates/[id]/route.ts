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

    // Only serve public templates to unauthenticated or non-owner requests
    if (!template.isPublic) {
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
      createdAt: template.createdAt.toISOString(),
    });
  } catch (err: unknown) {
    // [BUG-5-05] Never expose internal error details in API responses
    const internalMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API /templates/[id]]', internalMsg);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 },
    );
  }
}
