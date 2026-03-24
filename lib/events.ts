export const BUILDING_EVENTS = {
  APPROVED: 'building:approved',
  GOAL_MET: 'building:goal_met',
  FLOOR_STATUS: 'floor:status_change',
  FLOOR_LIVE: 'floor:live',
  FLOOR_BLOCKED: 'floor:blocked',
  FLOOR_HEALTHY: 'floor:healthy',
  FLOOR_BROKEN: 'floor:broken',
  AGENT_ACTION: 'agent:action',
  HEARTBEAT: 'building:heartbeat',
  EXPANSION_SUGGESTED: 'building:expansion_suggested',
  SYNTAX_VALID: 'syntax:valid',
  SYNTAX_INVALID: 'syntax:invalid',
} as const;

export type BuildingEvent = typeof BUILDING_EVENTS[keyof typeof BUILDING_EVENTS];

export const GATEWAY_EVENTS = {
  GATEWAY_CONNECTED: 'gateway:connected',
  GATEWAY_DISCONNECTED: 'gateway:disconnected',
  GATEWAY_ERROR: 'gateway:error',
  GATEWAY_CIRCUIT_OPEN: 'gateway:circuit_open',
  GATEWAY_CIRCUIT_RESET: 'gateway:circuit_reset',
  GATEWAY_REQUEST_ROUTED: 'gateway:request_routed',
  GATEWAY_FALLBACK_USED: 'gateway:fallback_used',
} as const;

export type GatewayEvent = typeof GATEWAY_EVENTS[keyof typeof GATEWAY_EVENTS];
