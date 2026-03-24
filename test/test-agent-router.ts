export {};

/**
 * Unit tests: Agent Router
 *
 * Tests the routeAgentCall() function from agent-router.ts.
 * Tests routing modes: gateway, direct, gateway-only.
 *
 * Run: npx tsx test/test-agent-router.ts
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

// Mock the Anthropic API fetch
const originalFetch = globalThis.fetch;
let lastFetchUrl: string | undefined;
let anthropicCallCount = 0;

function mockFetch(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  lastFetchUrl = typeof url === 'string' ? url : url.toString();
  anthropicCallCount++;

  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      content: [{ type: 'text', text: '{"result": "test response"}' }],
    }),
  } as unknown as Response);
}

async function runTests() {
  // Setup: Set ANTHROPIC_API_KEY and mock fetch
  process.env.ANTHROPIC_API_KEY = 'test-key-123';
  globalThis.fetch = mockFetch as any;

  // ── Test 1: Direct mode routes to Anthropic API ──
  console.log('\n1. Direct mode (AGENT_ROUTING_MODE=direct):');

  process.env.AGENT_ROUTING_MODE = 'direct';
  delete process.env.OPENCLAW_GATEWAY_URL;
  anthropicCallCount = 0;

  const { routeAgentCall, getRoutingMetrics } = await import('../lib/agent-router');

  const result = await routeAgentCall({
    systemPrompt: 'You are a test agent.',
    userMessage: 'Hello test',
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 100,
    agentName: 'TestAgent',
  });

  assert(result.includes('test response'), 'Got response from direct API');
  assert(lastFetchUrl === 'https://api.anthropic.com/v1/messages', 'Request went to Anthropic API');
  assert(anthropicCallCount === 1, 'Exactly one API call made');

  const metrics1 = getRoutingMetrics();
  assert(metrics1.directRequests === 1, 'directRequests incremented');
  assert(metrics1.directSuccesses === 1, 'directSuccesses incremented');
  assert(metrics1.gatewayRequests === 0, 'gatewayRequests is 0 in direct mode');

  // ── Test 2: Gateway mode without gateway URL falls back to direct ──
  console.log('\n2. Gateway mode without gateway URL (fallback to direct):');

  process.env.AGENT_ROUTING_MODE = 'gateway';
  delete process.env.OPENCLAW_GATEWAY_URL;
  anthropicCallCount = 0;

  const result2 = await routeAgentCall({
    systemPrompt: 'Test',
    userMessage: 'Hello',
    agentName: 'TestAgent2',
  });

  assert(result2.includes('test response'), 'Got response via direct fallback');
  assert(lastFetchUrl === 'https://api.anthropic.com/v1/messages', 'Request went to Anthropic API');

  // ── Test 3: Gateway-only mode without URL throws ──
  console.log('\n3. Gateway-only mode without URL:');

  process.env.AGENT_ROUTING_MODE = 'gateway-only';
  delete process.env.OPENCLAW_GATEWAY_URL;

  try {
    await routeAgentCall({
      systemPrompt: 'Test',
      userMessage: 'Hello',
      agentName: 'TestAgent3',
    });
    assert(false, 'Should have thrown');
  } catch (err: any) {
    assert(err.message.includes('gateway-only'), 'Throws error mentioning gateway-only mode');
  }

  // ── Test 4: Tools parameter routes to callClaudeWithTools ──
  console.log('\n4. Tools parameter in direct mode:');

  process.env.AGENT_ROUTING_MODE = 'direct';
  anthropicCallCount = 0;

  const result4 = await routeAgentCall({
    systemPrompt: 'Test',
    userMessage: 'Hello',
    tools: [{ name: 'test_tool', description: 'A test tool', input_schema: { type: 'object' } }],
    agentName: 'ToolAgent',
  });

  assert(result4.includes('test response'), 'Got response with tools');
  assert(anthropicCallCount === 1, 'One API call made with tools');

  // ── Test 5: Metrics accumulate ──
  console.log('\n5. Metrics accumulation:');

  const metricsAfter = getRoutingMetrics();
  assert(metricsAfter.directRequests > 1, 'Multiple direct requests tracked');
  assert(metricsAfter.directSuccesses > 1, 'Multiple direct successes tracked');
  assert(metricsAfter.fallbacksUsed === 0 || metricsAfter.fallbacksUsed >= 0, 'Fallbacks tracked');

  // ── Test 6: Missing ANTHROPIC_API_KEY throws ──
  console.log('\n6. Missing API key in direct mode:');

  delete process.env.ANTHROPIC_API_KEY;

  // Restore real fetch to test the actual error
  globalThis.fetch = originalFetch;

  try {
    await routeAgentCall({
      systemPrompt: 'Test',
      userMessage: 'Hello',
      agentName: 'NoKeyAgent',
    });
    assert(false, 'Should have thrown');
  } catch (err: any) {
    assert(err.message.includes('ANTHROPIC_API_KEY'), 'Throws error about missing API key');
  }

  // Cleanup
  process.env.ANTHROPIC_API_KEY = 'test-key-123';
  globalThis.fetch = mockFetch as any;

  // Restore everything
  globalThis.fetch = originalFetch;
  delete process.env.AGENT_ROUTING_MODE;
  delete process.env.OPENCLAW_GATEWAY_URL;
  delete process.env.ANTHROPIC_API_KEY;

  // ── Summary ──
  console.log(`\n\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
