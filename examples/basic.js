/**
 * AskElira 2.0 — Basic Usage Example
 *
 * Run: node examples/basic.js
 *
 * This script demonstrates the full swarm debate pipeline:
 * Alba (research) → David (debate) → Vex (audit) → Elira (synthesis)
 */

const { Swarm } = require('../src/agents/swarm');

async function main() {
  // Create a swarm with 100 agents (cheap for testing)
  const swarm = new Swarm({ agents: 100 });

  // Ask a question
  const question = 'Should I switch careers to AI?';
  console.log(`Question: ${question}\n`);

  // Run the 4-phase debate
  const result = await swarm.debate(question);

  // Print the decision
  console.log('--- Result ---');
  console.log(`Decision:   ${result.decision}`);
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Cost:       $${result.actualCost.toFixed(4)}`);
  console.log(`Duration:   ${result.duration}ms`);
  console.log(`Agents:     ${result.agentCount}`);

  // Print arguments
  if (result.argumentsFor.length > 0) {
    console.log('\nArguments For:');
    result.argumentsFor.forEach((arg) => console.log(`  + ${arg}`));
  }

  if (result.argumentsAgainst.length > 0) {
    console.log('\nArguments Against:');
    result.argumentsAgainst.forEach((arg) => console.log(`  - ${arg}`));
  }

  // Print audit notes
  if (result.auditNotes && result.auditNotes.length > 0) {
    console.log('\nAudit Notes:');
    result.auditNotes.forEach((note) => console.log(`  ! ${note}`));
  }

  // Check for partial results (agent failures)
  if (result.partial) {
    console.log('\nWarnings:');
    result.errors.forEach((err) => console.log(`  [${err.phase}] ${err.error}`));
  }

  return result;
}

main().catch(console.error);
