/**
 * AskElira 2.0 — Agent Unit Tests
 *
 * Run: node test/agents.test.js
 *
 * Tests Alba, David, Vex, and Elira agents with mocked API responses.
 */

const assert = require('assert');
const { Alba } = require('../src/agents/alba');
const { David } = require('../src/agents/david');
const { Vex } = require('../src/agents/vex');
const { Elira } = require('../src/agents/elira');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockFetch(responseBody, status = 200) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => responseBody,
  });
  return () => { globalThis.fetch = original; };
}

// ---------------------------------------------------------------------------
// Alba Tests
// ---------------------------------------------------------------------------

async function albaTests() {
  console.log('\nAlba (Research Agent)');

  await test('returns fallback when BRAVE_API_KEY is not set', async () => {
    const original = process.env.BRAVE_API_KEY;
    delete process.env.BRAVE_API_KEY;

    const alba = new Alba();
    const result = await alba.research('test question');

    assert.strictEqual(result.sources.length, 0);
    assert.strictEqual(result.cost, 0);
    assert.ok(result.summary.includes('not configured'));

    if (original) process.env.BRAVE_API_KEY = original;
  });

  await test('parses Brave API response correctly', async () => {
    const original = process.env.BRAVE_API_KEY;
    process.env.BRAVE_API_KEY = 'test-key';

    const restore = mockFetch({
      web: {
        results: [
          { title: 'Result 1', url: 'https://example.com/1', description: 'Desc 1' },
          { title: 'Result 2', url: 'https://example.com/2', description: 'Desc 2' },
        ],
      },
    });

    const alba = new Alba();
    const result = await alba.research('test question');

    assert.strictEqual(result.sources.length, 2);
    assert.strictEqual(result.sources[0].title, 'Result 1');
    assert.strictEqual(result.sources[1].url, 'https://example.com/2');
    assert.strictEqual(result.context.query, 'test question');
    assert.strictEqual(result.cost, 0);
    assert.ok(result.summary.includes('Result 1'));

    restore();
    if (original) process.env.BRAVE_API_KEY = original;
    else delete process.env.BRAVE_API_KEY;
  });

  await test('throws on API error', async () => {
    const original = process.env.BRAVE_API_KEY;
    process.env.BRAVE_API_KEY = 'test-key';

    const restore = mockFetch({}, 429);

    const alba = new Alba();
    await assert.rejects(
      () => alba.research('test'),
      (err) => err.message.includes('Brave API error')
    );

    restore();
    if (original) process.env.BRAVE_API_KEY = original;
    else delete process.env.BRAVE_API_KEY;
  });

  await test('handles empty results gracefully', async () => {
    const original = process.env.BRAVE_API_KEY;
    process.env.BRAVE_API_KEY = 'test-key';

    const restore = mockFetch({ web: { results: [] } });

    const alba = new Alba();
    const result = await alba.research('obscure query');

    assert.strictEqual(result.sources.length, 0);
    assert.strictEqual(result.summary, 'No results found');

    restore();
    if (original) process.env.BRAVE_API_KEY = original;
    else delete process.env.BRAVE_API_KEY;
  });
}

// ---------------------------------------------------------------------------
// David Tests
// ---------------------------------------------------------------------------

