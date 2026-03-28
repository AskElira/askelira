import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth-helpers';
import { BUILDING_EVENTS } from '@/lib/events';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Unified auth: support both NextAuth session (web) and header-based auth (CLI)
    const auth = await authenticate(req);
    const headerCustomerId = req.headers.get('x-customer-id');
    const effectiveCustomerId = auth.customerId || headerCustomerId;
    if (!effectiveCustomerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.id;

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 },
      );
    }

    try {
      const {
        getGoal,
        updateGoalStatus,
        updateFloorStatus,
        logAgentAction,
        updateStevenHeartbeat,
      } = await import('@/lib/building-manager');
      const { syncToFiles } = await import('@/lib/workspace/workspace-manager');

      // Load goal from DB
      let goal;
      try {
        goal = await getGoal(goalId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (message.includes('not found')) {
          return NextResponse.json({ error: message }, { status: 404 });
        }
        throw err;
      }

      // Verify ownership
      if (goal.customerId !== effectiveCustomerId) {
        return NextResponse.json(
          { error: 'You do not own this goal' },
          { status: 403 },
        );
      }

      // Must be in 'planning' status
      if (goal.status !== 'planning') {
        return NextResponse.json(
          {
            error: `Goal is in '${goal.status}' status — only 'planning' goals can be approved`,
          },
          { status: 409 },
        );
      }

      // Must have floors designed
      if (!goal.floors || goal.floors.length === 0) {
        return NextResponse.json(
          { error: 'No floors designed yet — call POST /plan first' },
          { status: 409 },
        );
      }

      // Transition goal to 'building'
      await updateGoalStatus(goalId, 'building');

      // Activate Floor 1 -> researching
      const floor1 = goal.floors.find((f) => f.floorNumber === 1);
      let activatedFloor: { id: string; name: string; floorNumber: number } | null = null;
      if (floor1) {
        await updateFloorStatus(floor1.id, 'researching');
        activatedFloor = {
          id: floor1.id,
          name: floor1.name,
          floorNumber: floor1.floorNumber,
        };
      }

      // Sync to workspace files
      try {
        await syncToFiles(goalId);
      } catch {
        // best-effort
      }

      // Log agent action
      await logAgentAction({
        goalId,
        agentName: 'System',
        action: 'building_approved',
        outputSummary: `Building approved. ${goal.floors.length} floors. Floor 1 set to researching.`,
      });

      // Steven (local runner) picks up from here.
      // Activate Steven heartbeat so the runner knows this building needs processing.
      if (floor1) {
        await updateStevenHeartbeat(goalId, 'Steven', 'alba');
        console.log(`[API /approve] Building ${goalId} activated for Steven (local runner).`);
      }

      console.log(`[EVENT] ${BUILDING_EVENTS.APPROVED}`, JSON.stringify({ goalId }));

      return NextResponse.json({
        goalId,
        status: 'building',
        activatedFloor,
        message: `Building approved. Floor 1 "${floor1?.name ?? 'unknown'}" is now researching.`,
      });
    } catch (dbErr: unknown) {
      console.error('[API /goals/[id]/approve] Error:', dbErr instanceof Error ? dbErr.message : dbErr);
      return NextResponse.json({ error: 'Failed to approve goal' }, { status: 500 });
    }
  } catch (err: unknown) {
    console.error('[API /goals/[id]/approve]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
