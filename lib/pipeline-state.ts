/**
 * Pipeline State Tracker — Steven Gamma Features 1, 3, 5, 6, 10, 29, 31, 35
 *
 * In-memory state tracking for active pipeline runs.
 * Tracks: requestId, current agent, elapsed time, cancellation, cost, search counts.
 */

import { randomUUID } from 'crypto';

// ============================================================
// Types
// ============================================================

export interface PipelineRun {
  requestId: string;
  goalId: string;
  floorId: string;
  currentAgent: string | null;
  currentStep: string | null;
  startedAt: number;
  agentStartTimes: Record<string, number>;
  agentDurations: Record<string, number>;
  cancelled: boolean;
  cancelledAt: number | null;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  };
  searchCounts: {
    tavily: number;
    brave: number;
  };
  eliraQualityScore: number | null;
}

// ============================================================
// Registry
// ============================================================

const activeRuns = new Map<string, PipelineRun>();
const goalFloorLocks = new Map<string, boolean>();

// ============================================================
// Public API
// ============================================================

/**
 * Feature 1: Generate a requestId and register a new pipeline run.
 */
export function startPipelineRun(goalId: string, floorId: string): PipelineRun {
  const requestId = randomUUID();
  const run: PipelineRun = {
    requestId,
    goalId,
    floorId,
    currentAgent: null,
    currentStep: null,
    startedAt: Date.now(),
    agentStartTimes: {},
    agentDurations: {},
    cancelled: false,
    cancelledAt: null,
    tokenUsage: { inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 },
    searchCounts: { tavily: 0, brave: 0 },
    eliraQualityScore: null,
  };
  activeRuns.set(floorId, run);
  return run;
}

/**
 * Get the active pipeline run for a floor.
 */
export function getPipelineRun(floorId: string): PipelineRun | undefined {
  return activeRuns.get(floorId);
}

/**
 * Get pipeline run by goalId (searches all active runs).
 */
export function getPipelineRunByGoal(goalId: string): PipelineRun | undefined {
  for (const run of activeRuns.values()) {
    if (run.goalId === goalId) return run;
  }
  return undefined;
}

/**
 * Feature 1: Update the current agent being executed.
 */
export function setCurrentAgent(floorId: string, agent: string, step: string): void {
  const run = activeRuns.get(floorId);
  if (run) {
    run.currentAgent = agent;
    run.currentStep = step;
    run.agentStartTimes[agent] = Date.now();
  }
}

/**
 * Feature 35: Record agent duration after completion.
 */
export function recordAgentDuration(floorId: string, agent: string, durationMs: number): void {
  const run = activeRuns.get(floorId);
  if (run) {
    run.agentDurations[agent] = durationMs;
  }
}

/**
 * Feature 3: Get elapsed time for a pipeline run.
 */
export function getElapsedMs(floorId: string): number {
  const run = activeRuns.get(floorId);
  if (!run) return 0;
  return Date.now() - run.startedAt;
}

/**
 * Feature 3: Check if pipeline has exceeded timeout (30 minutes).
 */
export function isTimedOut(floorId: string, timeoutMs: number = 1800000): boolean {
  return getElapsedMs(floorId) > timeoutMs;
}

/**
 * Feature 10: Set cancellation flag.
 */
export function cancelPipelineRun(goalId: string): boolean {
  for (const [floorId, run] of activeRuns) {
    if (run.goalId === goalId && !run.cancelled) {
      run.cancelled = true;
      run.cancelledAt = Date.now();
      return true;
    }
  }
  return false;
}

/**
 * Feature 10: Check if a build has been cancelled.
 */
export function isCancelled(floorId: string): boolean {
  const run = activeRuns.get(floorId);
  return run?.cancelled ?? false;
}

/**
 * Feature 6: Acquire a lock for a goalId (concurrent floor protection).
 */
export function acquireGoalLock(goalId: string): boolean {
  if (goalFloorLocks.has(goalId)) {
    return false; // Already locked
  }
  goalFloorLocks.set(goalId, true);
  return true;
}

/**
 * Feature 6: Release the lock for a goalId.
 */
export function releaseGoalLock(goalId: string): void {
  goalFloorLocks.delete(goalId);
}

/**
 * Feature 6: Check if a goalId is locked.
 */
export function isGoalLocked(goalId: string): boolean {
  return goalFloorLocks.has(goalId);
}

/**
 * Feature 31: Record token usage.
 */
export function recordTokenUsage(
  floorId: string,
  inputTokens: number,
  outputTokens: number,
  model: string,
): void {
  const run = activeRuns.get(floorId);
  if (!run) return;

  run.tokenUsage.inputTokens += inputTokens;
  run.tokenUsage.outputTokens += outputTokens;

  // Cost estimation: Opus ~$15/MTok input, ~$75/MTok output; Sonnet ~$3/MTok input, ~$15/MTok output
  const isOpus = model.includes('opus');
  const inputCostPerMTok = isOpus ? 15 : 3;
  const outputCostPerMTok = isOpus ? 75 : 15;

  run.tokenUsage.estimatedCostUsd +=
    (inputTokens / 1_000_000) * inputCostPerMTok +
    (outputTokens / 1_000_000) * outputCostPerMTok;
}

/**
 * Feature 20: Record search API call.
 */
export function recordSearchCall(floorId: string, provider: 'tavily' | 'brave'): void {
  const run = activeRuns.get(floorId);
  if (run) {
    run.searchCounts[provider]++;
  }
}

/**
 * Feature 40: Record Elira quality score.
 */
export function recordEliraQualityScore(floorId: string, score: number): void {
  const run = activeRuns.get(floorId);
  if (run) {
    run.eliraQualityScore = score;
  }
}

/**
 * End a pipeline run and return final state.
 */
export function endPipelineRun(floorId: string): PipelineRun | undefined {
  const run = activeRuns.get(floorId);
  if (run) {
    activeRuns.delete(floorId);
  }
  return run;
}

/**
 * Get all active pipeline runs.
 */
export function getAllActiveRuns(): PipelineRun[] {
  return Array.from(activeRuns.values());
}

/**
 * Feature 9: Get progress summary for a specific goal.
 */
export function getProgressSummary(goalId: string): {
  requestId: string | null;
  floorId: string | null;
  currentAgent: string | null;
  currentStep: string | null;
  elapsedMs: number;
  cancelled: boolean;
  tokenUsage: PipelineRun['tokenUsage'] | null;
} {
  const run = getPipelineRunByGoal(goalId);
  if (!run) {
    return {
      requestId: null,
      floorId: null,
      currentAgent: null,
      currentStep: null,
      elapsedMs: 0,
      cancelled: false,
      tokenUsage: null,
    };
  }
  return {
    requestId: run.requestId,
    floorId: run.floorId,
    currentAgent: run.currentAgent,
    currentStep: run.currentStep,
    elapsedMs: Date.now() - run.startedAt,
    cancelled: run.cancelled,
    tokenUsage: { ...run.tokenUsage },
  };
}
