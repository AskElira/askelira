/**
 * Pipeline Progress Endpoint — Feature 9 (Steven Gamma)
 *
 * GET /api/goals/[id]/progress
 * Returns current pipeline progress: active agent, elapsed time, status.
 * Auth: Unified auth (NextAuth session or header-based).
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Unified auth: support both NextAuth session (web) and header-based auth (CLI)
    const auth = await authenticate(req);
    if (!auth.authenticated || !auth.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.id;

    const { getProgressSummary } = await import('@/lib/pipeline-state');
    const { getGoal, getAllFloors } = await import('@/lib/building-manager');

    const goal = await getGoal(goalId);

    // Verify ownership
    if (goal.customerId !== auth.customerId) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const progress = getProgressSummary(goalId);
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
