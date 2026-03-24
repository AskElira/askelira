const assert = require('assert');
const { Alba } = require('../src/agents/alba');
const { David } = require('../src/agents/david');
const { Vex } = require('../src/agents/vex');
const { Elira } = require('../src/agents/elira');
const { Swarm } = require('../src/agents/swarm');

const QUESTION = 'Should we adopt TypeScript for our backend?';
const TIMEOUT = 30000;

function withTimeout(fn, ms = TIMEOUT) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Test timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// Phase 1: Alba
async function testAlbaResearch() {
  const alba = new Alba();
  const result = await alba.research(QUESTION);

  assert.ok(result, 'Alba should return a result');
  assert.strictEqual(typeof result.summary, 'string', 'summary should be a string');
  assert.ok(result.summary.length > 0, 'summary should not be empty');
  assert.ok(Array.isArray(result.sources), 'sources should be an array');
  assert.strictEqual(typeof result.cost, 'number', 'cost should be a number');

  console.log('PASS: Alba research');
  console.log(`  Summary length: ${result.summary.length} chars`);
  console.log(`  Sources: ${result.sources.length}`);
  return result;
}

// Phase 2: David
async function testDavidSwarm(research) {
  const david = new David({ agents: 100 });
  const result = await david.swarm(QUESTION, research);

  assert.ok(result, 'David should return a result');
  assert.ok(Array.isArray(result.argumentsFor), 'argumentsFor should be an array');
  assert.ok(Array.isArray(result.argumentsAgainst), 'argumentsAgainst should be an array');
  assert.ok(Array.isArray(result.clusters), 'clusters should be an array');
  assert.ok(['for', 'against', null].includes(result.consensus), 'consensus should be for/against/null');
  assert.strictEqual(typeof result.consensusStrength, 'number', 'consensusStrength should be a number');
  assert.ok(result.votes, 'votes should exist');
  assert.strictEqual(typeof result.votes.for, 'number', 'votes.for should be a number');
  assert.strictEqual(typeof result.votes.against, 'number', 'votes.against should be a number');
  assert.strictEqual(typeof result.votes.total, 'number', 'votes.total should be a number');
  assert.strictEqual(result.agentCount, 100, 'agentCount should be 100');
  assert.strictEqual(typeof result.cost, 'number', 'cost should be a number');
  assert.strictEqual(typeof result.duration, 'number', 'duration should be a number');

  console.log('PASS: David swarm');
  console.log(`  Consensus: ${result.consensus}`);
  console.log(`  Clusters: ${result.clusters.length}`);
  console.log(`  Votes: ${result.votes.for} for / ${result.votes.against} against`);
  return result;
}

// Phase 3: Vex
async function testVexAudit(swarmResult) {
  const vex = new Vex();
  const result = await vex.audit(QUESTION, swarmResult);

  assert.ok(result, 'Vex should return a result');
  assert.strictEqual(typeof result.passed, 'boolean', 'passed should be a boolean');
  assert.ok(Array.isArray(result.notes), 'notes should be an array');
  assert.ok(Array.isArray(result.challenges), 'challenges should be an array');
  assert.ok(Array.isArray(result.issues), 'issues should be an array');
  assert.strictEqual(typeof result.confidenceAdjustment, 'number', 'confidenceAdjustment should be a number');
  assert.strictEqual(typeof result.cost, 'number', 'cost should be a number');

  // Verify issue structure
  for (const issue of result.issues) {
    assert.ok(issue.check, 'issue should have a check name');
    assert.ok(['critical', 'warning'].includes(issue.severity), 'issue severity should be critical or warning');
    assert.ok(issue.message, 'issue should have a message');
  }

  console.log('PASS: Vex audit');
  console.log(`  Passed: ${result.passed}`);
  console.log(`  Issues: ${result.issues.length}`);
  console.log(`  Confidence adjustment: ${result.confidenceAdjustment}`);
  return result;
}

