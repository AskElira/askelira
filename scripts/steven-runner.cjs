#!/usr/bin/env node
// Steven Local Runner - Plain JavaScript (avoids tsx module loader issues)
// Load .env if present
require('dotenv').config();

const { sql } = require('@vercel/postgres');
let WebSocket;
try {
  WebSocket = require('ws').WebSocket;
} catch(e) {
  console.error('[Steven] ws module load failed:', e.message);
  process.exit(1);
}

// ============================================================
// Config
// ============================================================

const POLL_INTERVAL_MS = 6_000;
const STEP_DELAY_MS = 3_000;
const MAX_ITERATIONS = 5;
const MAX_BLOCKED_RETRIES = 2; // How many times to reset+retry a blocked floor before giving up
const BLOCKED_COOLDOWN_MS = 30_000; // Wait 30s before retrying a blocked floor
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) { console.error('❌ POSTGRES_URL not set'); process.exit(1); }
if (!GATEWAY_TOKEN) { console.error('❌ OPENCLAW_GATEWAY_TOKEN not set'); process.exit(1); }
if (!ANTHROPIC_API_KEY) { console.error('❌ ANTHROPIC_API_KEY not set'); process.exit(1); }

const STEP_ORDER = ['alba', 'vex1', 'david', 'vex2', 'elira', 'finalize'];

// ============================================================
// DB Helpers
// ============================================================

async function query(sql, params) {
  const client = await sql.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

async function getPendingGoals() {
  const { rows } = await sql`
    SELECT id, customer_id, goal_text, status, steven_status
    FROM goals
    WHERE status IN ('planning', 'building')
      AND (steven_status IS NULL OR steven_status != 'done')
    ORDER BY created_at ASC
    LIMIT 5
  `;
  return rows;
}

async function getGoal(goalId) {
  const { rows } = await sql`
    SELECT id, customer_id, goal_text, status, steven_status
    FROM goals WHERE id = ${goalId}
  `;
  return rows[0] || null;
}

async function getAllFloors(goalId) {
  const { rows } = await sql`
    SELECT id, goal_id, floor_number, name, status
    FROM floors
    WHERE goal_id = ${goalId}
    ORDER BY floor_number ASC
  `;
  return rows;
}

async function updateGoalStatus(goalId, status) {
  await sql`UPDATE goals SET status = ${status} WHERE id = ${goalId}`;
}

async function updateFloorStatus(floorId, status) {
  await sql`UPDATE floors SET status = ${status} WHERE id = ${floorId}`;
}

async function updateStevenHeartbeat(goalId, agent, step) {
  await sql`
    UPDATE goals SET
      steven_status = 'active',
      steven_current_agent = ${agent},
      steven_current_step = ${step},
      steven_last_heartbeat = NOW()
    WHERE id = ${goalId}
  `;
}

async function markStevenDone(goalId) {
  await sql`
    UPDATE goals SET
      steven_status = 'done',
      steven_current_agent = NULL,
      steven_current_step = NULL,
      steven_last_heartbeat = NOW()
    WHERE id = ${goalId}
  `;
}

async function getFloorBlockedRetries(floorId) {
  const { rows } = await sql`
    SELECT COALESCE(blocked_retries, 0) as blocked_retries,
           blocked_at
    FROM floors WHERE id = ${floorId}
  `;
  if (!rows[0]) return { retries: 0, blockedAt: null };
  return { retries: rows[0].blocked_retries || 0, blockedAt: rows[0].blocked_at };
}

async function resetBlockedFloor(floorId) {
  await sql`
    UPDATE floors SET
      status = 'researching',
      iteration_count = 0,
      research_output = NULL,
      build_output = NULL,
      vex_gate1_report = NULL,
      vex_gate2_report = NULL,
      blocked_retries = COALESCE(blocked_retries, 0) + 1,
      blocked_at = NULL
    WHERE id = ${floorId}
  `;
}

async function markFloorBlocked(floorId) {
  await sql`
    UPDATE floors SET
      status = 'blocked',
      blocked_at = NOW()
    WHERE id = ${floorId}
  `;
}

// ============================================================
// Gateway
// ============================================================

let gatewayWs = null;
let gatewaySessionId = null;

async function connectGateway() {
  return new Promise((resolve, reject) => {
    console.log('[Gateway] Connecting...');
    const ws = new WebSocket(GATEWAY_URL, {
      headers: { Authorization: `Bearer ${GATEWAY_TOKEN}` },
    });

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Gateway connection timeout (15s)'));
    }, 15000);

    let connected = false;

    ws.on('open', () => {
      console.log('[Gateway] Socket open');
    });

    ws.on('message', (data) => {
      if (connected) return; // Already resolved
      try {
        const msg = JSON.parse(data.toString());
        console.log('[Gateway] Received:', JSON.stringify(msg).slice(0, 150));

        if (msg.type === 'event' && msg.event === 'connect.challenge') {
          // Challenge received - send connect request
          const connectId = `runner_${Date.now()}`;
          console.log('[Gateway] Sending connect request...');
          ws.send(JSON.stringify({
            type: 'req',
            id: connectId,
            method: 'connect',
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              client: { id: 'cli', version: '1.0.0', platform: process.platform, mode: 'cli' },
              caps: [],
              role: 'operator',
              scopes: ['operator.admin'],
              auth: { token: GATEWAY_TOKEN },
            },
          }));
        } else if (msg.type === 'connected') {
          clearTimeout(timeout);
          gatewayWs = ws;
          gatewaySessionId = msg.sessionId || 'unknown';
          connected = true;
          console.log('[Gateway] ✅ Connected! sessionId:', gatewaySessionId);
          resolve(ws);
        } else if (msg.type === 'error') {
          clearTimeout(timeout);
          reject(new Error(`Gateway error: ${msg.message}`));
        }
      } catch (e) {
        console.log('[Gateway] Parse error:', e.message);
      }
    });

    ws.on('error', (e) => {
      console.log('[Gateway] Error:', e.message);
      if (!connected) reject(e);
    });

    ws.on('close', (code, reason) => {
      console.log('[Gateway] Closed:', code, reason?.toString());
      if (!connected) reject(new Error(`Gateway closed: ${code} ${reason}`));
    });
  });
}