async function davidTests() {
  console.log('\nDavid (Swarm Agent)');

  await test('creates swarm and returns structured result', async () => {
    let callCount = 0;
    const original = globalThis.fetch;
    globalThis.fetch = async (url) => {
      callCount++;
      if (callCount === 1) {
        // _createSwarm
        return { ok: true, status: 200, json: async () => ({ swarmId: 'swarm-123' }) };
      }
      // _submitDebate
      return {
        ok: true, status: 200,
        json: async () => ({
          votes: [
            { stance: 'for', cluster: 'growth', argument: 'Good market fit' },
            { stance: 'for', cluster: 'growth', argument: 'Strong ROI' },
            { stance: 'against', cluster: 'risk', argument: 'High volatility' },
          ],
        }),
      };
    };

    const david = new David({ agents: 100 });
    const result = await david.swarm('test?', { summary: '', sources: [] });

    assert.strictEqual(result.votes.for, 2);
    assert.strictEqual(result.votes.against, 1);
    assert.strictEqual(result.votes.total, 3);
    assert.strictEqual(result.consensus, 'for');
    assert.ok(result.consensusStrength > 0);
    assert.strictEqual(result.agentCount, 100);
    assert.ok(result.cost > 0);
    assert.ok(result.argumentsFor.length > 0);
    assert.ok(result.argumentsAgainst.length > 0);

    globalThis.fetch = original;
  });

  await test('throws when gateway returns error', async () => {
    const restore = mockFetch({}, 503);

    const david = new David({ agents: 50 });
    await assert.rejects(
      () => david.swarm('test?', { summary: '', sources: [] }),
      (err) => err.message.includes('Failed to create swarm')
    );

    restore();
  });

  await test('clusters votes correctly', () => {
    const david = new David();
    const votes = [
      { stance: 'for', cluster: 'a', argument: 'Arg 1' },
      { stance: 'for', cluster: 'a', argument: 'Arg 2' },
      { stance: 'against', cluster: 'b', argument: 'Arg 3' },
      { stance: 'for', cluster: 'c', argument: 'Arg 4' },
    ];

    const clusters = david._clusterVotes(votes);

    assert.strictEqual(clusters.length, 3);
    // Sorted by voteCount descending
    assert.strictEqual(clusters[0].id, 'a');
    assert.strictEqual(clusters[0].voteCount, 2);
    assert.strictEqual(clusters[1].voteCount, 1);
  });

  await test('handles empty votes array', () => {
    const david = new David();
    const clusters = david._clusterVotes([]);
    assert.strictEqual(clusters.length, 0);
  });

  await test('calculates cost based on agent count', async () => {
    let callCount = 0;
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) return { ok: true, json: async () => ({ swarmId: 's1' }) };
      return { ok: true, json: async () => ({ votes: [] }) };
    };

    const david = new David({ agents: 10000 });
    const result = await david.swarm('q?', { summary: '', sources: [] });

    assert.strictEqual(result.cost, 10000 * 0.000007);

    globalThis.fetch = original;
  });
}

// ---------------------------------------------------------------------------
// Vex Tests
// ---------------------------------------------------------------------------

