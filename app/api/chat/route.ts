import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/rate-limiter';
import { encodeSSE, encodeSSEDone, encodeSSEError, sseHeaders } from '@/lib/progress-tracker';
import { designBuilding } from '@/lib/floor-zero';
import { createGoal, getGoal, getAllFloors } from '@/lib/building-manager';
import { runFloor } from '@/lib/building-loop';
import { validateGoalText } from '@/lib/content-validator';
import { logger } from '@/lib/logger';
import { generateRequestId, handleUnknownError } from '@/lib/api-error';
import { SwarmPhase } from '@/lib/openclaw-orchestrator';

// ============================================================
// Types
// ============================================================

interface ChatRequestBody {
  goal: string;
  stream?: boolean;
  customerContext?: Record<string, unknown>;
}

// SSE phase format matches what the chat UI expects (same as SwarmPhase)
type ChatPhase = SwarmPhase;

interface ChatResult {
  goalId: string;
  customerId: string;
  buildingSummary: string;
  floorCount: number;
  floors: Array<{
    id: string;
    floorNumber: number;
    name: string;
    description: string | null;
    successCondition: string;
    status: string;
  }>;
}

// ============================================================
// Helpers
// ============================================================

function phaseEvent(
  name: ChatPhase['name'],
  label: string,
  status: ChatPhase['status'],
): ChatPhase {
  return { name, label, status };
}

// ============================================================
// Route
// ============================================================

export const maxDuration = 300; // 5 min — long enough for a full build

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const endpoint = 'POST /api/chat';

  try {
    // 1. Authenticate — allow guest mode for testing (no session + no headers → guest)
    const auth = await authenticate(req);
    let customerId = auth.customerId;
    if (!customerId) {
      // Guest mode: create a temporary customer ID from IP + timestamp hash
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
      const { randomUUID } = await import('crypto');
      customerId = `guest-${ip}-${randomUUID()}`;
      logger.info('Guest session created for chat', { customerId, ip, requestId });
    }

    // 2. Parse body
    let body: ChatRequestBody;
    try {
      body = (await req.json()) as ChatRequestBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { goal, stream = false, customerContext } = body;

    // 3. Validate goal text
    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return NextResponse.json({ error: 'goal is required and must be a non-empty string' }, { status: 400 });
    }
    if (goal.trim().length > 5000) {
      return NextResponse.json({ error: 'goal must be 5000 characters or fewer' }, { status: 400 });
    }

    const contentCheck = validateGoalText(goal);
    if (!contentCheck.valid) {
      return NextResponse.json({ error: contentCheck.reason }, { status: 400 });
    }

    // 4. Rate limit: 5 chat builds per hour per customer
    const rateCheck = checkRateLimit(`chat:${customerId}`, 5, 3600000);
    if (!rateCheck.allowed) {
      logger.warn('Rate limit exceeded', { requestId, userId: customerId, endpoint });
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: { 'X-RateLimit-Remaining': String(rateCheck.remaining) },
        },
      );
    }

    // 5. Create goal
    const goalRecord = await createGoal({
      customerId: customerId,
      goalText: goal.trim(),
      customerContext: customerContext ?? {},
    });
    logger.info('Chat goal created', { requestId, userId: customerId, goalId: goalRecord.id, endpoint });

    // 6. Design the building (Elira floor-zero — creates the floor plan)
    logger.info('[API /chat] Designing building plan...', { requestId, goalId: goalRecord.id });
    const designResult = await designBuilding(goalRecord.id, goal.trim(), customerContext);

    // 7. Get the first floor so Steven can start
    const allFloors = await getAllFloors(goalRecord.id);
    const firstFloor = allFloors[0];

    // For now, always return the planning result immediately.
    // Steven runs the building in the background via the heartbeat/loop system.
    // The UI should poll for completion or redirect to the building page.
    const result: ChatResult = {
      goalId: goalRecord.id,
      customerId: customerId,
      buildingSummary: designResult.buildingSummary,
      floorCount: allFloors.length,
      floors: allFloors.map((f) => ({
        id: f.id,
        floorNumber: f.floorNumber,
        name: f.name,
        description: f.description,
        successCondition: f.successCondition,
        status: f.status,
      })),
    };

    logger.info('[API /chat] Planning complete, Steven running in background', {
      requestId,
      goalId: goalRecord.id,
      floorCount: allFloors.length,
    });

    return NextResponse.json(result, {
      headers: { 'X-RateLimit-Remaining': String(rateCheck.remaining) },
    });
  } catch (err: unknown) {
    return handleUnknownError(err, endpoint, requestId);
  }
}
