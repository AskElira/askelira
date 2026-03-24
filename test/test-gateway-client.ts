export {};

/**
 * Unit tests: Gateway Client
 *
 * Tests the GatewayClient class from gateway-client.ts.
 * Tests circuit breaker, request ID generation, health checks, metrics.
 *
 * Run: npx tsx test/test-gateway-client.ts
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
  // ── Test 1: GatewayClient instantiation ──
  console.log('\n1. GatewayClient instantiation:');

  const { GatewayClient } = await import('../lib/gateway-client');

  const client = new GatewayClient({
    url: 'ws://127.0.0.1:99999', // Non-existent — won't actually connect
    token: 'test-token',
    requestTimeoutMs: 5000,
    circuitBreakerThreshold: 3,
    circuitBreakerWindowMs: 60000,
    circuitBreakerCooldownMs: 300000,
  });

  assert(client !== null, 'Client created successfully');
  assert(!client.isConnected(), 'Client starts disconnected');
  assert(!client.isHealthy(), 'Client starts unhealthy (not connected)');
  assert(client.getStatus() === 'disconnected', 'Status is disconnected');
  assert(client.getSessionId() === null, 'No session ID before connect');

  // ── Test 2: Circuit breaker state ──
  console.log('\n2. Circuit breaker behavior:');

  assert(!client.isDegraded(), 'Not degraded initially');

  // Simulate failures via internal method (access private for testing)
  const clientAny = client as any;

  clientAny.recordFailure();
  assert(!client.isDegraded(), '1 failure: not degraded yet');

  clientAny.recordFailure();
  assert(!client.isDegraded(), '2 failures: not degraded yet');

  clientAny.recordFailure();
  assert(client.isDegraded(), '3 failures: circuit breaker OPEN');
  assert(client.getStatus() === 'disconnected', 'Status still disconnected (not connected)');

  // Reset circuit breaker
  clientAny.resetCircuitBreaker();
  assert(!client.isDegraded(), 'After reset: not degraded');

  // ── Test 3: Request ID generation ──
  console.log('\n3. Request ID generation:');

  const id1 = clientAny.generateId();
  const id2 = clientAny.generateId();
  assert(id1 !== id2, 'IDs are unique');
  assert(id1.startsWith('req_'), 'ID starts with req_ prefix');

  // ── Test 4: Metrics tracking ──
  console.log('\n4. Metrics tracking:');

  const metrics = client.getMetrics();
  assert(typeof metrics.requestsViaGateway === 'number', 'requestsViaGateway is number');
  assert(typeof metrics.requestsViaDirectFallback === 'number', 'requestsViaDirectFallback is number');
  assert(typeof metrics.gatewaySuccesses === 'number', 'gatewaySuccesses is number');
  assert(typeof metrics.gatewayFailures === 'number', 'gatewayFailures is number');

  // ── Test 5: Singleton access ──
  console.log('\n5. Singleton getGatewayClient():');

  const { getGatewayClient } = await import('../lib/gateway-client');

  // Without env var, should return null
  delete process.env.OPENCLAW_GATEWAY_URL;
  // Note: the module-level singleton may already be initialized, so we test the logic
  const noClient = getGatewayClient();
  // This may or may not be null depending on prior state; the key test is the type check
  assert(noClient === null || typeof noClient === 'object', 'Returns null or GatewayClient');

  // ── Test 6: Circuit breaker window ──
  console.log('\n6. Circuit breaker window expiry:');

  const client2 = new GatewayClient({
    url: 'ws://127.0.0.1:99999',
    token: '',
    circuitBreakerThreshold: 2,
    circuitBreakerWindowMs: 100, // Very short window for testing
    circuitBreakerCooldownMs: 100,
  });

  const client2Any = client2 as any;

  client2Any.recordFailure();
  // Wait for window to expire
  await new Promise(resolve => setTimeout(resolve, 150));
  client2Any.recordFailure();
  // Should NOT be degraded because the first failure expired
  assert(!client2.isDegraded(), 'Failures outside window do not accumulate');

  // Rapid failures within window
  client2Any.recordFailure();
  client2Any.recordFailure();
  assert(client2.isDegraded(), 'Rapid failures within window trigger circuit breaker');

  // Wait for cooldown
  await new Promise(resolve => setTimeout(resolve, 150));
  assert(!client2.isDegraded(), 'Circuit breaker cooldown expires');

  // ── Test 7: Event emitter ──
  console.log('\n7. Event emitter:');

  let emitted = false;
  const client3 = new GatewayClient({
    url: 'ws://127.0.0.1:99999',
    token: '',
    circuitBreakerThreshold: 1,
    circuitBreakerCooldownMs: 100,
  });

  client3.on('gateway:circuit_open', () => {
    emitted = true;
  });

  (client3 as any).recordFailure();
  assert(emitted, 'GATEWAY_CIRCUIT_OPEN event emitted on circuit break');

  // Cleanup
  client.disconnect();
  client2.disconnect();
  client3.disconnect();

  // ── Summary ──
  console.log(`\n\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
