import { createFloor, logAgentAction, updateGoalStatus } from './building-manager';
import { ELIRA_FLOOR_ZERO_PROMPT, ELIRA_SIMPLIFY_PROMPT } from './agent-prompts';
import { callClaudeWithSystem, PROVIDER } from './openclaw-client';
import { routeAgentCall } from './agent-router';

// ============================================================
// Interfaces
// ============================================================

interface FloorPlan {
  number: number;
  name: string;
  description: string;
  successCondition: string;
  complexity: 1 | 2 | 3;
  estimatedHours: number;
}

export interface EliraFloorZeroResult {
  floors: FloorPlan[];
  buildingSummary: string;
  totalEstimatedHours: number;
  floorCount: number;
}

// ============================================================
// Helpers
// ============================================================

/**
 * Strip markdown code fences from Claude's response if present.
 */
function stripCodeFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```')) {
    // Remove opening fence (```json or ```)
    text = text.replace(/^```[a-z]*\n?/, '');
    // Remove closing fence
    text = text.replace(/\n?```\s*$/, '');
  }
  return text.trim();
}

/**
 * Parse JSON from Claude's response, stripping markdown if needed.
 * Handles preamble text, markdown fences, and trailing text.
 */
function parseEliraJson<T>(raw: string): T {
  let text = stripCodeFences(raw);

  // Also check for fences that may have been preceded by text
  const fenceMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Attempt 1: parse directly
  try {
    return JSON.parse(text) as T;
  } catch {
    // Attempt 2: find the first { and parse from there
    const firstBrace = text.indexOf('{');
    if (firstBrace > 0) {
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace > firstBrace) {
        try {
          return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as T;
        } catch {
          // fall through
        }
      }
    }

    throw new Error(
      `Failed to parse Elira JSON response.\n\nRaw response:\n${raw.slice(0, 2000)}`,
    );
  }
}

// ============================================================
// Main export
// ============================================================

/**
 * Floor 0: Elira designs the building plan for a customer goal.
 *
 * 1. Calls Claude (Sonnet) with the ELIRA_FLOOR_ZERO_PROMPT
 * 2. Parses the floor plan JSON
 * 3. Applies complexity gate (splits floors > 3, caps at 6 total)
 * 4. Writes each floor to DB via createFloor()
 * 5. Logs the action
 * 6. Returns the complete plan
 */
export async function designBuilding(
  goalId: string,
  goalText: string,
  customerContext?: string,
): Promise<EliraFloorZeroResult> {
  const startTime = Date.now();

  // -- 1. Build user message --
  let userMessage = `GOAL: ${goalText}`;
  if (customerContext) {
    userMessage += `\n\nCUSTOMER CONTEXT: ${customerContext}`;
  }

  // -- 2. Call Elira (Sonnet — planning does not need Opus) --
  console.log('[Floor Zero] Calling Elira to design building plan...');
  const rawResponse = await routeAgentCall({
    systemPrompt: ELIRA_FLOOR_ZERO_PROMPT,
    userMessage,
    ...(PROVIDER !== 'minimax' ? { model: 'claude-sonnet-4-5-20250929' } : {}),
    maxTokens: 4096,
    agentName: 'Elira',
  });

  // -- 3. Parse response --
  const plan = parseEliraJson<{ floors: FloorPlan[]; buildingSummary: string }>(rawResponse);

  if (!plan.floors || !Array.isArray(plan.floors) || plan.floors.length === 0) {
    throw new Error(
      `Elira returned an invalid plan (no floors).\n\nRaw:\n${rawResponse.slice(0, 2000)}`,
    );
  }

  // -- 4. Complexity gate --
  let floors: FloorPlan[] = [];

  for (const floor of plan.floors) {
    if (floor.complexity > 3 && floors.length < 5) {
      // Too complex — ask Elira to simplify
      console.log(
        `[Floor Zero] Floor ${floor.number} "${floor.name}" has complexity ${floor.complexity}. Simplifying...`,
      );

      const simplifyMessage = `FLOOR TO SIMPLIFY:\n${JSON.stringify(floor, null, 2)}\n\nOriginal goal: ${goalText}`;
      const simplifyRaw = await routeAgentCall({
        systemPrompt: ELIRA_SIMPLIFY_PROMPT,
        userMessage: simplifyMessage,
        ...(PROVIDER !== 'minimax' ? { model: 'claude-sonnet-4-5-20250929' } : {}),
        maxTokens: 2048,
        agentName: 'Elira',
      });

      const simplified = parseEliraJson<{ floors: FloorPlan[] }>(simplifyRaw);
      if (simplified.floors && Array.isArray(simplified.floors)) {
        floors.push(...simplified.floors);
      } else {
        // Fallback: keep original but clamp complexity
        floors.push({ ...floor, complexity: 3 });
      }
    } else {
      floors.push(floor);
    }
  }

  // Cap at 6 floors
  if (floors.length > 6) {
    console.warn(
      `[Floor Zero] Plan has ${floors.length} floors, capping at 6.`,
    );
    floors = floors.slice(0, 6);
  }

  // Re-number sequentially
  floors = floors.map((f, i) => ({ ...f, number: i + 1 }));

  // -- 5. Write each floor to DB --
  for (const floor of floors) {
    await createFloor({
      goalId,
      floorNumber: floor.number,
      name: floor.name,
      description: floor.description,
      successCondition: floor.successCondition,
    });
  }

  // -- 6. Store building summary on the goal --
  try {
    const { updateGoalSummary } = await import('./building-manager');
    await updateGoalSummary(goalId, plan.buildingSummary);
  } catch {
    // updateGoalSummary may not exist yet during migration -- skip silently
  }

  // -- 7. Log the action --
  const durationMs = Date.now() - startTime;
  await logAgentAction({
    goalId,
    agentName: 'Elira',
    action: 'floor_zero_complete',
    inputSummary: goalText.slice(0, 500),
    outputSummary: `Designed ${floors.length} floors: ${floors.map((f) => f.name).join(', ')}`,
    durationMs,
  });

  // -- 8. Compute totals and return --
  const totalEstimatedHours = floors.reduce(
    (sum, f) => sum + (f.estimatedHours || 0),
    0,
  );

  return {
    floors,
    buildingSummary: plan.buildingSummary,
    totalEstimatedHours,
    floorCount: floors.length,
  };
}
