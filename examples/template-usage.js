/**
 * AskElira 2.0 — Template Usage Examples
 *
 * Run: node examples/template-usage.js
 *
 * Shows how to use the three built-in templates (trading, hiring, product)
 * programmatically, without the interactive CLI prompts.
 */

const { Swarm } = require('../src/agents/swarm');

// ---------------------------------------------------------------------------
// Helper: run a debate and print results
// ---------------------------------------------------------------------------

async function runDebate(label, question, agents) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`Question: ${question}`);
  console.log(`Agents:   ${agents}\n`);

  const swarm = new Swarm({ agents });
  const result = await swarm.debate(question);

  console.log(`Decision:   ${result.decision}`);
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Verdict:    ${result.confidence >= 70 ? 'GO' : result.confidence >= 40 ? 'CONDITIONAL' : 'NO-GO'}`);
  console.log(`Cost:       $${result.actualCost.toFixed(4)}`);
  console.log(`Duration:   ${(result.duration / 1000).toFixed(1)}s`);

  if (result.argumentsFor.length) {
    console.log('\nArguments FOR:');
    result.argumentsFor.forEach((a) => console.log(`  + ${a}`));
  }
  if (result.argumentsAgainst.length) {
    console.log('\nArguments AGAINST:');
    result.argumentsAgainst.forEach((a) => console.log(`  - ${a}`));
  }

  if (result.partial) {
    console.log('\nWarnings (partial result):');
    result.errors.forEach((e) => console.log(`  [${e.phase}] ${e.error}`));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Template 1: Trading Strategy Evaluator
// ---------------------------------------------------------------------------

async function tradingExample() {
  const strategy = 'FVG Retest';
  const market = 'MNQ futures';
  const agents = 10000;

  return runDebate(
    'TRADING — Strategy Evaluation',
    `Should I deploy the "${strategy}" strategy in ${market} markets?`,
    agents
  );
}

// ---------------------------------------------------------------------------
// Template 2: Hiring Decision Helper
// ---------------------------------------------------------------------------

async function hiringExample() {
  const role = 'Senior Backend Engineer';
  const team = 'Platform';
  const agents = 5000;

  return runDebate(
    'HIRING — Candidate Evaluation',
    `Should we hire the top candidate for the ${role} position on the ${team} team?`,
    agents
  );
}

// ---------------------------------------------------------------------------
// Template 3: Product Launch Evaluator
// ---------------------------------------------------------------------------

async function productExample() {
  const product = 'AskElira Desktop';
  const market = 'developer tools';
  const agents = 10000;

  return runDebate(
    'PRODUCT — Launch Decision',
    `Should we launch "${product}" targeting the ${market} market?`,
    agents
  );
}

// ---------------------------------------------------------------------------
// Run all three templates sequentially
// ---------------------------------------------------------------------------

async function main() {
  console.log('AskElira Template Usage Examples');
  console.log('Running three template-based debates back to back.\n');

  const results = {};

  results.trading = await tradingExample();
  results.hiring = await hiringExample();
  results.product = await productExample();

  // Summary table
  console.log(`\n${'='.repeat(60)}`);
  console.log('  SUMMARY');
  console.log(`${'='.repeat(60)}\n`);
  console.log(
    '  Template    Decision         Confidence  Cost'
  );
  console.log('  ' + '-'.repeat(54));

  for (const [name, r] of Object.entries(results)) {
    const dec = (r.decision || '').padEnd(16);
    const conf = `${r.confidence}%`.padEnd(12);
    const cost = `$${r.actualCost.toFixed(4)}`;
    console.log(`  ${name.padEnd(12)}${dec}${conf}${cost}`);
  }

  const totalCost = Object.values(results).reduce((sum, r) => sum + r.actualCost, 0);
  console.log(`\n  Total cost: $${totalCost.toFixed(4)}`);
}

main().catch(console.error);
