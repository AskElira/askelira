/**
 * Intelligence API: Get patterns — Phase 8
 * GET /api/intelligence/patterns?category=lead-generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Unified auth: support both NextAuth session (web) and header-based auth (CLI)
    const auth = await authenticate(request);
    if (!auth.authenticated || !auth.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { error: 'Missing required query param: category' },
        { status: 400 },
      );
    }

    const { getPatternsByCategory } = await import('@/lib/pattern-manager');
    const patterns = await getPatternsByCategory(category);

    return NextResponse.json({
      ok: true,
      category,
      count: patterns.length,
      patterns,
    });
  } catch (err) {
    console.error('[Intelligence API] patterns error:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
