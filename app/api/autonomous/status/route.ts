import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const configPath = path.join(process.cwd(), '.autonomous-config.json');

  let config = null;
  let configured = false;

  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      configured = true;
    }
  } catch {
    // config missing or malformed
  }

  // Check for recent history
  const historyPath = path.join(process.cwd(), 'logs/autonomous-history.json');
  let lastRun = null;
  let totalIterations = 0;

  try {
    if (fs.existsSync(historyPath)) {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
      totalIterations = history.length;
      if (history.length > 0) {
        lastRun = history[history.length - 1].timestamp;
      }
    }
  } catch {
    // history missing or malformed
  }

  return NextResponse.json({
    configured,
    enabled: config?.enabled ?? false,
    config: config
      ? {
          loopInterval: config.loopInterval,
          agentCount: config.agentCount,
          maxIterations: config.maxIterations,
          allowedPaths: config.allowedPaths,
        }
      : null,
    lastRun,
    totalIterations,
  });
}
