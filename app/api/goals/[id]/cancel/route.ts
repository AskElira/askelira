/**
 * Build Cancellation Endpoint — Feature 10 (Steven Gamma)
 *
 * POST /api/goals/[id]/cancel
 * Cancels an active build and sends Telegram notification.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const goalId = params.id;

  try {
    const { cancelPipelineRun } = await import('@/lib/pipeline-state');
    const { updateGoalStatus } = await import('@/lib/building-manager');
    const { notify } = await import('@/lib/notify');

    const wasCancelled = cancelPipelineRun(goalId);

    // Update goal status in DB regardless
    await updateGoalStatus(goalId, 'blocked');

    notify(`Build *cancelled* for goal \`${goalId}\``);

    return NextResponse.json({
      goalId,
      cancelled: true,
      wasPipelineActive: wasCancelled,
      message: wasCancelled
        ? 'Pipeline cancelled. Goal marked as blocked.'
        : 'No active pipeline found. Goal marked as blocked.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
