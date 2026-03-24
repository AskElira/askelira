/**
 * Simulate Building Activity API
 *
 * Demo endpoint that simulates agent activity for testing the 3D building visualization.
 * In production, these events would be emitted by your actual building logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import {
  emitAgentAction,
  emitAgentPosition,
  emitFloorStatus,
  emitAgentPositions,
} from '@/lib/socket-emitter';

const AGENT_COLORS: Record<string, string> = {
  Alba: '#4ade80',
  David: '#2dd4bf',
  Vex: '#f87171',
  Elira: '#a78bfa',
  Steven: '#facc15',
};

const AGENT_ACTIONS = [
  'researching patterns...',
  'building the floor...',
  'auditing code quality...',
  'reviewing architecture...',
  'deploying changes...',
  'running tests...',
  'fixing bugs...',
  'optimizing performance...',
];

/**
 * POST /api/building/simulate-activity
 *
 * Simulates agent activity for a building/goal
 * Body: { goalId: string, duration?: number }
 */
const MAX_SIMULATION_DURATION = 300; // 5 minutes max

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(req.headers);
    const rateCheck = checkRateLimit(`simulate:${ip}`, 5, 3600000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { goalId, duration: rawDuration = 30 } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      );
    }

    const duration = Math.min(
      Math.max(1, typeof rawDuration === 'number' ? rawDuration : 30),
      MAX_SIMULATION_DURATION,
    );

    // Start simulation
    console.log(`[Simulate] Starting activity simulation for goal: ${goalId}`);

    // Simulate agents moving between floors
    const agents = ['Alba', 'David', 'Vex', 'Elira', 'Steven'];
    const simulationId = setInterval(() => {
      // Pick random agent
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const floorNumber = Math.floor(Math.random() * 5) + 1;
      const action = AGENT_ACTIONS[Math.floor(Math.random() * AGENT_ACTIONS.length)];

      // Emit agent action
      emitAgentAction(goalId, {
        agent,
        action: action.replace('...', ''),
        floorId: `floor-${floorNumber}`,
        iteration: floorNumber,
        reason: `Working on Floor ${floorNumber}`,
      });

      // Emit agent position for 3D visualization
      emitAgentPosition(goalId, {
        agentId: agent.toLowerCase(),
        agentName: agent,
        currentFloor: floorNumber - 1,
        targetFloor: floorNumber,
        action,
        color: AGENT_COLORS[agent],
        timestamp: new Date().toISOString(),
      });

      // Occasionally update floor status
      if (Math.random() > 0.7) {
        const statuses = ['researching', 'building', 'auditing', 'live'] as const;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        emitFloorStatus(goalId, {
          floorId: `floor-${floorNumber}`,
          status,
        });
      }
    }, 2000); // Every 2 seconds

    // Stop after duration
    setTimeout(() => {
      clearInterval(simulationId);
      console.log(`[Simulate] Stopped activity simulation for goal: ${goalId}`);
    }, duration * 1000);

    return NextResponse.json({
      success: true,
      message: `Simulating activity for ${duration} seconds`,
      goalId,
    });
  } catch (error) {
    console.error('[Simulate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate activity' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/building/simulate-activity?goalId=xxx
 *
 * Start a quick 10-second simulation
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const goalId = searchParams.get('goalId');

  if (!goalId) {
    return NextResponse.json(
      { error: 'goalId parameter is required' },
      { status: 400 }
    );
  }

  // Quick 10-second simulation
  const agents = ['Alba', 'David', 'Vex', 'Elira', 'Steven'];
  const allPositions = agents.map((agent, index) => ({
    agentId: agent.toLowerCase(),
    agentName: agent,
    currentFloor: index,
    targetFloor: index + 1,
    action: AGENT_ACTIONS[index % AGENT_ACTIONS.length],
    color: AGENT_COLORS[agent],
    timestamp: new Date().toISOString(),
  }));

  // Emit all agent positions at once
  emitAgentPositions(goalId, allPositions);

  return NextResponse.json({
    success: true,
    message: 'Simulated agent positions emitted',
    goalId,
    agentCount: agents.length,
  });
}
