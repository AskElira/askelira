import type { SwarmPhase } from './openclaw-orchestrator';

/**
 * Encode a SwarmPhase update as an SSE event string.
 */
export function encodeSSE(phase: SwarmPhase): string {
  return `data: ${JSON.stringify(phase)}\n\n`;
}

/**
 * Encode the final result as an SSE "done" event.
 */
export function encodeSSEDone(result: unknown): string {
  return `event: done\ndata: ${JSON.stringify(result)}\n\n`;
}

/**
 * Encode an error as an SSE "error" event.
 */
export function encodeSSEError(message: string): string {
  return `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`;
}

/**
 * Create SSE response headers for Next.js.
 */
export function sseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  };
}
