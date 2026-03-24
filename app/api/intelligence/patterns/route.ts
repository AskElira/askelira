/**
 * Intelligence API: Get patterns — Phase 8
 * GET /api/intelligence/patterns?category=lead-generation
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
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
