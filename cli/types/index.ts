// ============================================================
// AskElira CLI — Shared Types
// ============================================================

/**
 * Goal status values matching the web app's building-manager.ts
 */
export type GoalStatus = 'planning' | 'building' | 'goal_met' | 'blocked';

/**
 * Floor status values matching the web app's building-manager.ts
 */
export type FloorStatus =
  | 'pending'
  | 'researching'
  | 'building'
  | 'auditing'
  | 'live'
  | 'broken'
  | 'blocked';

/**
 * A customer goal — the top-level entity in the building system.
 */
export interface Goal {
  id: string;
  customerId: string;
  goalText: string;
  customerContext: Record<string, unknown>;
  buildingSummary: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * A floor within a goal's building.
 */
export interface Floor {
  id: string;
  goalId: string;
  floorNumber: number;
  name: string;
  description: string | null;
  successCondition: string;
  status: FloorStatus;
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
}

/**
 * A goal with its associated floors — used in dashboard/list views.
 */
export interface GoalWithFloors extends Goal {
  floors: Floor[];
  floorCount: number;
  liveFloorCount: number;
}

/**
 * Agent log entry from building loop execution.
 */
export interface AgentLog {
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

/**
 * Heartbeat status for a goal's monitoring system (Steven).
 */
export interface HeartbeatStatus {
  goalId: string;
  active: boolean;
  intervalMs: number;
  lastCheck: string | null;
  floorsMonitored: number;
}

/**
 * CLI configuration stored in ~/.askelira/config.json
 */
export interface CLIConfig {
  apiKey: string;
  email: string;
  customerId: string;
  baseUrl: string;
}

/**
 * Response from the verify-key API endpoint.
 */
export interface VerifyKeyResponse {
  valid: boolean;
  customerId?: string;
  error?: string;
}

/**
 * Generic API error response.
 */
export interface ApiError {
  error: string;
  status?: number;
}

/**
 * Gateway configuration for OpenClaw WebSocket gateway.
 */
export interface GatewayConfig {
  url: string;         // WebSocket URL (e.g., ws://127.0.0.1:18789)
  token: string;       // Authentication token
  mode: 'gateway' | 'direct' | 'gateway-only';
}

/**
 * Search provider configuration.
 */
export interface SearchConfig {
  provider: 'brave' | 'tavily' | 'perplexity' | 'auto';
  tavilyApiKey: string;
  braveApiKey: string;
}

/**
 * Extended CLI configuration with gateway and search settings.
 */
export interface ExtendedCLIConfig extends CLIConfig {
  gateway: GatewayConfig;
  search: SearchConfig;
  llm: {
    apiKey: string;
  };
}
