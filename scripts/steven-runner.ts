#!/usr/bin/env npx tsx
// Load .env file if present
import { config } from 'dotenv';
config();

/**
 * Steven Local Runner
 * 
 * Runs Steven, the building engineer, as a persistent local process on your Mac.
 * Polls Neon DB for buildings that need Steven, runs floor steps via the gateway,
 * and updates DB with live heartbeat status.
 * 
 * Setup:
 *   cp scripts/steven-runner.plist ~/Library/LaunchAgents/
 *   launchctl load ~/Library/LaunchAgents/com.askelira.steven.plist
 *
 * To run manually (for testing):
 *   npx ts-node scripts/steven-runner.ts
 */

import {
  getPendingGoalsForSteven,
  getGoal,
  getAllFloors,
  updateFloorStatus,
  updateGoalStatus,
  logAgentAction,
  updateStevenHeartbeat,
  markStevenDone,
} from '../lib/building-manager';
import { BUILDING_EVENTS } from '../lib/events';
import { runStep as stevenRunStep, markFloorBlocked, type StepName } from '../lib/steven';

// ============================================================
// Config
// ============================================================

const POLL_INTERVAL_MS = 6_000;   // Check for new buildings every 6s
const STEP_DELAY_MS = 3_000;      // Delay between steps (rate limit protection)
const MAX_ITERATIONS = 5;         // Max alba retries before blocking floor

// ============================================================
// Main Loop
// ============================================================

