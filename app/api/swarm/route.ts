import { NextRequest, NextResponse } from 'next/server';
import { runSwarmDebate } from '@/lib/openclaw-orchestrator';
import { encodeSSE, encodeSSEDone, encodeSSEError, sseHeaders } from '@/lib/progress-tracker';
import { cacheSet } from '@/lib/swarm-cache';
import { authenticate } from '@/lib/auth-helpers';
import { checkUsage, getTierForEmail } from '@/lib/tiers';
// [AUTO-ADDED] BUG-1-09: Rate limit unauthenticated swarm requests
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

async function getUserUsageData(email: string) {
  try {
    const { getUserUsage, incrementDebateCount } = await import('@/lib/db');
    const usage = await getUserUsage(email);
    return { usage, incrementDebateCount };
  } catch {
    // No DB — mock for local dev
    return {
      usage: { email, plan: 'free' as const, debatesUsed: 0 },
      incrementDebateCount: async () => {},
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question, stream } = await req.json();

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 },
      );
    }

    const trimmed = question.trim();

    // Rate limit check -- use unified auth (supports both web + CLI)
    const authResult = await authenticate(req);
    const email = authResult.authenticated ? authResult.email : null;

    if (email) {
      const { usage, incrementDebateCount: increment } = await getUserUsageData(email);
      const tier = getTierForEmail(email, usage.plan);
      const usageCheck = checkUsage(email, usage.plan, usage.debatesUsed);

      if (!usageCheck.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Upgrade your plan for more debates.',
            tier: tier.name,
            limit: tier.monthlyDebates,
            used: usage.debatesUsed,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(tier.unlimited ? 'unlimited' : tier.monthlyDebates),
              'X-RateLimit-Remaining': '0',
            },
          },
        );
      }

      // SSE streaming mode
      if (stream) {
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              const result = await runSwarmDebate(trimmed, (phase) => {
                controller.enqueue(encoder.encode(encodeSSE(phase)));
              });
              cacheSet(result);
              await increment(email);
              controller.enqueue(encoder.encode(encodeSSEDone(result)));
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Internal server error';
              controller.enqueue(encoder.encode(encodeSSEError(message)));
            } finally {
              controller.close();
            }
          },
        });

        return new Response(readable, { headers: sseHeaders() });
      }

      // Standard JSON mode
      const result = await runSwarmDebate(trimmed);
      cacheSet(result);
      await increment(email);

      return NextResponse.json(result, {
        headers: {
          'X-RateLimit-Limit': String(tier.unlimited ? 'unlimited' : tier.monthlyDebates),
          'X-RateLimit-Remaining': String(Math.max(0, usageCheck.remaining - 1)),
        },
      });
    }

    // No session — rate limit by IP to prevent credit abuse
    // [AUTO-ADDED] BUG-1-09: Unauthenticated users get 3 debates/hour per IP.
    // Each debate costs ~$0.024 in LLM calls. Without this, attackers can
    // burn API credits at $86.40/hour per thread.
    const ip = getClientIp(req.headers);
    const anonRateCheck = checkRateLimit(`swarm_anon:${ip}`, 3, 3600000);
    if (!anonRateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Sign in for higher limits.' },
        { status: 429 },
      );
    }

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const result = await runSwarmDebate(trimmed, (phase) => {
              controller.enqueue(encoder.encode(encodeSSE(phase)));
            });
            cacheSet(result);
            controller.enqueue(encoder.encode(encodeSSEDone(result)));
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Internal server error';
            controller.enqueue(encoder.encode(encodeSSEError(message)));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, { headers: sseHeaders() });
    }

    const result = await runSwarmDebate(trimmed);
    cacheSet(result);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[API /swarm]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
