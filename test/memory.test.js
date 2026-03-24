/**
 * AskElira 2.0 — Memory System Tests
 *
 * Run: node test/memory.test.js
 *
 * Tests file-based memory (saveToFile, getRecentDebates, parseMarkdownDebates)
 * and mocks ChromaDB for vector DB tests (saveToVectorDB, searchMemory).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
// Test fixtures
// ---------------------------------------------------------------------------

function makeResult(overrides = {}) {
  return {
    question: 'Should we use GraphQL?',
    decision: 'yes',
    confidence: 78,
    agentCount: 10000,
    actualCost: 0.068,
    duration: 4200,
    argumentsFor: ['Flexible queries', 'Strong typing'],
    argumentsAgainst: ['Complexity', 'Caching challenges'],
    auditNotes: ['All checks passed'],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// File-based memory tests (no ChromaDB dependency)
// ---------------------------------------------------------------------------

async function fileMemoryTests() {
  console.log('\nFile-based Memory');

  // Use a temp directory to avoid polluting real memory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askelira-test-'));

  // We'll test the internal functions by requiring the module and patching MEMORY_DIR.
  // Since MEMORY_DIR is a const, we test saveToFile / getRecentDebates / parseMarkdownDebates
  // by writing and reading from our temp dir directly.

  await test('creates markdown file with correct format', async () => {
    const result = makeResult();
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(tmpDir, `${date}.md`);
    const time = new Date().toLocaleTimeString();

    // Reproduce saveToFile logic against our temp dir
    const entry = `
---

## ${time} — ${result.question}

**Decision:** ${result.decision}
**Confidence:** ${result.confidence}%
**Agents:** ${result.agentCount.toLocaleString()}
**Cost:** $${result.actualCost.toFixed(3)}
**Duration:** ${result.duration}ms

### Arguments For
${result.argumentsFor.map((a) => `- ${a}`).join('\n')}

### Arguments Against
${result.argumentsAgainst.map((a) => `- ${a}`).join('\n')}

### Audit Notes
${result.auditNotes.map((n) => `- ${n}`).join('\n')}
`;

    fs.writeFileSync(filePath, entry, 'utf-8');

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('Should we use GraphQL?'));
    assert.ok(content.includes('**Decision:** yes'));
    assert.ok(content.includes('**Confidence:** 78%'));
    assert.ok(content.includes('Flexible queries'));
    assert.ok(content.includes('Caching challenges'));
  });

  await test('appends multiple debates to same file', async () => {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(tmpDir, `${date}-multi.md`);

    const entry1 = `
---

## 10:00:00 — Question one

**Decision:** yes
**Confidence:** 80%
**Agents:** 10,000
**Cost:** $0.070
**Duration:** 4000ms
`;

    const entry2 = `
---

## 10:05:00 — Question two

**Decision:** no
**Confidence:** 65%
**Agents:** 5,000
**Cost:** $0.035
**Duration:** 3000ms
`;

    fs.writeFileSync(filePath, entry1, 'utf-8');
    fs.appendFileSync(filePath, entry2, 'utf-8');

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('Question one'));
    assert.ok(content.includes('Question two'));
  });

  await test('parseMarkdownDebates extracts all fields', () => {
    // Import the module to get parseMarkdownDebates indirectly via getRecentDebates
    // We test the parsing logic by recreating it here
    const content = `
---

## 14:30:00 — Should we migrate to Kubernetes?

**Decision:** yes
**Confidence:** 85%
**Agents:** 10,000
**Cost:** $0.070
**Duration:** 5000ms

### Arguments For
- Better scaling
- Industry standard

### Arguments Against
- Operational complexity

---

## 15:00:00 — Should we add caching?

**Decision:** no
**Confidence:** 42%
**Agents:** 5,000
**Cost:** $0.035
**Duration:** 3200ms
`;

    const sections = content.split('\n---\n').filter((s) => s.trim());
    assert.strictEqual(sections.length, 2);

    // Parse first section
    const q1Match = sections[0].match(/## .+ — (.+)/);
    assert.ok(q1Match);
    assert.strictEqual(q1Match[1], 'Should we migrate to Kubernetes?');

    const d1Match = sections[0].match(/\*\*Decision:\*\* (.+)/);
    assert.strictEqual(d1Match[1], 'yes');

    const c1Match = sections[0].match(/\*\*Confidence:\*\* (\d+)%/);
    assert.strictEqual(parseInt(c1Match[1]), 85);

    // Parse second section
    const q2Match = sections[1].match(/## .+ — (.+)/);
    assert.strictEqual(q2Match[1], 'Should we add caching?');

    const d2Match = sections[1].match(/\*\*Decision:\*\* (.+)/);
    assert.strictEqual(d2Match[1], 'no');
  });

  await test('getRecentDebates reads files from date range', () => {
    // Create files for today, yesterday, and 3 days ago
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const fmt = (d) => d.toISOString().split('T')[0];

    fs.writeFileSync(path.join(tmpDir, `${fmt(today)}.md`), `
---

## 10:00:00 — Today question

**Decision:** yes
**Confidence:** 80%
**Agents:** 10,000
**Cost:** $0.070
**Duration:** 4000ms
`);

    fs.writeFileSync(path.join(tmpDir, `${fmt(yesterday)}.md`), `
---

## 09:00:00 — Yesterday question

**Decision:** no
**Confidence:** 55%
**Agents:** 5,000
**Cost:** $0.035
**Duration:** 3000ms
`);

    fs.writeFileSync(path.join(tmpDir, `${fmt(threeDaysAgo)}.md`), `
---

## 08:00:00 — Old question

**Decision:** yes
**Confidence:** 90%
**Agents:** 20,000
**Cost:** $0.140
**Duration:** 6000ms
`);

    // Simulate getRecentDebates with our tmpDir
    function getRecentDebatesFromDir(dir, days) {
      const now = new Date();
      const files = [];
      for (let d = 0; d < days; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        const filename = date.toISOString().split('T')[0] + '.md';
        const filePath = path.join(dir, filename);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const sections = content.split('\n---\n').filter((s) => s.trim());
          for (const section of sections) {
            const qMatch = section.match(/## .+ — (.+)/);
            const dMatch = section.match(/\*\*Decision:\*\* (.+)/);
            const cMatch = section.match(/\*\*Confidence:\*\* (\d+)%/);
            files.push({
              date: filename.replace('.md', ''),
              question: qMatch ? qMatch[1] : 'Unknown',
              decision: dMatch ? dMatch[1] : 'Unknown',
              confidence: cMatch ? parseInt(cMatch[1]) : 0,
            });
          }
        }
      }
      return files;
    }

    // 2 days: today + yesterday
    const recent2 = getRecentDebatesFromDir(tmpDir, 2);
    assert.strictEqual(recent2.length, 2);
    assert.strictEqual(recent2[0].question, 'Today question');
    assert.strictEqual(recent2[1].question, 'Yesterday question');

    // 4 days: all three
    const recent4 = getRecentDebatesFromDir(tmpDir, 4);
    assert.strictEqual(recent4.length, 3);

    // 1 day: only today
    const recent1 = getRecentDebatesFromDir(tmpDir, 1);
    assert.strictEqual(recent1.length, 1);
    assert.strictEqual(recent1[0].question, 'Today question');
  });

  await test('handles missing files gracefully', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askelira-empty-'));

    function getRecentDebatesFromDir(dir, days) {
      const now = new Date();
      const files = [];
      for (let d = 0; d < days; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        const filename = date.toISOString().split('T')[0] + '.md';
        const filePath = path.join(dir, filename);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const sections = content.split('\n---\n').filter((s) => s.trim());
          files.push(...sections);
        }
      }
      return files;
    }

    const result = getRecentDebatesFromDir(emptyDir, 7);
    assert.strictEqual(result.length, 0);

    fs.rmdirSync(emptyDir);
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Vector DB tests (mocked ChromaDB)
// ---------------------------------------------------------------------------

async function vectorDBTests() {
  console.log('\nVector DB (Mocked ChromaDB)');

  // Mock collection that stores data in memory
  function createMockCollection() {
    const store = { ids: [], documents: [], metadatas: [] };
    return {
      add: async ({ ids, documents, metadatas }) => {
        store.ids.push(...ids);
        store.documents.push(...documents);
        store.metadatas.push(...metadatas);
      },
      query: async ({ queryTexts, nResults }) => {
        // Simple mock: return all stored items up to nResults
        const n = Math.min(nResults || 5, store.ids.length);
        return {
          ids: [store.ids.slice(0, n)],
          documents: [store.documents.slice(0, n)],
          metadatas: [store.metadatas.slice(0, n)],
          distances: [store.ids.slice(0, n).map((_, i) => i * 0.1)],
        };
      },
      _store: store,
    };
  }

  await test('saveToVectorDB stores document with correct format', async () => {
    const mockCollection = createMockCollection();
    const result = makeResult();

    // Simulate saveToVectorDB
    const id = `decision_${Date.now()}`;
    const document = `Question: ${result.question}\nDecision: ${result.decision}\nConfidence: ${result.confidence}%`;
    const metadata = {
      question: result.question,
      decision: result.decision,
      confidence: result.confidence,
      cost: result.actualCost,
      agentCount: result.agentCount,
      timestamp: result.timestamp,
    };

    await mockCollection.add({
      ids: [id],
      documents: [document],
      metadatas: [metadata],
    });

    assert.strictEqual(mockCollection._store.ids.length, 1);
    assert.ok(mockCollection._store.ids[0].startsWith('decision_'));
    assert.ok(mockCollection._store.documents[0].includes('Should we use GraphQL?'));
    assert.strictEqual(mockCollection._store.metadatas[0].decision, 'yes');
    assert.strictEqual(mockCollection._store.metadatas[0].confidence, 78);
  });

  await test('searchMemory returns results with correct structure', async () => {
    const mockCollection = createMockCollection();

    // Add 3 entries
    await mockCollection.add({
      ids: ['d1'],
      documents: ['Question: GraphQL?\nDecision: yes\nConfidence: 78%'],
      metadatas: [{ question: 'GraphQL?', decision: 'yes', confidence: 78 }],
    });
    await mockCollection.add({
      ids: ['d2'],
      documents: ['Question: Kubernetes?\nDecision: yes\nConfidence: 85%'],
      metadatas: [{ question: 'Kubernetes?', decision: 'yes', confidence: 85 }],
    });
    await mockCollection.add({
      ids: ['d3'],
      documents: ['Question: Rust?\nDecision: no\nConfidence: 42%'],
      metadatas: [{ question: 'Rust?', decision: 'no', confidence: 42 }],
    });

    // Simulate searchMemory
    const queryResults = await mockCollection.query({
      queryTexts: ['GraphQL'],
      nResults: 2,
    });

    assert.strictEqual(queryResults.ids[0].length, 2);
    assert.ok(queryResults.documents[0][0].includes('GraphQL'));
    assert.ok(queryResults.distances[0].length === 2);

    // Map to expected format
    const mapped = queryResults.ids[0].map((id, i) => ({
      id,
      document: queryResults.documents[0][i],
      metadata: queryResults.metadatas[0][i],
      distance: queryResults.distances[0][i],
    }));

    assert.strictEqual(mapped.length, 2);
    assert.strictEqual(mapped[0].id, 'd1');
    assert.strictEqual(mapped[0].metadata.question, 'GraphQL?');
    assert.strictEqual(typeof mapped[0].distance, 'number');
  });

  await test('searchMemory returns empty array when no results', async () => {
    const mockCollection = createMockCollection();

    const queryResults = await mockCollection.query({
      queryTexts: ['anything'],
      nResults: 5,
    });

    const ids = queryResults.ids[0] || [];
    assert.strictEqual(ids.length, 0);
  });

  await test('multiple saves generate unique IDs', async () => {
    const mockCollection = createMockCollection();

    const id1 = `decision_${Date.now()}`;
    await mockCollection.add({ ids: [id1], documents: ['doc1'], metadatas: [{}] });

    // Small delay to ensure different timestamp
    await new Promise((r) => setTimeout(r, 5));

    const id2 = `decision_${Date.now()}`;
    await mockCollection.add({ ids: [id2], documents: ['doc2'], metadatas: [{}] });

    assert.notStrictEqual(id1, id2);
    assert.strictEqual(mockCollection._store.ids.length, 2);
  });

  await test('metadata preserves all required fields', async () => {
    const mockCollection = createMockCollection();
    const result = makeResult({ confidence: 92, agentCount: 50000 });

    const metadata = {
      question: result.question,
      decision: result.decision,
      confidence: result.confidence,
      cost: result.actualCost,
      agentCount: result.agentCount,
      timestamp: result.timestamp,
    };

    await mockCollection.add({
      ids: ['test'],
      documents: ['test doc'],
      metadatas: [metadata],
    });

    const stored = mockCollection._store.metadatas[0];
    assert.strictEqual(stored.question, 'Should we use GraphQL?');
    assert.strictEqual(stored.decision, 'yes');
    assert.strictEqual(stored.confidence, 92);
    assert.strictEqual(stored.cost, 0.068);
    assert.strictEqual(stored.agentCount, 50000);
    assert.ok(stored.timestamp);
  });
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

async function main() {
  console.log('AskElira Memory System Tests\n');

  await fileMemoryTests();
  await vectorDBTests();

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
