// ============================================================
// AskElira CLI — API Client
// ============================================================
// Single file wrapping all AskElira API endpoints.
// Uses native http/https modules (no external deps).

import http from 'http';
import https from 'https';
import * as auth from './auth';

// ── Types ────────────────────────────────────────────────────

interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

interface CreateGoalParams {
  goalText: string;
  customerContext?: Record<string, unknown>;
}

interface GoalListItem {
  id: string;
  customerId: string;
  goalText: string;
  status: string;
  buildingSummary: string | null;
  floorCount: number;
  liveFloors: number;
  createdAt: string;
  updatedAt: string;
}

interface GoalDetail {
  goal: {
    id: string;
    customerId: string;
    goalText: string;
    customerContext: Record<string, unknown>;
    buildingSummary: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  floors: Array<{
    id: string;
    floorNumber: number;
    name: string;
    description: string | null;
    successCondition: string;
    status: string;
    researchOutput: string | null;
    buildOutput: string | null;
    vexGate1Report: string | null;
    vexGate2Report: string | null;
    iterationCount: number;
    buildingContext: string | null;
    handoffNotes: string | null;
    createdAt: string;
    completedAt: string | null;
    fileNames?: string[];
    syntaxValid?: boolean;
  }>;
  recentLogs: Array<{
    id: string;
    floorId: string | null;
    agentName: string;
    iteration: number;
    action: string;
    inputSummary: string | null;
    outputSummary: string | null;
    toolCallsMade: unknown[];
    tokensUsed: number;
    durationMs: number;
    timestamp: string;
  }>;
  stevenSuggestions: string[];
  pendingExpansions: Array<{
    name: string;
    description: string;
    successCondition: string;
    reasoning: string;
    suggestedAt: string;
  }>;
}

interface PlanResult {
  goalId: string;
  buildingSummary: string;
  floorCount: number;
  totalEstimatedHours: number;
  floors: Array<{
    number: number;
    name: string;
    description: string;
    successCondition: string;
    complexity?: string;
    estimatedHours?: number;
    status?: string;
  }>;
  cached?: boolean;
  templateId?: string;
}

interface ApproveResult {
  goalId: string;
  status: string;
  activatedFloor: {
    id: string;
    name: string;
    floorNumber: number;
  } | null;
  message: string;
}

interface HeartbeatResult {
  status: {
    goalId: string;
    active: boolean;
    intervalMs: number;
    liveFloors: number;
    lastCheckedAt: string | null;
    nextCheckAt: string | null;
  };
  recentLogs: Array<{
    id: string;
    floorId: string | null;
    agentName: string;
    action: string;
    outputSummary: string | null;
    timestamp: string;
  }>;
}

interface TriggerHeartbeatResult {
  goalId: string;
  message: string;
  results: Array<{
    floorId: string;
    floorNumber: number;
    name: string;
    result: unknown;
    error?: string;
  }>;
}

interface StartFloorResult {
  started: boolean;
  floorId: string;
  floorName: string;
  message: string;
}

interface LogEntry {
  id: string;
  floorId: string | null;
  goalId: string | null;
  agentName: string;
  iteration: number;
  action: string;
  inputSummary: string | null;
  outputSummary: string | null;
  toolCallsMade: unknown[];
  tokensUsed: number;
  durationMs: number;
  timestamp: string;
}

interface PatternResult {
  ok: boolean;
  category: string;
  count: number;
  patterns: unknown[];
}

// ── Core fetch ───────────────────────────────────────────────

function getBaseUrl(): string {
  return process.env.ASKELIRA_URL || auth.getBaseUrl() || 'http://localhost:3000';
}

/**
 * Core API fetch using native http/https.
 * Attaches auth headers automatically.
 */
function apiFetch<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string | number | undefined>;
    timeout?: number; // Custom timeout in milliseconds
  } = {},
): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    if (!auth.isAuthenticated()) {
      reject(new Error('Not authenticated. Run `askelira login` first.'));
      return;
    }

    const baseUrl = getBaseUrl();
    const method = options.method || 'GET';

    // Build URL with query params
    let fullPath = path;
    if (options.query) {
      const params = new URLSearchParams();
      for (const [key, val] of Object.entries(options.query)) {
        if (val !== undefined && val !== null) {
          params.append(key, String(val));
        }
      }
      const qs = params.toString();
      if (qs) {
        fullPath += `?${qs}`;
      }
    }

    const url = new URL(fullPath, baseUrl);
    const transport = url.protocol === 'https:' ? https : http;

    const payload = options.body ? JSON.stringify(options.body) : undefined;

    const headers: Record<string, string> = {
      'x-api-key': auth.getApiKey(),
      'x-email': auth.getEmail(),
      'x-customer-id': auth.getCustomerId(),
    };

    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(Buffer.byteLength(payload));
    }

    const req = transport.request(
      url,
      { method, headers },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data) as T;
            resolve({
              ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
              status: res.statusCode || 500,
              data: parsed,
            });
          } catch {
            reject(new Error(`Invalid JSON response: ${data.substring(0, 200)}`));
          }
        });
      },
    );

    req.on('error', (err: Error) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });

    // Custom timeout (default 300s / 5 minutes for most requests)
    const timeoutMs = options.timeout ?? 300000;
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds`));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

// ── Public API methods ───────────────────────────────────────

/**
 * List all goals for the authenticated customer.
 */
export async function listGoals(): Promise<ApiResponse<{ goals: GoalListItem[] }>> {
  return apiFetch<{ goals: GoalListItem[] }>('/api/goals');
}

/**
 * Get a single goal with floors, logs, and suggestions.
 */
export async function getGoal(goalId: string): Promise<ApiResponse<GoalDetail>> {
  return apiFetch<GoalDetail>(`/api/goals/${goalId}`);
}

/**
 * Create a new goal.
 */
export async function createGoal(
  params: CreateGoalParams,
): Promise<ApiResponse<{ goalId: string; status: string; createdAt: string }>> {
  return apiFetch<{ goalId: string; status: string; createdAt: string }>(
    '/api/goals/new',
    {
      method: 'POST',
      body: {
        goalText: params.goalText,
        customerId: auth.getCustomerId(),
        customerContext: params.customerContext ?? {},
      },
    },
  );
}

/**
 * Trigger Elira's building design (Floor 0).
 */
export async function getPlan(goalId: string): Promise<ApiResponse<PlanResult>> {
  // Planning calls can take 2-3 minutes as Elira designs the building blueprint
  return apiFetch<PlanResult>(`/api/goals/${goalId}/plan`, {
    method: 'POST',
    timeout: 180000 // 3 minutes
  });
}

/**
 * Approve a goal and start building.
 */
export async function approveGoal(goalId: string): Promise<ApiResponse<ApproveResult>> {
  // Approval starts the building loop (Alba starts immediately)
  return apiFetch<ApproveResult>(`/api/goals/${goalId}/approve`, {
    method: 'POST',
    timeout: 120000 // 2 minutes
  });
}

/**
 * Get heartbeat status for a goal.
 */
export async function getHeartbeat(goalId: string): Promise<ApiResponse<HeartbeatResult>> {
  return apiFetch<HeartbeatResult>(`/api/heartbeat/${goalId}`);
}

/**
 * Trigger a single heartbeat cycle.
 */
export async function triggerHeartbeat(
  goalId: string,
): Promise<ApiResponse<TriggerHeartbeatResult>> {
  return apiFetch<TriggerHeartbeatResult>(`/api/heartbeat/${goalId}`, {
    method: 'POST',
  });
}

/**
 * Start the building loop for a floor.
 */
export async function startFloor(floorId: string): Promise<ApiResponse<StartFloorResult>> {
  return apiFetch<StartFloorResult>(`/api/loop/start/${floorId}`, { method: 'POST' });
}

/**
 * Get agent logs for a goal.
 */
export async function getLogs(
  goalId: string,
  options?: { limit?: number; agent?: string; floor?: string },
): Promise<ApiResponse<{ logs: LogEntry[] }>> {
  return apiFetch<{ logs: LogEntry[] }>(`/api/goals/${goalId}/logs`, {
    query: {
      limit: options?.limit,
      agent: options?.agent,
      floor: options?.floor,
    },
  });
}

/**
 * Get intelligence patterns for a category.
 */
export async function getPatterns(
  category: string,
): Promise<ApiResponse<PatternResult>> {
  return apiFetch<PatternResult>('/api/intelligence/patterns', {
    query: { category },
  });
}

// ── Snapshot types ────────────────────────────────────────────

interface SnapshotItem {
  id: string;
  reason: string;
  status: string;
  iterationCount: number;
  createdAt: string;
}

interface SnapshotsResult {
  floorId: string;
  snapshots: SnapshotItem[];
}

interface RollbackResult {
  floorId: string;
  snapshotId: string;
  message: string;
}

interface StartHeartbeatResult {
  started: boolean;
  goalId: string;
  intervalMs: number;
  message: string;
}

interface StopHeartbeatResult {
  stopped: boolean;
  goalId: string;
}

// ── Snapshot & Rollback API ──────────────────────────────────

/**
 * Get snapshots for a floor.
 */
export async function getSnapshots(floorId: string): Promise<ApiResponse<SnapshotsResult>> {
  return apiFetch<SnapshotsResult>(`/api/floors/${floorId}/snapshots`);
}

/**
 * Rollback a floor to a snapshot.
 */
export async function rollbackFloor(
  floorId: string,
  snapshotId?: string,
): Promise<ApiResponse<RollbackResult>> {
  return apiFetch<RollbackResult>(`/api/floors/${floorId}/rollback`, {
    method: 'POST',
    body: snapshotId ? { snapshotId } : {},
  });
}

// ── Heartbeat Start/Stop API ─────────────────────────────────

/**
 * Start the heartbeat monitor for a goal.
 */
export async function startHeartbeatApi(
  goalId: string,
  intervalMs?: number,
): Promise<ApiResponse<StartHeartbeatResult>> {
  return apiFetch<StartHeartbeatResult>(`/api/heartbeat/${goalId}/start`, {
    method: 'POST',
    body: intervalMs ? { intervalMs } : {},
  });
}

/**
 * Stop the heartbeat monitor for a goal.
 */
export async function stopHeartbeatApi(
  goalId: string,
): Promise<ApiResponse<StopHeartbeatResult>> {
  return apiFetch<StopHeartbeatResult>(`/api/heartbeat/${goalId}/stop`, {
    method: 'POST',
  });
}

// ── Re-exports ───────────────────────────────────────────────

export type {
  ApiResponse,
  GoalListItem,
  GoalDetail,
  PlanResult,
  ApproveResult,
  HeartbeatResult,
  TriggerHeartbeatResult,
  StartFloorResult,
  LogEntry,
  PatternResult,
  CreateGoalParams,
  SnapshotItem,
  SnapshotsResult,
  RollbackResult,
  StartHeartbeatResult,
  StopHeartbeatResult,
};