async function vexTests() {
  console.log('\nVex (Audit Agent)');

  const goodSwarm = {
    votes: { for: 6000, against: 4000, total: 10000 },
    agentCount: 10000,
    clusters: [
      { id: 'a', stance: 'for', voteCount: 4000, summary: 'Growth' },
      { id: 'b', stance: 'against', voteCount: 3000, summary: 'Risk' },
      { id: 'c', stance: 'for', voteCount: 2000, summary: 'Innovation' },
      { id: 'd', stance: 'against', voteCount: 1000, summary: 'Cost' },
    ],
    consensusStrength: 0.2,
    argumentsFor: ['Growth', 'Innovation'],
    argumentsAgainst: ['Risk', 'Cost'],
  };

  await test('passes all checks on valid swarm', async () => {
    const vex = new Vex();
    const result = await vex.audit('question?', goodSwarm);

    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.issues.length, 0);
    assert.strictEqual(result.confidenceAdjustment, 0);
  });

  await test('fails on low participation', async () => {
    const vex = new Vex();
    const result = await vex.audit('question?', {
      ...goodSwarm,
      votes: { for: 200, against: 100, total: 300 },
    });

    assert.strictEqual(result.passed, false);
    assert.ok(result.notes.some((n) => n.includes('participation')));
    assert.ok(result.confidenceAdjustment < 0);
  });

  await test('fails on insufficient clusters', async () => {
    const vex = new Vex();
    const result = await vex.audit('question?', {
      ...goodSwarm,
      clusters: [{ id: 'a', stance: 'for', voteCount: 10000 }],
    });

    assert.strictEqual(result.passed, false);
    assert.ok(result.notes.some((n) => n.includes('cluster')));
  });

  await test('fails on single-cluster dominance', async () => {
    const vex = new Vex();
    const result = await vex.audit('question?', {
      ...goodSwarm,
      clusters: [
        { id: 'a', stance: 'for', voteCount: 9800 },
        { id: 'b', stance: 'against', voteCount: 200 },
      ],
    });

    assert.strictEqual(result.passed, false);
    assert.ok(result.notes.some((n) => n.includes('dominance')));
  });

  await test('fails on weak consensus', async () => {
    const vex = new Vex();
    const result = await vex.audit('question?', {
      ...goodSwarm,
      consensusStrength: 0.01,
    });

    assert.strictEqual(result.passed, false);
    assert.ok(result.notes.some((n) => n.includes('consensus')));
  });

  await test('fails on no arguments', async () => {
    const vex = new Vex();
    const result = await vex.audit('question?', {
      ...goodSwarm,
      argumentsFor: [],
      argumentsAgainst: [],
    });

    assert.strictEqual(result.passed, false);
    assert.ok(result.notes.some((n) => n.includes('arguments')));
  });

  await test('accumulates penalties from multiple failures', async () => {
    const vex = new Vex();
    const result = await vex.audit('question?', {
      votes: { for: 100, against: 50, total: 150 },
      agentCount: 10000,
      clusters: [],
      consensusStrength: 0.01,
      argumentsFor: [],
      argumentsAgainst: [],
    });

    assert.strictEqual(result.passed, false);
    assert.ok(result.issues.length >= 3);
    assert.ok(result.confidenceAdjustment <= -40);
  });
}

// ---------------------------------------------------------------------------
// Elira Tests
// ---------------------------------------------------------------------------

