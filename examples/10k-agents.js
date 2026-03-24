/**
 * AskElira 2.0 — 10,000 Agent Swarm Example
 *
 * Run: node examples/10k-agents.js
 *
 * This example runs a full-scale swarm debate on a complex business decision.
 * 10,000 agents debate simultaneously through the 4-phase pipeline:
 *
 *   Phase 1: Alba    — Researches the question via Brave Search API
 *   Phase 2: David   — 10,000 MiroFish agents debate, form clusters, vote
 *   Phase 3: Vex     — Audits debate quality (participation, dominance, consensus)
 *   Phase 4: Elira   — Synthesizes final decision with GO/NO-GO verdict
 *
 * Estimated cost: ~$0.07
 */

const { Swarm } = require('../src/agents/swarm');
const { calculateSwarmCost } = require('../src/utils/cost-calculator');

const AGENT_COUNT = 10000;
const QUESTION = 'Should we expand to international markets?';

async function main() {
  // Show cost estimate before running
  const estimatedCost = calculateSwarmCost(AGENT_COUNT);
  console.log('=== AskElira 10K Agent Swarm ===\n');
  console.log(`Question:       ${QUESTION}`);
  console.log(`Agents:         ${AGENT_COUNT.toLocaleString()}`);
  console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);
  console.log();

  // Start timer
  const start = Date.now();

  // Create the swarm — agents are initialized but not yet running
  const swarm = new Swarm({ agents: AGENT_COUNT });

  // Run the full 4-phase debate pipeline
  console.log('Starting debate...\n');
  const result = await swarm.debate(QUESTION);

  // Total wall time
  const wallTime = Date.now() - start;

  // === Decision ===
  console.log('========================================');
  console.log('  DECISION');
  console.log('========================================');
  console.log(`  Answer:     ${result.decision.toUpperCase()}`);
  console.log(`  Confidence: ${result.confidence}%`);
  console.log();

  // === Arguments For ===
  console.log('  Arguments For:');
  if (result.argumentsFor.length > 0) {
    result.argumentsFor.forEach((arg, i) => {
      console.log(`    ${i + 1}. ${arg}`);
    });
  } else {
    console.log('    (none collected)');
  }
  console.log();

  // === Arguments Against ===
  console.log('  Arguments Against:');
  if (result.argumentsAgainst.length > 0) {
    result.argumentsAgainst.forEach((arg, i) => {
      console.log(`    ${i + 1}. ${arg}`);
    });
  } else {
    console.log('    (none collected)');
  }
  console.log();

  // === Audit ===
  // Vex checks: participation rate, cluster diversity,
  // single-cluster dominance, consensus strength, argument quality
  console.log('  Audit:');
  if (result.auditNotes && result.auditNotes.length > 0) {
    result.auditNotes.forEach((note) => console.log(`    ! ${note}`));
  } else {
    console.log('    All checks passed');
  }
  console.log();

  // === Cost Breakdown ===
  // Each agent costs ~$0.000007
  // Total = agents * cost_per_agent + API costs
  console.log('========================================');
  console.log('  COST & TIMING');
  console.log('========================================');
  console.log(`  Actual cost:  $${result.actualCost.toFixed(4)}`);
  console.log(`  Pipeline:     ${result.duration}ms`);
  console.log(`  Wall time:    ${wallTime}ms`);
  console.log(`  Cost/agent:   $${(result.actualCost / AGENT_COUNT).toFixed(7)}`);
  console.log();

  // === Errors ===
  // The pipeline handles failures gracefully — if any agent phase
  // fails or times out (60s limit), partial results are returned
  if (result.partial) {
    console.log('========================================');
    console.log('  WARNINGS (partial results)');
    console.log('========================================');
    result.errors.forEach((err) => {
      console.log(`  [${err.phase}] ${err.error}`);
    });
    console.log();
  }

  // === Raw JSON ===
  // Uncomment to see the full decision object:
  // console.log(JSON.stringify(result, null, 2));

  return result;
}

main().catch(console.error);
