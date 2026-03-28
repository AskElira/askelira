'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { BUILDING_EVENTS } from '@/lib/events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FloorState {
  id: string;
  floorNumber: number;
  name: string;
  description: string;
  successCondition: string;
  status:
    | 'pending'
    | 'researching'
    | 'building'
    | 'auditing'
    | 'live'
    | 'broken'
    | 'blocked';
  handoffNotes?: string;
  iterationCount: number;
}

export interface AgentActivity {
  agent: string;
  action: string;
  floorId?: string;
  iteration?: number;
  reason?: string;
  timestamp: Date;
}

export interface PendingExpansion {
  name: string;
  description: string;
  successCondition: string;
}

export interface BuildingState {
  goalId: string;
  goalText: string;
  buildingSummary: string;
  status: string;
  floors: FloorState[];
  latestActivity: AgentActivity[];
  isGoalMet: boolean;
  stevenSuggestions: string[];
  heartbeatActive: boolean;
  lastHeartbeatAt: Date | null;
  currentAgent: string | null;
  currentStep: string | null;
  pendingExpansions: PendingExpansion[];
}

// ---------------------------------------------------------------------------
// Parse API response into BuildingState
// ---------------------------------------------------------------------------

interface ApiGoal {
  id: string;
  goalText: string;
  buildingSummary: string | null;
  status: string;
  [key: string]: unknown;
}

interface ApiFloor {
  id: string;
  floorNumber: number;
  name: string;
  description: string | null;
  successCondition: string;
  status: FloorState['status'];
  handoffNotes: string | null;
  iterationCount: number;
  [key: string]: unknown;
}

interface ApiLog {
  agentName: string;
  action: string;
  floorId?: string;
  iteration?: number;
  outputSummary?: string;
  timestamp: string;
  [key: string]: unknown;
}

interface ApiResponse {
  goal: ApiGoal;
  floors: ApiFloor[];
  recentLogs: ApiLog[];
  stevenSuggestions: string[];
  pendingExpansions?: PendingExpansion[];
}

