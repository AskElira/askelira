export {};

/**
 * Unit tests: Tavily Search Integration
 *
 * Tests the tavilySearch() function from web-search.ts.
 * Mocks the fetch API to verify request format, response mapping, error handling.
 *
 * Run: npx tsx test/test-tavily-search.ts
 */

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// Mock fetch globally
const originalFetch = globalThis.fetch;
let lastFetchUrl: string | undefined;
let lastFetchBody: any;
let mockFetchResponse: { ok: boolean; status: number; json: () => Promise<any> } | null = null;

function mockFetch(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  lastFetchUrl = typeof url === 'string' ? url : url.toString();
  lastFetchBody = init?.body ? JSON.parse(init.body as string) : undefined;

  if (mockFetchResponse) {
    return Promise.resolve(mockFetchResponse as unknown as Response);
  }

  return Promise.resolve({
    ok: false,
    status: 500,
    json: () => Promise.resolve({}),
  } as unknown as Response);
}

async function runTests() {
  // Override fetch
  globalThis.fetch = mockFetch as any;

  // ── Test 1: Tavily search returns mapped results ──
  console.log('\n1. tavilySearch() maps response correctly:');

  process.env.TAVILY_API_KEY = 'test-key-123';

  mockFetchResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      results: [
        {
          title: 'Test Result 1',
          url: 'https://example.com/1',
          content: 'This is a test snippet',
          score: 0.95,
        },
        {
          title: 'Test Result 2',
          url: 'https://example.com/2',
          content: 'Another test snippet',
          score: 0.8,
        },
      ],
    }),
  };

  const { tavilySearch } = await import('../lib/web-search');
  const results = await tavilySearch({ query: 'test query', count: 5, freshness: 'month' });

  assert(results.length === 2, 'Returns 2 results');
  assert(results[0].title === 'Test Result 1', 'First result title mapped');
  assert(results[0].url === 'https://example.com/1', 'First result URL mapped');
  assert(results[0].snippet === 'This is a test snippet', 'First result snippet mapped from content');
  assert(results[0].relevanceScore === 0.95, 'Score mapped to relevanceScore');

  // Verify request format
  assert(lastFetchUrl === 'https://api.tavily.com/search', 'Correct API URL');
  assert(lastFetchBody.api_key === 'test-key-123', 'API key sent in body');
  assert(lastFetchBody.query === 'test query', 'Query sent correctly');
  assert(lastFetchBody.max_results === 5, 'Count mapped to max_results');
  assert(lastFetchBody.days === 30, 'Freshness month mapped to 30 days');

  // ── Test 2: Missing API key returns empty ──
  console.log('\n2. tavilySearch() with no API key:');

  delete process.env.TAVILY_API_KEY;
  const emptyResults = await tavilySearch({ query: 'test' });
  assert(emptyResults.length === 0, 'Returns empty array when no API key');

  // ── Test 3: API error returns empty ──
  console.log('\n3. tavilySearch() with API error:');

  process.env.TAVILY_API_KEY = 'test-key-123';
  mockFetchResponse = {
    ok: false,
    status: 401,
    json: () => Promise.resolve({ error: 'Invalid API key' }),
  };

  const errorResults = await tavilySearch({ query: 'test' });
  assert(errorResults.length === 0, 'Returns empty array on API error');

  // ── Test 4: Empty results response ──
  console.log('\n4. tavilySearch() with empty results:');

  mockFetchResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ results: [] }),
  };

  const noResults = await tavilySearch({ query: 'nothing' });
  assert(noResults.length === 0, 'Returns empty array for empty results');

  // ── Test 5: webSearch() dispatcher with provider selection ──
  console.log('\n5. webSearch() dispatches to Tavily when provider=tavily:');

  process.env.TAVILY_API_KEY = 'test-key-123';
  mockFetchResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      results: [{ title: 'Tavily', url: 'https://tavily.com', content: 'Via Tavily' }],
    }),
  };

  const { webSearch } = await import('../lib/web-search');
  const dispatched = await webSearch({ query: 'test', provider: 'tavily' });
  assert(dispatched.length === 1, 'webSearch with provider=tavily routes to Tavily');
  assert(lastFetchUrl === 'https://api.tavily.com/search', 'Request went to Tavily API');

  // ── Test 6: Freshness mapping ──
  console.log('\n6. Freshness parameter mapping:');

  mockFetchResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ results: [] }),
  };

  await tavilySearch({ query: 'test', freshness: 'day' });
  assert(lastFetchBody.days === 1, 'day -> 1');

  await tavilySearch({ query: 'test', freshness: 'week' });
  assert(lastFetchBody.days === 7, 'week -> 7');

  await tavilySearch({ query: 'test', freshness: 'year' });
  assert(lastFetchBody.days === 365, 'year -> 365');

  // Cleanup
  delete process.env.TAVILY_API_KEY;
  globalThis.fetch = originalFetch;

  // ── Summary ──
  console.log(`\n\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
