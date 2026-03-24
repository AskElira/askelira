/**
 * Pipeline Progress Endpoint — Feature 9 (Steven Gamma)
 *
 * GET /api/goals/[id]/progress
 * Returns current pipeline progress: active agent, elapsed time, status.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const goalId = params.id;

  try {
    const { getProgressSummary } = await import('@/lib/pipeline-state');
    const { getGoal, getAllFloors } = await import('@/lib/building-manager');

    const progress = getProgressSummary(goalId);
    const goal = await getGoal(goalId);
    const floors = await getAllFloors(goalId);

    const currentFloor = floors.find(
      (f) => f.status === 'researching' || f.status === 'building' || f.status === 'auditing',
    );

    return NextResponse.json({
      goalId,
      status: goal.status,
      currentFloor: currentFloor
        ? { id: currentFloor.id, number: currentFloor.floorNumber, name: currentFloor.name, status: currentFloor.status }
        : null,
      currentAgent: progress.currentAgent,
      currentStep: progress.currentStep,
      requestId: progress.requestId,
      elapsedMs: progress.elapsedMs,
      cancelled: progress.cancelled,
      tokenUsage: progress.tokenUsage,
      floors: floors.map((f) => ({
        id: f.id,
        number: f.floorNumber,
        name: f.name,
        status: f.status,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
