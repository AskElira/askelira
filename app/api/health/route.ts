/**
 * Health check endpoint
 * Returns server status and uptime
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'AskElira 2.1',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '2.1.0',
    },
    { status: 200 }
  );
}