async function eliraTests() {
  console.log('\nElira (Synthesis Agent)');

  const baseResearch = { summary: 'Research', sources: [{ title: 'S1' }], cost: 0 };
  const baseSwarm = {
    consensus: 'for',
    consensusStrength: 0.3,
    votes: { for: 7000, against: 3000, total: 10000 },
    clusters: [
      { id: 'a', stance: 'for', voteCount: 5000 },
      { id: 'b', stance: 'against', voteCount: 3000 },
      { id: 'c', stance: 'for', voteCount: 2000 },
    ],
    argumentsFor: ['Growth opportunity', 'Market fit'],
    argumentsAgainst: ['High risk'],
    cost: 0.07,
  };
  const passingAudit = { passed: true, notes: [], challenges: [], confidenceAdjustment: 0, cost: 0 };

  await test('synthesizes YES decision with high confidence', async () => {
    const elira = new Elira();
    const result = await elira.synthesize('question?', {
      research: baseResearch,
      swarmResult: baseSwarm,
      audit: passingAudit,
    });

    assert.strictEqual(result.decision, 'yes');
    assert.ok(result.confidence >= 70);
    assert.strictEqual(result.verdict, 'GO');
    assert.ok(result.reasoning.length > 0);
    assert.strictEqual(result.auditPassed, true);
  });

  await test('synthesizes NO decision when consensus is against', async () => {
    const elira = new Elira();
    const result = await elira.synthesize('question?', {
      research: baseResearch,
      swarmResult: { ...baseSwarm, consensus: 'against' },
      audit: passingAudit,
    });

    assert.strictEqual(result.decision, 'no');
  });

  await test('returns inconclusive when no consensus', async () => {
    const elira = new Elira();
    const result = await elira.synthesize('question?', {
      research: baseResearch,
      swarmResult: { ...baseSwarm, consensus: null },
      audit: passingAudit,
    });

    assert.strictEqual(result.decision, 'inconclusive');
  });

  await test('applies audit penalty to confidence', async () => {
    const elira = new Elira();
    const penaltyAudit = { ...passingAudit, passed: false, confidenceAdjustment: -30, notes: ['Issue'] };

    const clean = await elira.synthesize('question?', {
      research: baseResearch,
      swarmResult: baseSwarm,
      audit: passingAudit,
    });

    const penalized = await elira.synthesize('question?', {
      research: baseResearch,
      swarmResult: baseSwarm,
      audit: penaltyAudit,
    });

    assert.ok(penalized.confidence < clean.confidence);
  });

  await test('returns insufficient_data on critical audit failures with low confidence', async () => {
    const elira = new Elira();
    const result = await elira.synthesize('question?', {
      research: baseResearch,
      swarmResult: {
        ...baseSwarm,
        consensus: 'for',
        consensusStrength: 0,
        votes: { for: 5100, against: 4900, total: 10000 },
      },
      audit: {
        passed: false,
        notes: ['Critical issue'],
        challenges: ['Critical failure'],
        confidenceAdjustment: -60,
        cost: 0,
      },
    });

    assert.strictEqual(result.decision, 'insufficient_data');
  });

  await test('clamps confidence to 0-100 range', async () => {
    const elira = new Elira();

    const result = await elira.synthesize('question?', {
      research: baseResearch,
      swarmResult: {
        ...baseSwarm,
        votes: { for: 0, against: 0, total: 0 },
        consensusStrength: 0,
      },
      audit: { ...passingAudit, confidenceAdjustment: -50 },
    });

    assert.ok(result.confidence >= 0);
    assert.ok(result.confidence <= 100);
  });

  await test('verdict tiers: GO >= 70, CONDITIONAL >= 40, NO-GO < 40', async () => {
    const elira = new Elira();

    // High confidence -> GO
    const go = await elira.synthesize('q?', {
      research: baseResearch,
      swarmResult: baseSwarm,
      audit: passingAudit,
    });
    assert.strictEqual(go.verdict, 'GO');

    // Moderate confidence -> CONDITIONAL
    const conditional = await elira.synthesize('q?', {
      research: baseResearch,
      swarmResult: baseSwarm,
      audit: { ...passingAudit, confidenceAdjustment: -25 },
    });
    assert.ok(
      conditional.verdict === 'CONDITIONAL' || conditional.verdict === 'GO',
      `Expected CONDITIONAL or GO, got ${conditional.verdict}`
    );

    // Very low confidence -> NO-GO
    const nogo = await elira.synthesize('q?', {
      research: baseResearch,
      swarmResult: {
        ...baseSwarm,
        votes: { for: 0, against: 0, total: 0 },
        consensusStrength: 0,
      },
      audit: { ...passingAudit, confidenceAdjustment: -50 },
    });
    assert.strictEqual(nogo.verdict, 'NO-GO');
  });

  await test('includes reasoning from all phases', async () => {
    const elira = new Elira();
    const result = await elira.synthesize('question?', {
      research: baseResearch,
      swarmResult: baseSwarm,
      audit: passingAudit,
    });

    assert.ok(result.reasoning.includes('Research'));
    assert.ok(result.reasoning.includes('Swarm'));
    assert.ok(result.reasoning.includes('Clusters'));
    assert.ok(result.reasoning.includes('Audit'));
  });

  await test('aggregates cost from all phases', async () => {
    const elira = new Elira();
    const result = await elira.synthesize('question?', {
      research: { ...baseResearch, cost: 0.01 },
      swarmResult: { ...baseSwarm, cost: 0.07 },
      audit: { ...passingAudit, cost: 0.005 },
    });

    assert.strictEqual(result.cost, 0.085);
  });
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

async function main() {
  console.log('AskElira Agent Unit Tests\n');

  await albaTests();
  await davidTests();
  await vexTests();
  await eliraTests();

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