function parseApiResponse(data: ApiResponse): BuildingState {
  return {
    goalId: data.goal.id,
    goalText: data.goal.goalText,
    buildingSummary: data.goal.buildingSummary ?? '',
    status: data.goal.status,
    floors: data.floors.map((f) => ({
      id: f.id,
      floorNumber: f.floorNumber,
      name: f.name,
      description: f.description ?? '',
      successCondition: f.successCondition,
      status: f.status,
      handoffNotes: f.handoffNotes ?? undefined,
      iterationCount: f.iterationCount,
    })),
    latestActivity: data.recentLogs.map((l) => ({
      agent: l.agentName,
      action: l.action,
      floorId: l.floorId,
      iteration: l.iteration,
      reason: l.outputSummary,
      timestamp: new Date(l.timestamp),
    })),
    isGoalMet: data.goal.status === 'goal_met',
    stevenSuggestions: data.stevenSuggestions ?? [],
    heartbeatActive: false, // updated via heartbeat fetch + socket
    lastHeartbeatAt: null,
    pendingExpansions: data.pendingExpansions ?? [],
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBuildingState(goalId: string) {
  const [building, setBuilding] = useState<BuildingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const socketConnected = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch building data from API (silent = true skips setting isLoading, for background polls)
  const fetchBuilding = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      // Support guest mode: read customerId from localStorage if set
      const customerId = typeof window !== 'undefined' ? localStorage.getItem('askelira_customer_id') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customerId) headers['x-customer-id'] = customerId;
      const res = await fetch(`/api/goals/${goalId}`, { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      setBuilding(parseApiResponse(data));
      if (!silent) setError(null);
    } catch (err: unknown) {
      if (!silent) {
        const message = err instanceof Error ? err.message : 'Failed to load building';
        setError(message);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [goalId]);

  // Initial fetch
  useEffect(() => {
    fetchBuilding(false);
  }, [fetchBuilding]);

  // Polling fallback -- always poll every 8 seconds. If Socket.io is connected,
  // poll less frequently (30s) as a safety net; otherwise poll at 8s for freshness.
  useEffect(() => {
    if (!goalId) return;

    function startPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      const interval = socketConnected.current ? 30_000 : 8_000;
      pollRef.current = setInterval(() => {
        fetchBuilding(true);
      }, interval);
    }

    startPolling();

    // Re-adjust polling interval when socket connection changes
    const checkInterval = setInterval(() => {
      startPolling();
    }, 15_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearInterval(checkInterval);
    };
  }, [goalId, fetchBuilding]);

  // Fetch heartbeat status (separate endpoint, not included in goals API)
  // Polls every 10 seconds to keep heartbeat info fresh
  useEffect(() => {
    if (!goalId) return;
    let cancelled = false;

    async function fetchHeartbeat() {
      try {
        const customerId = typeof window !== 'undefined' ? localStorage.getItem('askelira_customer_id') : null;
        const headers: Record<string, string> = {};
        if (customerId) headers['x-customer-id'] = customerId;
        const res = await fetch(`/api/heartbeat/${goalId}`, { headers });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!data?.status || cancelled) return;
        setBuilding((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            heartbeatActive: data.status.active ?? false,
            lastHeartbeatAt: data.status.lastCheckedAt ? new Date(data.status.lastCheckedAt) : null,
            currentAgent: data.status.currentAgent ?? null,
            currentStep: data.status.currentStep ?? null,
          };
        });
      } catch {
        /* best-effort */
      }
    }

    fetchHeartbeat();
    const interval = setInterval(fetchHeartbeat, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [goalId]);

  // Socket.io real-time updates
  useEffect(() => {
    if (!goalId) return;

    let socket: Socket;
    try {
      socket = io({
        path: '/api/socketio',
        query: { goalId },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 3,
        timeout: 5000,
      });
    } catch {
      // Socket.io unavailable -- polling will handle updates
      return;
    }

    socketRef.current = socket;

    socket.on('connect', () => {
      socketConnected.current = true;
    });

    socket.on('disconnect', () => {
      socketConnected.current = false;
    });

    socket.on('connect_error', () => {
      socketConnected.current = false;
    });

    // Floor status changed
    socket.on(BUILDING_EVENTS.FLOOR_STATUS, (payload: { floorId: string; status: FloorState['status'] }) => {
      setBuilding((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          floors: prev.floors.map((f) =>
            f.id === payload.floorId ? { ...f, status: payload.status } : f,
          ),
        };
      });
    });

    // Floor went live
    socket.on(BUILDING_EVENTS.FLOOR_LIVE, (payload: { floorId: string; handoffNotes?: string }) => {
      setBuilding((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          floors: prev.floors.map((f) =>
            f.id === payload.floorId
              ? { ...f, status: 'live' as const, handoffNotes: payload.handoffNotes }
              : f,
          ),
        };
      });
    });

    // Floor blocked
    socket.on(BUILDING_EVENTS.FLOOR_BLOCKED, (payload: { floorId: string }) => {
      setBuilding((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          floors: prev.floors.map((f) =>
            f.id === payload.floorId ? { ...f, status: 'blocked' as const } : f,
          ),
        };
      });
    });

    // Floor broken
    socket.on(BUILDING_EVENTS.FLOOR_BROKEN, (payload: { floorId: string }) => {
      setBuilding((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          floors: prev.floors.map((f) =>
            f.id === payload.floorId ? { ...f, status: 'broken' as const } : f,
          ),
        };
      });
    });

    // Floor healthy (from heartbeat)
    socket.on(BUILDING_EVENTS.FLOOR_HEALTHY, (payload: { floorId: string }) => {
      setBuilding((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          floors: prev.floors.map((f) =>
            f.id === payload.floorId ? { ...f, status: 'live' as const } : f,
          ),
        };
      });
    });

    // Agent action
    socket.on(
      BUILDING_EVENTS.AGENT_ACTION,
      (payload: { agent: string; action: string; floorId?: string; iteration?: number; reason?: string }) => {
        setBuilding((prev) => {
          if (!prev) return prev;
          const activity: AgentActivity = {
            agent: payload.agent,
            action: payload.action,
            floorId: payload.floorId,
            iteration: payload.iteration,
            reason: payload.reason,
            timestamp: new Date(),
          };
          return {
            ...prev,
            latestActivity: [activity, ...prev.latestActivity].slice(0, 50),
          };
        });
      },
    );

    // Goal met
    socket.on(BUILDING_EVENTS.GOAL_MET, () => {
      setBuilding((prev) => {
        if (!prev) return prev;
        return { ...prev, isGoalMet: true, status: 'goal_met' };
      });
    });

    // Building approved
    socket.on(BUILDING_EVENTS.APPROVED, () => {
      setBuilding((prev) => {
        if (!prev) return prev;
        return { ...prev, status: 'building' };
      });
    });

    // Heartbeat
    socket.on(
      BUILDING_EVENTS.HEARTBEAT,
      (payload: { active?: boolean; suggestion?: string }) => {
        setBuilding((prev) => {
          if (!prev) return prev;
          const suggestions = payload.suggestion
            ? [...prev.stevenSuggestions, payload.suggestion]
            : prev.stevenSuggestions;
          return {
            ...prev,
            heartbeatActive: payload.active ?? prev.heartbeatActive,
            lastHeartbeatAt: new Date(),
            stevenSuggestions: suggestions,
          };
        });
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      socketConnected.current = false;
    };
  }, [goalId]);

  // Public refetch always shows loading state
  const refetch = useCallback(() => fetchBuilding(false), [fetchBuilding]);

  return { building, isLoading, error, refetch };
}
