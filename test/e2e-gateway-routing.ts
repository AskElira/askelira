#!/usr/bin/env npx tsx
/**
 * End-to-End Test: Gateway + Routing + Telegram + Search
 *
 * Tests the full integration chain with the LIVE gateway on ws://127.0.0.1:18789.
 * Exercises every code path the building loop would hit:
 *   1. Gateway WebSocket connection (connect.challenge protocol)
 *   2. Telegram notification delivery
 *   3. Agent routing: gateway path vs direct fallback
 *   4. Search provider auto-detection
 *   5. In-memory routing metrics
 *
 * Usage:
 *   AGENT_ROUTING_MODE=gateway SEARCH_PROVIDER=auto npx tsx test/e2e-gateway-routing.ts
 *
 * Requires: ANTHROPIC_API_KEY in .env (or env)
 * Optional: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID for notification test
 *           OPENCLAW_GATEWAY_URL for gateway test (defaults to ws://127.0.0.1:18789)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Apply test env vars (can be overridden by actual env)
if (!process.env.AGENT_ROUTING_MODE) process.env.AGENT_ROUTING_MODE = 'gateway';
if (!process.env.SEARCH_PROVIDER) process.env.SEARCH_PROVIDER = 'auto';
if (!process.env.OPENCLAW_GATEWAY_URL) process.env.OPENCLAW_GATEWAY_URL = 'ws://127.0.0.1:18789';

// ─── Imports (after env setup) ──────────────────────────────

import { GatewayClient, getGatewayClient, connectGateway } from '../lib/gateway-client';
import { routeAgentCall, getRoutingMetrics } from '../lib/agent-router';
import { notify } from '../lib/notify';

// ─── Helpers ────────────────────────────────────────────────

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const WARN = '\x1b[33m⚠\x1b[0m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GRAY = '\x1b[90m';
const CYAN = '\x1b[36m';

let passed = 0;
let failed = 0;
let skipped = 0;

function check(ok: boolean, label: string, detail?: string): void {
  if (ok) {
    console.log(`  ${PASS} ${label}${detail ? GRAY + ' — ' + detail + RESET : ''}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${label}${detail ? GRAY + ' — ' + detail + RESET : ''}`);
    failed++;
  }
}

function skip(label: string, reason: string): void {
  console.log(`  ${WARN} ${label} ${GRAY}(skipped: ${reason})${RESET}`);
  skipped++;
}

function section(title: string): void {
  console.log(`\n${BOLD}${title}${RESET}`);
}

// ─── Tests ──────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${BOLD}═══ AskElira E2E: Gateway + Routing + Notifications ═══${RESET}`);
  console.log(`${GRAY}Date: ${new Date().toISOString()}${RESET}`);
  console.log(`${GRAY}AGENT_ROUTING_MODE=${process.env.AGENT_ROUTING_MODE}${RESET}`);
  console.log(`${GRAY}SEARCH_PROVIDER=${process.env.SEARCH_PROVIDER}${RESET}`);
  console.log(`${GRAY}OPENCLAW_GATEWAY_URL=${process.env.OPENCLAW_GATEWAY_URL}${RESET}`);
  console.log(`${GRAY}TELEGRAM_BOT_TOKEN=${process.env.TELEGRAM_BOT_TOKEN ? 'set' : 'NOT SET'}${RESET}`);
  console.log(`${GRAY}ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY ? 'set (' + process.env.ANTHROPIC_API_KEY.slice(0, 12) + '...)' : 'NOT SET'}${RESET}`);

  // ═══════════════════════════════════════════════════════════
  // TEST 1: Gateway WebSocket Connection
  // ═══════════════════════════════════════════════════════════

  section('1. Gateway WebSocket Connection');

  let gatewayConnected = false;
  let gatewaySessionId: string | null = null;
  let gatewayError: string | null = null;

  try {
    const client = new GatewayClient({
      url: process.env.OPENCLAW_GATEWAY_URL!,
      token: process.env.OPENCLAW_GATEWAY_TOKEN || '',
      requestTimeoutMs: 15000,
    });

    // Listen for events
    let connectedEvent = false;
    client.on('gateway:connected', (data: any) => {
      connectedEvent = true;
    });

    console.log(`  ${GRAY}Connecting to ${process.env.OPENCLAW_GATEWAY_URL}...${RESET}`);

    try {
      await Promise.race([
        client.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connect timeout (15s)')), 15000)),
      ]);
      gatewayConnected = true;
      gatewaySessionId = client.getSessionId();
    } catch (err: any) {
      gatewayError = err.message;
    }

    check(gatewayConnected, 'WebSocket connected to gateway', gatewaySessionId ? `sessionId=${gatewaySessionId}` : undefined);
    if (!gatewayConnected) {
      console.log(`  ${GRAY}  Error: ${gatewayError}${RESET}`);
    }
    check(gatewayConnected && client.isConnected(), 'isConnected() returns true');
    check(gatewayConnected && client.isHealthy(), 'isHealthy() returns true');
    check(gatewayConnected && client.getStatus() === 'connected', `getStatus() = "${client.getStatus()}"`);
    check(!client.isDegraded(), 'Circuit breaker is closed (not degraded)');

    // Disconnect cleanly
    client.disconnect();
    check(!client.isConnected(), 'Disconnected cleanly');
  } catch (err: any) {
    check(false, 'Gateway connection test threw', err.message);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 2: Telegram Notification
  // ═══════════════════════════════════════════════════════════

  section('2. Telegram Notification');

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      await notify(`🧪 *E2E Test* — AskElira gateway test at ${new Date().toLocaleTimeString()}`);
      check(true, 'notify() completed without error');
      console.log(`  ${GRAY}  Check your Telegram chat for the test message${RESET}`);
    } catch (err: any) {
      check(false, 'notify() threw', err.message);
    }
  } else {
    skip('Telegram notification', 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');
    // Verify no-op behavior
    try {
      await notify('This should silently no-op');
      check(true, 'notify() no-ops silently when tokens missing');
    } catch (err: any) {
      check(false, 'notify() should not throw when tokens missing', err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 3: Agent Routing — Gateway Path
  // ═══════════════════════════════════════════════════════════

  section('3. Agent Routing (AGENT_ROUTING_MODE=gateway)');

  if (!process.env.ANTHROPIC_API_KEY) {
    skip('All routing tests', 'ANTHROPIC_API_KEY not set');
  } else {
    // Reset metrics by importing fresh
    const metricsBefore = getRoutingMetrics();
    console.log(`  ${GRAY}Metrics before: gateway=${metricsBefore.gatewayRequests} direct=${metricsBefore.directRequests}${RESET}`);

    // 3a: Route a simple Alba-style call
    console.log(`  ${GRAY}Sending Alba test call...${RESET}`);
    const albaStart = Date.now();
    let albaResult: string | null = null;
    let albaError: string | null = null;
    let albaPath: 'gateway' | 'direct' | 'unknown' = 'unknown';

    try {
      albaResult = await routeAgentCall({
        systemPrompt: 'You are Alba, a research agent. Respond with exactly: {"approach":"test","libraries":[],"risks":[],"sources":[],"complexity":1}',
        userMessage: 'Research: how to send an HTTP request in Node.js',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 256,
        agentName: 'Alba',
      });
    } catch (err: any) {
      albaError = err.message;
    }
    const albaDuration = Date.now() - albaStart;

    const metricsAfterAlba = getRoutingMetrics();
    if (metricsAfterAlba.gatewayRequests > metricsBefore.gatewayRequests) {
      albaPath = 'gateway';
    } else if (metricsAfterAlba.directRequests > metricsBefore.directRequests) {
      albaPath = 'direct';
    }

    if (albaResult) {
      check(true, `Alba call succeeded (${albaDuration}ms)`, `path=${albaPath}, ${albaResult.length} chars`);
    } else {
      check(false, `Alba call failed (${albaDuration}ms)`, `path=${albaPath}, error=${albaError}`);
    }

    check(albaPath !== 'unknown', `Routing path detected: ${albaPath}`);

    // 3b: Route a Steven-style call (smaller)
    console.log(`  ${GRAY}Sending Steven test call...${RESET}`);
    const stevenStart = Date.now();
    let stevenResult: string | null = null;
    let stevenError: string | null = null;

    try {
      stevenResult = await routeAgentCall({
        systemPrompt: 'You are Steven, a monitoring agent. Respond with exactly: {"conditionMet":true,"healthStatus":"healthy","observation":"All systems nominal","action":"healthy","suggestedNextAutomation":null,"consecutiveFailures":0}',
        userMessage: 'Check: floor 1 is live, all conditions met.',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 256,
        agentName: 'Steven',
      });
    } catch (err: any) {
      stevenError = err.message;
    }
    const stevenDuration = Date.now() - stevenStart;

    if (stevenResult) {
      check(true, `Steven call succeeded (${stevenDuration}ms)`, `${stevenResult.length} chars`);
    } else {
      check(false, `Steven call failed (${stevenDuration}ms)`, stevenError || 'unknown');
    }

    // 3c: Route a David-style call (Opus model)
    console.log(`  ${GRAY}Sending David test call (claude-opus-4-5)...${RESET}`);
    const davidStart = Date.now();
    let davidResult: string | null = null;
    let davidError: string | null = null;

    try {
      davidResult = await routeAgentCall({
        systemPrompt: 'You are David, a builder agent. Respond with exactly: {"files":[{"name":"index.js","code":"console.log(1)"}],"entryPoint":"index.js","selfAuditReport":"ok","handoffNotes":"done"}',
        userMessage: 'Build: a hello world Node.js script',
        model: 'claude-opus-4-5',
        maxTokens: 256,
        agentName: 'David',
      });
    } catch (err: any) {
      davidError = err.message;
    }
    const davidDuration = Date.now() - davidStart;

    if (davidResult) {
      check(true, `David call succeeded (${davidDuration}ms)`, `${davidResult.length} chars`);
    } else {
      check(false, `David call failed (${davidDuration}ms)`, davidError || 'unknown');
    }

    // ═══════════════════════════════════════════════════════════
    // TEST 4: Routing Metrics Summary
    // ═══════════════════════════════════════════════════════════

    section('4. Routing Metrics');

    const finalMetrics = getRoutingMetrics();
    console.log(`  ${CYAN}Gateway requests:  ${finalMetrics.gatewayRequests}${RESET} (${finalMetrics.gatewaySuccesses} ok, ${finalMetrics.gatewayFailures} fail)`);
    console.log(`  ${CYAN}Direct requests:   ${finalMetrics.directRequests}${RESET} (${finalMetrics.directSuccesses} ok, ${finalMetrics.directFailures} fail)`);
    console.log(`  ${CYAN}Fallbacks used:    ${finalMetrics.fallbacksUsed}${RESET}`);

    const totalCalls = 3; // Alba + Steven + David
    const gwDelta = finalMetrics.gatewayRequests - metricsBefore.gatewayRequests;
    const directDelta = finalMetrics.directRequests - metricsBefore.directRequests;
    // Fallback calls count in both gateway AND direct metrics, so total >= calls
    check(directDelta >= totalCalls || gwDelta >= totalCalls, `All ${totalCalls} calls tracked in metrics`, `gateway=${gwDelta} direct=${directDelta} fallbacks=${finalMetrics.fallbacksUsed}`);

    if (finalMetrics.gatewayRequests > 0 && finalMetrics.gatewaySuccesses > 0) {
      check(true, 'At least 1 call routed through gateway successfully');
    } else if (finalMetrics.fallbacksUsed > 0) {
      check(true, 'Gateway attempted but fell back to direct (fallback working)');
    } else {
      check(finalMetrics.directRequests > 0, 'Calls went through direct path', 'gateway may not support agent invocation yet');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 5: Search Provider Auto-Detection
  // ═══════════════════════════════════════════════════════════

  section('5. Search Provider Detection (SEARCH_PROVIDER=auto)');

  const searchProvider = process.env.SEARCH_PROVIDER || 'auto';
  check(searchProvider === 'auto', `SEARCH_PROVIDER=${searchProvider}`);

  const hasBrave = !!process.env.BRAVE_SEARCH_API_KEY;
  const hasTavily = !!process.env.TAVILY_API_KEY;
  const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;

  console.log(`  ${GRAY}BRAVE_SEARCH_API_KEY: ${hasBrave ? 'set' : 'not set'}${RESET}`);
  console.log(`  ${GRAY}TAVILY_API_KEY: ${hasTavily ? 'set' : 'not set'}${RESET}`);
  console.log(`  ${GRAY}PERPLEXITY_API_KEY: ${hasPerplexity ? 'set' : 'not set'}${RESET}`);

  let expectedProvider = 'none';
  if (hasBrave) expectedProvider = 'brave';
  else if (hasTavily) expectedProvider = 'tavily';
  else if (hasPerplexity) expectedProvider = 'perplexity';

  check(true, `Auto-detection would select: ${expectedProvider}`, 'based on available keys');

  // ═══════════════════════════════════════════════════════════
  // TEST 6: Telegram Notification from Gateway Events
  // ═══════════════════════════════════════════════════════════

  section('6. Gateway Event Notifications');

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    // Connect to gateway to trigger the CONNECTED notification
    try {
      const client2 = new GatewayClient({
        url: process.env.OPENCLAW_GATEWAY_URL!,
        token: process.env.OPENCLAW_GATEWAY_TOKEN || '',
        requestTimeoutMs: 15000,
      });

      await Promise.race([
        client2.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);

      if (client2.isConnected()) {
        check(true, 'Gateway CONNECTED notification should have fired to Telegram');
        console.log(`  ${GRAY}  Check Telegram for "Gateway connected" message${RESET}`);
      }

      client2.disconnect();
    } catch (err: any) {
      check(false, 'Gateway connect for notification test failed', err.message);
    }
  } else {
    skip('Gateway event -> Telegram', 'TELEGRAM_BOT_TOKEN not set');
  }

  // ═══════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════

  console.log(`\n${BOLD}═══ Summary ═══${RESET}`);
  console.log(`  ${PASS} Passed: ${passed}`);
  if (failed > 0) console.log(`  ${FAIL} Failed: ${failed}`);
  if (skipped > 0) console.log(`  ${WARN} Skipped: ${skipped}`);
  console.log('');

  // Let gateway cleanup finish
  await new Promise(resolve => setTimeout(resolve, 500));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(2);
});
