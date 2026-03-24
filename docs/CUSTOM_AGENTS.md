# Custom Agents Guide

## Agent Interface

Every agent must implement:

```javascript
class MyAgent {
  constructor(options) {
    this.name = 'MyAgent';    // Agent name (used in logs)
    this.role = 'Custom';     // Agent role description
  }

  // Main method — name depends on the pipeline phase
  async execute(question, context) {
    return {
      // Phase-specific result fields
      cost: 0,  // Always include cost
    };
  }
}
```

The method name depends on which phase your agent replaces:

| Phase | Method | Signature |
|-------|--------|-----------|
| Research | `research(question)` | Returns `{ summary, sources, context, cost }` |
| Swarm | `swarm(question, research)` | Returns `{ argumentsFor, argumentsAgainst, clusters, votes, cost, ... }` |
| Audit | `audit(question, swarmResult)` | Returns `{ passed, notes, challenges, issues, confidenceAdjustment, cost }` |
| Synthesis | `synthesize(question, { research, swarmResult, audit })` | Returns `{ decision, confidence, reasoning, verdict, cost, ... }` |

---

## Lifecycle

1. **Constructor** — Called once when the Swarm is created. Receive configuration options.
2. **Execute** — Called once per debate. Receives the question and previous phase results.
3. **Return** — Must return an object with phase-specific fields plus `cost`.

There are no explicit lifecycle hooks (init, destroy). If your agent needs setup, do it in the constructor or lazily in the execute method.

---

## Example: Custom Research Agent

Replace Alba with an agent that uses a different search API:

```javascript
class WikiResearch {
  constructor() {
    this.name = 'WikiResearch';
    this.role = 'Research';
  }

  async research(question) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(question)}&format=json`;

    const response = await fetch(url);
    const data = await response.json();
    const results = data.query?.search || [];

    const sources = results.slice(0, 5).map((r) => ({
      title: r.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
      description: r.snippet.replace(/<[^>]+>/g, ''),
    }));

    return {
      summary: sources.map((s) => `${s.title}: ${s.description}`).join('\n'),
      sources,
      context: { query: question, resultCount: sources.length },
      cost: 0, // Wikipedia API is free
    };
  }
}

module.exports = { WikiResearch };
```

---

## Example: Custom Audit Agent

Add a stricter audit that requires 80% participation:

```javascript
class StrictAudit {
  constructor({ minParticipation = 0.8 } = {}) {
    this.name = 'StrictAudit';
    this.role = 'Audit';
    this.minParticipation = minParticipation;
  }

  async audit(question, swarmResult) {
    const issues = [];
    let confidenceAdjustment = 0;

    const total = swarmResult.votes?.total || 0;
    const expected = swarmResult.agentCount || 1;
    const participation = total / expected;

    if (participation < this.minParticipation) {
      issues.push({
        check: 'strict_participation',
        severity: 'critical',
        message: `Participation ${(participation * 100).toFixed(1)}% below ${this.minParticipation * 100}% threshold`,
      });
      confidenceAdjustment -= 30;
    }

    // Add your own checks here

    return {
      passed: issues.length === 0,
      notes: issues.map((i) => i.message),
      challenges: issues.filter((i) => i.severity === 'critical').map((i) => i.message),
      issues,
      confidenceAdjustment,
      cost: 0,
    };
  }
}

module.exports = { StrictAudit };
```

---

## Integrating with the Swarm

### Option 1: Modify swarm.js directly

Replace an agent in the constructor:

```javascript
// src/agents/swarm.js
const { WikiResearch } = require('./wiki-research');

class Swarm {
  constructor({ agents = 10000 } = {}) {
    this.alba = new WikiResearch();  // Replace Alba
    // ...
  }
}
```

### Option 2: Inject at runtime

```javascript
const { Swarm } = require('askelira/src/agents/swarm');
const { WikiResearch } = require('./wiki-research');

const swarm = new Swarm({ agents: 10000 });
swarm.alba = new WikiResearch(); // Override before debate

const result = await swarm.debate('Your question');
```

### Option 3: Add a new phase

Add a 5th phase in the `debate()` method:

```javascript
// After Phase 4, before return
const postProcess = await this._runPhase('PostProcess', () =>
  this.postProcessor.process(question, synthesis),
  { processed: false, cost: 0 },
  errors
);
totalCost += postProcess.cost || 0;
```

---

## Best Practices

1. **Always return `cost`** — Even if zero. The pipeline aggregates costs from all phases.

2. **Handle errors gracefully** — The `_runPhase` wrapper catches errors and uses the fallback, but your agent should handle expected failures internally.

3. **Keep agents stateless** — Don't store debate-specific state in class properties. Each `debate()` call should be independent.

4. **Respect timeouts** — The default timeout is 60 seconds per phase. Long-running operations should check elapsed time.

5. **Log with context** — Use `console.log` with a prefix for debugging:
   ```javascript
   console.log(`[${this.name}] Processing ${results.length} results`);
   ```

6. **Match the return shape** — Return objects that match the expected shape for the phase you're replacing. Missing fields cause downstream errors.

---

## Testing Custom Agents

Use the same test pattern as the built-in agents:

```javascript
const assert = require('assert');
const { WikiResearch } = require('../src/agents/wiki-research');

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    process.exit(1);
  }
}

await test('returns sources', async () => {
  // Mock fetch
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      query: { search: [{ title: 'AI', snippet: 'Artificial Intelligence' }] },
    }),
  });

  const agent = new WikiResearch();
  const result = await agent.research('What is AI?');

  assert.ok(result.sources.length > 0);
  assert.strictEqual(result.cost, 0);

  globalThis.fetch = original;
});
```

Run agent tests in isolation before integrating with the pipeline.
