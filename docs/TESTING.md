# Testing Guide

## Running Tests

### All tests

```bash
npm test
```

Runs all 4 test suites sequentially: agents, memory, swarm, integration.

### Unit tests only

```bash
npm run test:unit
```

Runs agents, memory, and swarm tests. No external services required.

### Integration tests only

```bash
npm run test:integration
```

Runs full pipeline tests. These have a 30-second timeout per test and may require a running gateway.

### Individual test files

```bash
node test/agents.test.js
node test/memory.test.js
node test/swarm.test.js
node test/integration.test.js
```

---

## Test Suites

### `test/agents.test.js` (25 tests)

Unit tests for all 4 agents with mocked API responses.

| Agent | Tests | What's covered |
|-------|-------|----------------|
| Alba | 4 | Fallback without API key, Brave API parsing, error handling, empty results |
| David | 5 | Swarm creation, gateway errors, vote clustering, empty votes, cost calculation |
| Vex | 7 | All 5 validation checks, passing swarm, accumulated penalties |
| Elira | 9 | YES/NO/inconclusive decisions, audit penalties, confidence clamping, verdict tiers, reasoning, cost aggregation |

### `test/memory.test.js` (10 tests)

File-based memory and vector DB tests with mocked ChromaDB.

| Category | Tests | What's covered |
|----------|-------|----------------|
| File memory | 5 | Markdown format, append, parsing, date range queries, missing files |
| Vector DB | 5 | Document storage, search structure, empty results, unique IDs, metadata fields |

### `test/swarm.test.js` (3 tests)

Swarm orchestrator tests: creation, defaults, debate result structure.

### `test/integration.test.js` (5 tests)

Full pipeline tests with 30-second timeouts: Alba, David, Vex, Elira individually, and a complete 4-phase pipeline run.

---

## Writing New Tests

Tests use Node's built-in `assert` module. No test framework required for unit tests.

### Test file template

```javascript
const assert = require('assert');

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

// Tests go here
async function myTests() {
  console.log('\nMy Component');

  await test('does something', async () => {
    assert.strictEqual(1 + 1, 2);
  });
}

async function main() {
  await myTests();
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Mocking fetch

Use the `mockFetch` helper pattern from `test/agents.test.js`:

```javascript
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

// Usage
const restore = mockFetch({ data: 'test' });
// ... run code that calls fetch ...
restore(); // always restore after test
```

### Mocking ChromaDB

Create an in-memory mock collection:

```javascript
function createMockCollection() {
  const store = { ids: [], documents: [], metadatas: [] };
  return {
    add: async ({ ids, documents, metadatas }) => {
      store.ids.push(...ids);
      store.documents.push(...documents);
      store.metadatas.push(...metadatas);
    },
    query: async ({ queryTexts, nResults }) => {
      const n = Math.min(nResults || 5, store.ids.length);
      return {
        ids: [store.ids.slice(0, n)],
        documents: [store.documents.slice(0, n)],
        metadatas: [store.metadatas.slice(0, n)],
        distances: [store.ids.slice(0, n).map((_, i) => i * 0.1)],
      };
    },
  };
}
```

### Testing with temp directories

For file system tests, use a temp directory to avoid polluting real data:

```javascript
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askelira-test-'));

// ... write/read test files in tmpDir ...

// Cleanup
fs.rmSync(tmpDir, { recursive: true, force: true });
```

---

## Coverage Reports

Generate a coverage report with Jest:

```bash
npm run test:coverage
```

This outputs to `coverage/` in the project root. Open `coverage/lcov-report/index.html` in a browser for a detailed report.

### Coverage targets

| Metric | Target |
|--------|--------|
| Statements | > 80% |
| Branches | > 70% |
| Functions | > 85% |
| Lines | > 80% |

---

## CI/CD Integration

Tests run automatically on GitHub Actions for every push and PR to `main`.

**Workflow:** `.github/workflows/test.yml`

**Matrix:** Node.js 18 and 20 on Ubuntu.

**Steps:**
1. Checkout code
2. Setup Node.js with npm cache
3. Install dependencies (`npm ci --ignore-scripts`)
4. Run agent tests
5. Run memory tests
6. Run swarm tests

Integration tests are not run in CI by default since they require a running gateway.

### Adding integration tests to CI

To enable integration tests in CI, start the gateway as a background service:

```yaml
- name: Start gateway
  run: node bin/cli.js start &
  env:
    NODE_ENV: test

- name: Wait for gateway
  run: sleep 5

- name: Run integration tests
  run: node test/integration.test.js
```

---

## Linting and Formatting

```bash
# Check for lint errors
npm run lint

# Auto-format all source files
npm run format
```

Prettier config is in `.prettierrc.json`. ESLint can be configured by adding an `eslint.config.js` to the project root.

---

## Debugging Failed Tests

### Test exits with non-zero code

Every test file exits with code 1 when any test fails. Check the output for lines starting with `✗` to find the failing test and its error message.

### Fetch mock not restored

If a test modifies `globalThis.fetch` and throws before restoring, subsequent tests will use the mock. Always use try/finally or the restore pattern:

```javascript
const restore = mockFetch({ data: 'test' });
try {
  // ... test code ...
} finally {
  restore();
}
```

### Environment variable leaks

Tests that set `process.env.BRAVE_API_KEY` or other env vars should save and restore the original value:

```javascript
const original = process.env.BRAVE_API_KEY;
process.env.BRAVE_API_KEY = 'test-key';

// ... test ...

if (original) process.env.BRAVE_API_KEY = original;
else delete process.env.BRAVE_API_KEY;
```

### Temp files not cleaned up

If a test creates temp directories and crashes before cleanup, stale dirs accumulate in `$TMPDIR`. Clean them with:

```bash
rm -rf $TMPDIR/askelira-test-*
```

### Integration test timeouts

Integration tests have a 30-second timeout. If they consistently time out:

1. Verify the gateway is running: `curl http://localhost:5678/health`
2. Check gateway logs: `~/.askelira/logs/`
3. Increase the timeout in the test file if running on slow CI hardware

---

## Manual Testing Checklist

### UI Tests
- [ ] Homepage loads
- [ ] Submit debate (stub data works)
- [ ] Sign in button shows
- [ ] Rate limit banner appears
- [ ] Results page renders
- [ ] Results page with ID renders (/results/[id])
- [ ] History page accessible
- [ ] Upgrade page shows pricing
- [ ] Mobile responsive (iPhone)
- [ ] Tablet responsive (iPad)
- [ ] Desktop (Chrome, Safari)

### Error States
- [ ] Invalid input (empty question)
- [ ] API error (500)
- [ ] Rate limit (429)
- [ ] Network offline

### Authentication
- [ ] Google OAuth flow
- [ ] Session persists
- [ ] Sign out works

### Rate Limiting
- [ ] Free tier: blocked after 4 debates/month
- [ ] Pro tier: allowed with overage after 20
- [ ] Enterprise: unlimited
- [ ] alvin.kerremans@gmail.com bypasses limits

### Deployment
- [ ] Build passes (`npm run build`)
- [ ] No console errors
- [ ] All pages accessible