async function invokeAgent(agentName, systemPrompt, userMessage, goalId) {
  if (!gatewayWs || gatewayWs.readyState !== WebSocket.OPEN) {
    await connectGateway();
  }

  return new Promise((resolve, reject) => {
    const id = `steven_${Date.now()}`;
    const timeout = setTimeout(() => reject(new Error('Gateway invoke timeout (120s)')), 120_000);

    const handler = (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'result' && msg.id === id) {
          clearTimeout(timeout);
          gatewayWs.removeEventListener('message', handler);
          resolve(msg.result || msg.output || '');
        }
      } catch {}
    };

    gatewayWs.addEventListener('message', handler);
    gatewayWs.send(JSON.stringify({
      type: 'req',
      id,
      method: 'invoke',
      params: { agentName, systemPrompt, userMessage, goalId },
    }));
  });
}

// ============================================================
// Step System Prompts
// ============================================================

function getStepPrompt(step) {
  const prompts = {
    alba: `You are Alba, the research agent. Research the domain for the given floor. Respond with a JSON object: {"nextStep": "vex1", "message": "what you found about the domain"}`,
    vex1: `You are Vex, the validation agent. Validate Alba's research. Check for gaps, unsupported claims, or missing context. Respond with JSON: {"nextStep": "david", "message": "validation result"}`,
    david: `You are David, the builder. Generate the automation code. Respond with JSON: {"nextStep": "vex2", "message": "what you built"}`,
    vex2: `You are Vex, the validation agent. Validate David's code. Respond with JSON: {"nextStep": "elira", "message": "validation result"}`,
    elira: `You are Elira, the architect. Review and approve the floor. Respond with JSON: {"nextStep": "finalize", "message": "review notes"}`,
    finalize: `You are Finalize. Complete the floor. Respond with JSON: {"nextStep": "done", "message": "completion summary"}`,
  };
  return prompts[step] || prompts.alba;
}

