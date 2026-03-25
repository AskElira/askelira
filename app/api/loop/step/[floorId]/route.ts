/**
 * Step-based Building Loop API
 *
 * Runs agent steps sequentially within a single invocation, batching as many
 * steps as can fit within the ~50s budget (leaving 10s buffer from the 60s
 * Hobby plan limit).
 *
 * When time runs out, returns the next step and floor ID so the caller can
 * trigger a follow-up invocation.
 *
 * Usage: POST /api/loop/step/{floorId}?step=alba&iteration=1
 * Auth: x-cron-secret header must match CRON_SECRET env var (if set)
 */

import { NextRequest, NextResponse } from 'next/server';
import { safeWaitUntil, getInternalBaseUrl, fetchWithRetry } from '@/lib/internal-fetch';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Maximum time budget in ms (50s of 60s limit, leaving 10s for response + overhead)
const TIME_BUDGET_MS = 50_000;

export async function POST(
  req: NextRequest,
  { params }: { params: { floorId: string } },
) {
  const startTime = Date.now();

  try {
    let floorId = params.floorId;
    const { searchParams } = req.nextUrl;
    let step = searchParams.get('step') || 'alba';
    let iteration = parseInt(searchParams.get('iteration') || '1', 10);

    if (!floorId) {
      return NextResponse.json({ error: 'floorId is required' }, { status: 400 });
    }

    // Auth: require CRON_SECRET for internal chain calls
    // Phase 5.3: Fixed -- must reject if CRON_SECRET not configured (was bypass)
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('[API /loop/step] CRON_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }
    const provided = req.headers.get('x-cron-secret');
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate step name
    const validSteps = ['alba', 'vex1', 'david', 'vex2', 'elira', 'finalize'];
    if (!validSteps.includes(step)) {
      return NextResponse.json(
        { error: `Invalid step: ${step}. Valid: ${validSteps.join(', ')}` },
        { status: 400 },
      );
    }

    console.log(`[API /loop/step] Starting batch from step="${step}" floor=${floorId} iteration=${iteration}`);

    const steven = await import('@/lib/steven');

    // Run steps sequentially until time runs out or we're done
    const completedSteps: string[] = [];
    let lastResult: Awaited<ReturnType<typeof steven.runStep>> | null = null;
    let currentStep = step;
    let currentFloorId = floorId;
    let currentIteration = iteration;

    // Estimated step durations (conservative, in ms)
    const stepDurations: Record<string, number> = {
      alba: 45_000, // Includes OpenResearch, Brave Search, validations
      vex1: 15_000,
      david: 35_000,
      vex2: 15_000,
      elira: 15_000,
      finalize: 10_000,
    };

    while (true) {
      const elapsed = Date.now() - startTime;
      const remaining = TIME_BUDGET_MS - elapsed;
      const estimatedDuration = stepDurations[currentStep] ?? 20_000;

      // Only start a step if we have enough estimated time for it
      if (remaining < estimatedDuration && completedSteps.length > 0) {
        console.log(`[API /loop/step] Not enough time for "${currentStep}" (need ~${estimatedDuration}ms, have ${remaining}ms). Stopping.`);
        break;
      }

      console.log(`[API /loop/step] Running step="${currentStep}" (${remaining}ms remaining, est ${estimatedDuration}ms)`);

      try {
        lastResult = await steven.runStep(
          currentFloorId,
          currentStep as 'alba' | 'vex1' | 'david' | 'vex2' | 'elira' | 'finalize',
          currentIteration,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[API /loop/step] Step "${currentStep}" error: ${msg}`);

        if (completedSteps.length === 0) {
          // First step failed, return error
          return NextResponse.json(
            { error: msg, step: currentStep, floorId: currentFloorId, iteration: currentIteration, durationMs: Date.now() - startTime },
            { status: 500 },
          );
        }
        // Some steps completed, return partial success
        break;
      }

      completedSteps.push(currentStep);
      console.log(`[API /loop/step] Step "${currentStep}" completed: nextStep=${lastResult.nextStep}`);

      // Check if we're done
      if (lastResult.nextStep === 'done') {
        break;
      }

      // Check for max iterations exceeded
      if (lastResult.nextStep === 'alba' && lastResult.iteration > 5) {
        await steven.markFloorBlocked(lastResult.floorId);
        break;
      }

      // Prepare for next step
      currentStep = lastResult.nextStep;
      currentFloorId = lastResult.floorId;
      currentIteration = lastResult.iteration;
    }

    const totalDuration = Date.now() - startTime;
    const needsContinuation = lastResult?.nextStep !== 'done' && lastResult?.nextStep !== undefined;

    // If there are remaining steps, fire continuation to self.
    // Use waitUntil to keep the function alive and await the fetch with a short
    // timeout — just long enough for the request to reach Vercel's edge and spawn
    // a new function invocation.
    if (needsContinuation && lastResult) {
      const baseUrl = getInternalBaseUrl();
      const contFloorId = lastResult.floorId;
      const contStep = lastResult.nextStep;
      const contIteration = lastResult.iteration;
      const continueUrl = `${baseUrl}/api/loop/step/${contFloorId}?step=${contStep}&iteration=${contIteration}`;
      console.log(`[API /loop/step] Firing continuation: ${continueUrl}`);

      safeWaitUntil(
        fetchWithRetry({ url: continueUrl, tag: 'API /loop/step' }).then(() => {}),
      );
    }

    const response = {
      completedSteps,
      lastResult,
      nextStep: lastResult?.nextStep ?? 'done',
      nextFloorId: lastResult?.floorId ?? currentFloorId,
      nextIteration: lastResult?.iteration ?? currentIteration,
      durationMs: totalDuration,
      needsContinuation,
    };

    console.log(`[API /loop/step] Batch complete: ${completedSteps.join(' -> ')} (${totalDuration}ms)`);

    return NextResponse.json(response);
  } catch (err) {
    console.error(`[API /loop/step] Fatal error:`, err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Build step failed', durationMs: Date.now() - startTime },
      { status: 500 },
    );
  }
}
