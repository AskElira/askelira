/**
 * Building and floor events for Socket.io real-time updates
 * CommonJS version for server.js
 */

const BUILDING_EVENTS = {
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
};

module.exports = { BUILDING_EVENTS };
