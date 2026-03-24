export interface SwarmPhase {
  name: 'alba' | 'david' | 'vex' | 'elira';
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  startedAt?: number;
  completedAt?: number;
  cost?: number;
}

export interface SwarmResult {
  id: string;
  question: string;
  decision: string;
  confidence: number;
  argumentsFor: string[];
  argumentsAgainst: string[];
  research: string | null;
  auditNotes: string[];
  actualCost: number;
  agentCount: number;
  duration: number;
  timestamp: string;
  errors?: Array<{ phase: string; error: string; timestamp: string }>;
  partial?: boolean;
}

export type PhaseCallback = (phase: SwarmPhase) => void;

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

function generateId(): string {
  return `sw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function runSwarmDebate(
  question: string,
  onPhase?: PhaseCallback,
): Promise<SwarmResult> {
  const id = generateId();

  const phases: SwarmPhase[] = [
    { name: 'alba', label: 'Research', status: 'pending' },
    { name: 'david', label: 'Debate', status: 'pending' },
    { name: 'vex', label: 'Audit', status: 'pending' },
    { name: 'elira', label: 'Synthesize', status: 'pending' },
  ];

  function updatePhase(
    name: SwarmPhase['name'],
    update: Partial<SwarmPhase>,
  ) {
    const phase = phases.find((p) => p.name === name);
    if (phase) {
      Object.assign(phase, update);
      onPhase?.({ ...phase });
    }
  }

  // Load CommonJS agents with explicit API keys
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Swarm } = require('@/src/agents/swarm');
  
  const swarm = new Swarm({ agents: 10000 });

  const startTime = Date.now();
  let totalCost = 0;
  const errors: Array<{ phase: string; error: string; timestamp: string }> = [];

  // Phase 1: Alba — Research
  updatePhase('alba', { status: 'running', startedAt: Date.now() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let research: any;
  try {
    research = await withRetry(() => swarm.alba.research(question));
    totalCost += research.cost || 0;
    updatePhase('alba', { status: 'done', completedAt: Date.now(), cost: research.cost || 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push({ phase: 'Alba', error: msg, timestamp: new Date().toISOString() });
    research = { summary: 'Research unavailable', sources: [], context: {}, cost: 0 };
    updatePhase('alba', { status: 'error', completedAt: Date.now() });
  }

  // Phase 2: David — Debate
  updatePhase('david', { status: 'running', startedAt: Date.now() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let swarmResult: any;
  try {
    swarmResult = await withRetry(() => swarm.david.swarm(question, research));
    totalCost += swarmResult.cost || 0;
    updatePhase('david', { status: 'done', completedAt: Date.now(), cost: swarmResult.cost || 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push({ phase: 'David', error: msg, timestamp: new Date().toISOString() });
    swarmResult = {
      argumentsFor: [], argumentsAgainst: [], clusters: [],
      consensus: null, consensusStrength: 0,
      votes: { for: 0, against: 0, total: 0 },
      agentCount: 10000, duration: 0, cost: 0,
    };
    updatePhase('david', { status: 'error', completedAt: Date.now() });
  }

  // Phase 3: Vex — Audit
  updatePhase('vex', { status: 'running', startedAt: Date.now() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;
  try {
    audit = await withRetry(() => swarm.vex.audit(question, swarmResult));
    totalCost += audit.cost || 0;
    updatePhase('vex', { status: 'done', completedAt: Date.now(), cost: audit.cost || 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push({ phase: 'Vex', error: msg, timestamp: new Date().toISOString() });
    audit = {
      passed: false, notes: ['Audit skipped due to error'],
      challenges: [], issues: [], confidenceAdjustment: -20, cost: 0,
    };
    updatePhase('vex', { status: 'error', completedAt: Date.now() });
  }

  // Phase 4: Elira — Synthesis
  updatePhase('elira', { status: 'running', startedAt: Date.now() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let synthesis: any;
  try {
    synthesis = await withRetry(() =>
      swarm.elira.synthesize(question, { research, swarmResult, audit }),
    );
    totalCost += synthesis.cost || 0;
    updatePhase('elira', { status: 'done', completedAt: Date.now(), cost: synthesis.cost || 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push({ phase: 'Elira', error: msg, timestamp: new Date().toISOString() });
    synthesis = {
      decision: 'inconclusive', confidence: 0, reasoning: 'Synthesis failed',
      argumentsFor: [], argumentsAgainst: [],
      auditPassed: false, auditIssues: [],
      votes: { for: 0, against: 0, total: 0 }, cost: 0,
    };
    updatePhase('elira', { status: 'error', completedAt: Date.now() });
  }

  return {
    id,
    question,
    decision: synthesis.decision,
    confidence: synthesis.confidence,
    argumentsFor: swarmResult.argumentsFor || [],
    argumentsAgainst: swarmResult.argumentsAgainst || [],
    research: research.summary || null,
    auditNotes: audit.notes || [],
    actualCost: totalCost,
    agentCount: 10000,
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    errors: errors.length > 0 ? errors : undefined,
    partial: errors.length > 0,
  };
}