function parseResult(text) {
  try {
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {}
  return { nextStep: 'done', message: text.slice(0, 200) };
}

function stepAgentName(step) {
  return step === 'alba' ? 'Alba' : step === 'vex1' || step === 'vex2' ? 'Vex' : step === 'david' ? 'David' : step === 'elira' ? 'Elira' : 'Finalize';
}

// ============================================================
// Main Loop
// ============================================================

async function runCycle() {
  const goals = await getPendingGoals();
  if (!goals.length) return;

  for (const goal of goals) {
    try {
      await processGoal(goal);
    } catch (err) {
      console.error(`[Steven] Error processing ${goal.id}:`, err.message);
    }
  }
}

async function processGoal(goal) {
  console.log(`[Steven] 📋 Processing: ${goal.id} — ${(goal.goal_text || '').slice(0, 50)}`);
  console.log(`[Steven]   status=${goal.status}, steven_status=${goal.steven_status}`);

  const floors = await getAllFloors(goal.id);
  console.log(`[Steven]   floors:`, floors.map(f => `${f.floor_number}(${f.name})[${f.status}]`).join(', '));

  if (!floors.length) {
    console.log(`[Steven]   No floors — marking done`);
    await markStevenDone(goal.id);
    return;
  }

  if (goal.status === 'planning') {
    await updateGoalStatus(goal.id, 'building');
  }

  const pendingFloors = floors.filter(f => f.status === 'pending');
  const buildingFloors = floors.filter(f => f.status === 'building');
  const researchingFloors = floors.filter(f => f.status === 'researching');
  const auditingFloors = floors.filter(f => f.status === 'auditing');
  const blockedFloors = floors.filter(f => f.status === 'blocked');

  // Recover blocked floors that haven't exceeded retry limit
  for (const floor of blockedFloors) {
    try {
      const { retries, blockedAt } = await getFloorBlockedRetries(floor.id);
      if (retries >= MAX_BLOCKED_RETRIES) {
        console.log(`[Steven]   Floor ${floor.floor_number} permanently blocked (${retries}/${MAX_BLOCKED_RETRIES} retries exhausted)`);
        continue;
      }
      // Cooldown: don't retry too quickly
      if (blockedAt && (Date.now() - new Date(blockedAt).getTime()) < BLOCKED_COOLDOWN_MS) {
        console.log(`[Steven]   Floor ${floor.floor_number} blocked — cooling down before retry`);
        continue;
      }
      console.log(`[Steven]   🔄 Resetting blocked floor ${floor.floor_number} for retry ${retries + 1}/${MAX_BLOCKED_RETRIES}`);
      await resetBlockedFloor(floor.id);
      floor.status = 'researching'; // Update in-memory so it gets picked up below
    } catch (err) {
      console.error(`[Steven]   Failed to reset blocked floor ${floor.floor_number}:`, err.message);
    }
  }

  // Re-collect after blocked recovery
  const recoveredFloors = blockedFloors.filter(f => f.status === 'researching');

  // Include all in-progress floors (researching/building/auditing) plus the first pending floor
  const inProgressFloors = [...researchingFloors, ...buildingFloors, ...auditingFloors, ...recoveredFloors];
  const activeFloors = [...inProgressFloors, ...pendingFloors.slice(0, inProgressFloors.length === 0 ? 1 : 0)];

  if (!activeFloors.length) {
    // Only mark done if ALL floors are truly terminal (live, or blocked with retries exhausted, or broken)
    const allTerminal = floors.every(f =>
      f.status === 'live' ||
      f.status === 'broken' ||
      (f.status === 'blocked') // Already checked retries above — if we're here, they're exhausted
    );
    if (allTerminal) {
      const blockedCount = floors.filter(f => f.status === 'blocked').length;
      const liveCount = floors.filter(f => f.status === 'live').length;
      console.log(`[Steven]   All floors terminal (${liveCount} live, ${blockedCount} blocked) — marking done`);
      await markStevenDone(goal.id);
    } else {
      console.log(`[Steven]   No active floors but some remain — will retry next cycle`);
    }
    return;
  }

  for (const floor of activeFloors) {
    await processFloor(goal.id, floor);
  }
}

async function processFloor(goalId, floor) {
  console.log(`[Steven] Floor ${floor.floor_number}: ${floor.name} (status: ${floor.status})`);

  if (floor.status === 'pending') {
    await updateFloorStatus(floor.id, 'researching');
  }

  let stepIndex = 0;
  let iteration = 1;
  let done = false;

  while (!done) {
    const step = STEP_ORDER[stepIndex];
    if (!step) { done = true; break; }

    console.log(`[Steven]   → "${step}"...`);
    await updateStevenHeartbeat(goalId, step, floor.name);

    let success = false;
    let result = null;

    try {
      const agentName = stepAgentName(step);
      const prompt = getStepPrompt(step);
      const userMsg = `Run step "${step}" for floor ${floor.floor_number} (${floor.name}), iteration ${iteration}. Goal: ${goalId}. Return JSON.`;

      const output = await invokeAgent(agentName, prompt, userMsg, goalId);
      result = parseResult(output);

      console.log(`[Steven]   ✓ "${step}" → next="${result.nextStep}", msg="${(result.message || '').slice(0, 60)}"`);
      success = true;
    } catch (err) {
      console.warn(`[Steven]   ⚠️  "${step}" failed: ${err.message}`);
      result = { nextStep: step, message: err.message };
    }

    if (result.nextStep === 'done') {
      await updateFloorStatus(floor.id, 'live');
      console.log(`[Steven]   ✅ Floor ${floor.floor_number} complete`);
      done = true;
    } else if (result.nextStep === 'alba' && iteration >= MAX_ITERATIONS) {
      await markFloorBlocked(floor.id);
      console.log(`[Steven]   ✗ Floor ${floor.floor_number} blocked (max iterations) — will retry next cycle`);
      done = true;
    } else {
      const nextIndex = STEP_ORDER.indexOf(result.nextStep);
      if (nextIndex >= 0) {
        stepIndex = nextIndex;
      } else {
        stepIndex = 0;
      }
      if (result.nextStep === 'alba') iteration++;
    }

    await new Promise(r => setTimeout(r, STEP_DELAY_MS));
  }
}

// ============================================================
// Entry
// ============================================================

async function main() {
  console.log('🦞 Steven Local Runner starting...');
  console.log(`   Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`   Gateway: ${GATEWAY_URL}`);
  console.log(`   POSTGRES_URL: ✓ set`);
  console.log(`   Anthropic key: ✓ set`);
  console.log('');

  console.log('[Steven] Connecting to gateway...');
  try {
    await connectGateway();
    console.log('[Steven] ✅ Gateway connected');
  } catch (err) {
    console.warn('[Steven] ⚠️  Gateway not connected:', err.message, '- will retry');
  }

  while (true) {
    try {
      await runCycle();
    } catch (err) {
      console.error('[Steven] Loop error:', err.message);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main().catch((err) => {
  console.error('[Steven] FATAL:', err);
  process.exit(1);
});
