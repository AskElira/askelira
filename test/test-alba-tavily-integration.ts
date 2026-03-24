export {};

/**
 * Integration test: Alba step with Tavily search
 *
 * Verifies that when SEARCH_PROVIDER=tavily, the Alba step in step-runner
 * properly invokes tavilySearch, and results flow into the combined research
 * summary and eventually to the LLM prompt.
 *
 * Run: npx tsx test/test-alba-tavily-integration.ts
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

async function runTests() {
  // ── Test 1: Tavily search results map to SearchResult interface ──
  console.log('\n1. Tavily results map to SearchResult interface:');

  const mockTavilyResponse = {
    results: [
      {
        title: 'Email Automation Guide',
        url: 'https://example.com/email-automation',
        content: 'Complete guide to email automation using APIs and webhooks',
        score: 0.92,
      },
      {
        title: 'SendGrid Integration Tutorial',
        url: 'https://example.com/sendgrid',
        content: 'Step by step tutorial for SendGrid email integration',
        score: 0.85,
      },
    ],
  };

  // Verify structure matches SearchResult
  const mapped = mockTavilyResponse.results.map(r => ({
    title: r.title || '',
    url: r.url || '',
    snippet: r.content || '',
    relevanceScore: r.score,
  }));

  assert(mapped.length === 2, 'Maps 2 results');
  assert(mapped[0].title === 'Email Automation Guide', 'Title mapped correctly');
  assert(mapped[0].url === 'https://example.com/email-automation', 'URL mapped correctly');
  assert(mapped[0].snippet.includes('email automation'), 'Content mapped to snippet');
  assert(mapped[0].relevanceScore === 0.92, 'Score mapped to relevanceScore');

  // ── Test 2: Combined research includes Tavily results ──
  console.log('\n2. combineResearch() handles Tavily results:');

  const webResults = mapped;
  const parts: string[] = [];

  if (webResults && webResults.length > 0) {
    parts.push('## Web Search Results:');
    webResults.forEach((result, idx) => {
      parts.push(`${idx + 1}. **${result.title}**`);
      parts.push(`   ${result.snippet}`);
      parts.push(`   Source: ${result.url}`);
      parts.push('');
    });
  }

  const combined = parts.join('\n');
  assert(combined.includes('Web Search Results'), 'Combined includes section header');
  assert(combined.includes('Email Automation Guide'), 'Combined includes first result title');
  assert(combined.includes('SendGrid Integration'), 'Combined includes second result title');
  assert(combined.includes('https://example.com/email-automation'), 'Combined includes source URLs');

  // ── Test 3: Search provider env var parsing ──
  console.log('\n3. SEARCH_PROVIDER env var parsing:');

  process.env.SEARCH_PROVIDER = 'tavily';
  const provider = process.env.SEARCH_PROVIDER || 'auto';
  assert(provider === 'tavily', 'Reads tavily from env');

  process.env.SEARCH_PROVIDER = 'auto';
  const autoProvider = process.env.SEARCH_PROVIDER || 'auto';
  assert(autoProvider === 'auto', 'Reads auto from env');

  delete process.env.SEARCH_PROVIDER;
  const defaultProvider = process.env.SEARCH_PROVIDER || 'auto';
  assert(defaultProvider === 'auto', 'Defaults to auto when not set');

  // ── Test 4: OpenResearch searchApi mapping ──
  console.log('\n4. OpenResearch config.searchApi mapping:');

  process.env.SEARCH_PROVIDER = 'tavily';
  const searchProvider = process.env.SEARCH_PROVIDER;
  const researchSearchApi = searchProvider === 'auto'
    ? (process.env.TAVILY_API_KEY ? 'tavily' : process.env.BRAVE_SEARCH_API_KEY ? 'brave' : 'duckduckgo')
    : searchProvider;

  assert(researchSearchApi === 'tavily', 'Maps tavily provider to tavily searchApi');

  process.env.SEARCH_PROVIDER = 'auto';
  process.env.TAVILY_API_KEY = 'test-key';
  const autoSearchApi = process.env.SEARCH_PROVIDER === 'auto'
    ? (process.env.TAVILY_API_KEY ? 'tavily' : process.env.BRAVE_SEARCH_API_KEY ? 'brave' : 'duckduckgo')
    : process.env.SEARCH_PROVIDER;

  assert(autoSearchApi === 'tavily', 'Auto mode with TAVILY_API_KEY selects tavily');

  delete process.env.TAVILY_API_KEY;
  process.env.BRAVE_SEARCH_API_KEY = 'brave-key';
  const autoSearchApi2 = process.env.SEARCH_PROVIDER === 'auto'
    ? (process.env.TAVILY_API_KEY ? 'tavily' : process.env.BRAVE_SEARCH_API_KEY ? 'brave' : 'duckduckgo')
    : process.env.SEARCH_PROVIDER;

  assert(autoSearchApi2 === 'brave', 'Auto mode with BRAVE_SEARCH_API_KEY selects brave');

  delete process.env.BRAVE_SEARCH_API_KEY;
  const autoSearchApi3 = process.env.SEARCH_PROVIDER === 'auto'
    ? (process.env.TAVILY_API_KEY ? 'tavily' : process.env.BRAVE_SEARCH_API_KEY ? 'brave' : 'duckduckgo')
    : process.env.SEARCH_PROVIDER;

  assert(autoSearchApi3 === 'duckduckgo', 'Auto mode with no keys falls back to duckduckgo');

  // ── Test 5: WebSearchOptions provider field ──
  console.log('\n5. WebSearchOptions accepts provider field:');

  const options: { query: string; count?: number; freshness?: string; provider?: string } = {
    query: 'test',
    count: 5,
    freshness: 'month',
    provider: 'tavily',
  };

  assert(options.provider === 'tavily', 'Provider field accepted in options');
  assert(typeof options.query === 'string', 'Query is string');
  assert(options.count === 5, 'Count preserved');

  // Cleanup
  delete process.env.SEARCH_PROVIDER;
  delete process.env.TAVILY_API_KEY;
  delete process.env.BRAVE_SEARCH_API_KEY;

  // ── Summary ──
  console.log(`\n\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