// Phase 4: Elira
async function testEliraSynthesis(research, swarmResult, audit) {
  const elira = new Elira();
  const result = await elira.synthesize(QUESTION, { research, swarmResult, audit });

  assert.ok(result, 'Elira should return a result');
  assert.strictEqual(typeof result.decision, 'string', 'decision should be a string');
  assert.ok(['yes', 'no', 'inconclusive', 'insufficient_data'].includes(result.decision), 'decision should be a valid value');
  assert.strictEqual(typeof result.confidence, 'number', 'confidence should be a number');
  assert.ok(result.confidence >= 0 && result.confidence <= 100, 'confidence should be 0-100');
  assert.ok(['GO', 'CONDITIONAL', 'NO-GO'].includes(result.verdict), 'verdict should be GO/CONDITIONAL/NO-GO');
  assert.strictEqual(typeof result.reasoning, 'string', 'reasoning should be a string');
  assert.ok(result.reasoning.length > 0, 'reasoning should not be empty');
  assert.ok(Array.isArray(result.argumentsFor), 'argumentsFor should be an array');
  assert.ok(Array.isArray(result.argumentsAgainst), 'argumentsAgainst should be an array');
  assert.strictEqual(typeof result.auditPassed, 'boolean', 'auditPassed should be a boolean');
  assert.strictEqual(typeof result.cost, 'number', 'cost should be a number');

  console.log('PASS: Elira synthesis');
  console.log(`  Decision: ${result.decision}`);
  console.log(`  Confidence: ${result.confidence}%`);
  console.log(`  Verdict: ${result.verdict}`);
  console.log(`  Reasoning: ${result.reasoning}`);
  return result;
}

// Full end-to-end
async function testFullPipeline() {
  const swarm = new Swarm({ agents: 100 });
  const result = await swarm.debate(QUESTION);

  assert.ok(result, 'Swarm.debate should return a result');
  assert.strictEqual(result.question, QUESTION, 'question should match');
  assert.strictEqual(typeof result.decision, 'string', 'decision should be a string');
  assert.strictEqual(typeof result.confidence, 'number', 'confidence should be a number');
  assert.ok(result.confidence >= 0 && result.confidence <= 100, 'confidence should be 0-100');
  assert.ok(Array.isArray(result.argumentsFor), 'argumentsFor should be an array');
  assert.ok(Array.isArray(result.argumentsAgainst), 'argumentsAgainst should be an array');
  assert.strictEqual(typeof result.actualCost, 'number', 'actualCost should be a number');
  assert.strictEqual(result.agentCount, 100, 'agentCount should be 100');
  assert.strictEqual(typeof result.duration, 'number', 'duration should be a number');
  assert.ok(result.timestamp, 'timestamp should exist');

  console.log('PASS: Full pipeline end-to-end');
  console.log(`  Decision: ${result.decision}`);
  console.log(`  Confidence: ${result.confidence}%`);
  console.log(`  Cost: $${result.actualCost.toFixed(4)}`);
  console.log(`  Duration: ${result.duration}ms`);
  return result;
}

async function runTests() {
  console.log('=== Integration Tests ===\n');
  let passed = 0;
  let failed = 0;

  // Phase-by-phase tests
  try {
    const research = await withTimeout(testAlbaResearch);
    passed++;

    const swarmResult = await withTimeout(() => testDavidSwarm(research));
    passed++;

    const audit = await withTimeout(() => testVexAudit(swarmResult));
    passed++;

    await withTimeout(() => testEliraSynthesis(research, swarmResult, audit));
    passed++;
  } catch (err) {
    failed++;
    console.error(`FAIL (phase test): ${err.message}`);
  }

  // End-to-end test
  try {
    await withTimeout(testFullPipeline);
    passed++;
  } catch (err) {
    failed++;
    console.error(`FAIL (end-to-end): ${err.message}`);
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

runTests();