async function main() {
  // Ensure POSTGRES_URL is available for @vercel/postgres
  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL;
  }

  console.log('🦞 Steven Local Runner starting...');
  console.log(`   Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`   Gateway: ${process.env.OPENCLAW_GATEWAY_URL ?? 'ws://127.0.0.1:18789'}`);
  console.log(`   POSTGRES_URL: ${process.env.POSTGRES_URL ? '✓ set' : '✗ MISSING'}`);
  console.log(`   Anthropic key: ${process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ MISSING'}`);
  console.log('');
  // Flush stdout
  await new Promise(r => setTimeout(r, 100));
  console.log('[Steven] Config done, starting main loop...');
  console.log('[Steven] Calling getPendingGoalsForSteven...');

  while (true) {
    try {
      await runCycle();
    } catch (err) {
      console.error('[Steven] Unhandled error:', err instanceof Error ? err.message : err);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

// ============================================================
// One cycle: check for pending buildings and process them
// ============================================================

async function runCycle(): Promise<void> {
  const pendingGoals = await getPendingGoalsForSteven();
  
  if (!pendingGoals.length) {
    return; // No pending buildings
  }

  for (const goal of pendingGoals) {
    console.log(`\n[Steven] 📋 Processing: ${goal.id}`);
    console.log(`   Goal: ${goal.goalText?.slice(0, 60)}`);
    
    try {
      await processGoal(goal.id);
    } catch (err) {
      console.error(`[Steven] Error processing ${goal.id}:`, err instanceof Error ? err.message : err);
    }
  }
}

// ============================================================
// Process a single goal: run all pending floors
// ============================================================

async function processGoal(goalId: string): Promise<void> {
  const goal = await getGoal(goalId);
  console.log(`[Steven] 🔍 processGoal called — status=${goal.status}, steven_status=${goal.steven_status}, floors=${(await getAllFloors(goalId)).length}`);

  // Update status to 'building'
  if (goal.status === 'planning') {
    await updateGoalStatus(goalId, 'building');
  }

  const floors = await getAllFloors(goalId);
  console.log(`[Steven]    floors:`, floors.map((f) => `${f.floorNumber}(${f.name})[${f.status}]`).join(', '));
  const pendingFloors = floors.filter((f) => f.status === 'pending');
  const buildingFloors = floors.filter((f) => f.status === 'building');
  const researchingFloors = floors.filter((f) => f.status === 'researching');
  const auditingFloors = floors.filter((f) => f.status === 'auditing');

  // Include all in-progress floors (researching/building/auditing) plus the first pending floor
  const inProgressFloors = [...researchingFloors, ...buildingFloors, ...auditingFloors];
  const activeFloors = [...inProgressFloors, ...pendingFloors.slice(0, inProgressFloors.length === 0 ? 1 : 0)];
  console.log(`[Steven]    pendingFloors=${pendingFloors.length}, buildingFloors=${buildingFloors.length}, researchingFloors=${researchingFloors.length}, auditingFloors=${auditingFloors.length}, activeFloors=${activeFloors.length}`);

  if (!activeFloors.length) {
    // Check if all floors are live/blocked -- only mark done if truly finished
    const allDone = floors.every((f) => f.status === 'live' || f.status === 'blocked' || f.status === 'broken');
    if (allDone || floors.length === 0) {
      console.log(`[Steven] All floors done for ${goalId}`);
      await markStevenDone(goalId);
    } else {
      console.log(`[Steven] No active floors but some are still in progress for ${goalId} -- will check again next cycle`);
    }
    return;
  }

  for (const floor of activeFloors) {
    await processFloor(goalId, floor);
  }
}

// ============================================================
// Process a single floor using lib/steven.ts step runner
// ============================================================

/**
 * Determine which step to start from based on floor's current DB state.
 * This mirrors the logic in /api/loop/start.
 */
function determineStartStep(floor: { status: string; researchOutput?: string | null; vexGate1Report?: string | null; buildOutput?: string | null; vexGate2Report?: string | null }): StepName {
  if (floor.status === 'pending') return 'alba';

  // If floor has build output + vex2 report, resume at elira
  if (floor.buildOutput && floor.vexGate2Report) return 'elira';
  // If floor has build output, resume at vex2
  if (floor.buildOutput) return 'vex2';
  // If floor has vex1 report that was approved, resume at david
  if (floor.vexGate1Report) {
    try {
      const vex1 = JSON.parse(floor.vexGate1Report);
      if (vex1.approved) return 'david';
    } catch {
      // parse failed, restart from alba
    }
  }
  // If floor has research output, resume at vex1
  if (floor.researchOutput) return 'vex1';

  return 'alba';
}

async function processFloor(goalId: string, floor: { id: string; name: string; floorNumber: number; status: string }): Promise<void> {
  console.log(`[Steven] Floor ${floor.floorNumber}: ${floor.name} (status: ${floor.status})`);

  // Load full floor data to determine start step
  const { getFloor } = await import('../lib/building-manager');
  const fullFloor = await getFloor(floor.id);
  if (!fullFloor) {
    console.error(`[Steven]   Floor ${floor.id} not found in DB`);
    return;
  }

  // If pending, set to researching (the proper initial status)
  if (fullFloor.status === 'pending') {
    await updateFloorStatus(floor.id, 'researching');
  }

  let currentStep: StepName = determineStartStep(fullFloor);
  let currentFloorId = floor.id;
  let iteration = fullFloor.iterationCount || 1;

  console.log(`[Steven]   Starting from step="${currentStep}", iteration=${iteration}`);

  while (true) {
    console.log(`[Steven]   -> Step "${currentStep}" (iteration ${iteration})...`);
    await updateStevenHeartbeat(goalId, currentStep, floor.name);

    try {
      // Use the real step runner from lib/steven.ts
      const result = await stevenRunStep(currentFloorId, currentStep, iteration);

      console.log(`[Steven]   Step "${currentStep}" -> nextStep="${result.nextStep}", success=${result.success}`);

      if (result.nextStep === 'done') {
        // Floor (or goal) is complete
        console.log(`[Steven]   Floor ${floor.floorNumber} complete`);
        break;
      }

      // Check for max iterations (alba retry loop)
      if (result.nextStep === 'alba' && result.iteration > MAX_ITERATIONS) {
        console.log(`[Steven]   Floor ${floor.floorNumber} blocked (max iterations)`);
        await markFloorBlocked(result.floorId);
        break;
      }

      // If the floorId changed (finalize returned the NEXT floor), we're done with this floor.
      // The next floor will be picked up in the next processGoal cycle.
      if (result.floorId !== currentFloorId) {
        console.log(`[Steven]   Floor ${floor.floorNumber} live. Next floor ${result.floorId} will be processed next cycle.`);
        break;
      }

      // Advance to next step
      currentStep = result.nextStep as StepName;
      currentFloorId = result.floorId;
      iteration = result.iteration;

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Steven]   Step "${currentStep}" error: ${msg}`);

      if (iteration >= MAX_ITERATIONS) {
        await markFloorBlocked(currentFloorId);
        break;
      }

      // Retry from alba on next iteration
      currentStep = 'alba';
      iteration++;
    }

    await sleep(STEP_DELAY_MS);
  }
}

// (Old runStep, stepAgentName, getStepSystemPrompt, parseAgentResult removed.
//  Now uses stevenRunStep from lib/steven.ts which has the full agent prompts,
//  proper DB state management, and correct floor progression logic.)

// ============================================================
// Utils
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Entry
// ============================================================

main().catch((err) => {
  console.error('[Steven Runner] FATAL:', err);
  process.exit(1);
});
