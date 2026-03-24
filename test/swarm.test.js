const assert = require('assert');
const { Swarm } = require('../src/agents/swarm');

async function testSwarmCreation() {
  const swarm = new Swarm({ agents: 100 });
  assert.ok(swarm, 'Swarm instance should exist');
  assert.strictEqual(swarm.agentCount, 100, 'Agent count should be 100');
  console.log('PASS: swarm creation');
}

async function testSwarmDebate() {
  const swarm = new Swarm({ agents: 100 });
  const result = await swarm.debate('Should I learn TypeScript?');

  // Verify result structure
  assert.ok(result, 'Result should exist');
  assert.strictEqual(typeof result.decision, 'string', 'decision should be a string');
  assert.strictEqual(typeof result.confidence, 'number', 'confidence should be a number');
  assert.ok(result.confidence >= 0 && result.confidence <= 100, 'confidence should be 0-100');
  assert.ok(Array.isArray(result.argumentsFor), 'argumentsFor should be an array');
  assert.ok(Array.isArray(result.argumentsAgainst), 'argumentsAgainst should be an array');
  assert.strictEqual(typeof result.actualCost, 'number', 'actualCost should be a number');
  assert.strictEqual(result.agentCount, 100, 'agentCount should match');
  assert.strictEqual(typeof result.duration, 'number', 'duration should be a number');
  assert.ok(result.timestamp, 'timestamp should exist');
  assert.strictEqual(result.question, 'Should I learn TypeScript?', 'question should match');

  console.log('PASS: swarm debate');
  console.log(`  Decision: ${result.decision}`);
  console.log(`  Confidence: ${result.confidence}%`);
  console.log(`  Cost: $${result.actualCost.toFixed(4)}`);
  console.log(`  Duration: ${result.duration}ms`);
}

async function testSwarmDefaults() {
  const swarm = new Swarm();
  assert.strictEqual(swarm.agentCount, 10000, 'Default agent count should be 10000');
  console.log('PASS: swarm defaults');
}

async function runTests() {
  console.log('=== Swarm Tests ===\n');

  try {
    await testSwarmCreation();
    await testSwarmDefaults();
    await testSwarmDebate();
    console.log('\nAll tests passed!');
  } catch (err) {
    console.error(`\nFAIL: ${err.message}`);
    process.exit(1);
  }
}

runTests();
