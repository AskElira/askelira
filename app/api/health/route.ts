/**
 * Health check endpoint -- Updated by Steven Delta SD-007
 * Returns server status, uptime, and database connectivity.
 */
import { NextResponse } from 'next/server';
import packageJson from '@/package.json';

export async function GET() {
  const health: Record<string, unknown> = {
    status: 'ok',
    service: 'AskElira 2.1',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: packageJson.version,
  };

  // SD-007: Database health check
  try {
    const { sql } = await import('@vercel/postgres');
    const start = Date.now();
    await sql`SELECT 1`;
    health.database = {
      status: 'connected',
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    health.database = {
      status: 'disconnected',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
    health.status = 'degraded';
  }

  // Feature 30: Gateway health info
  try {
    const { getGatewayClient } = await import('@/lib/gateway-client');
    const client = getGatewayClient();
    if (client) {
      health.gateway = client.getHealthInfo();
    } else {
      health.gateway = { status: 'not_configured' };
    }
  } catch {
    health.gateway = { status: 'unavailable' };
  }

  // Feature 30: Routing metrics
  try {
    const { getRoutingMetrics } = await import('@/lib/agent-router');
    health.routing = getRoutingMetrics();
  } catch {
    // agent-router not available
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
