/**
 * Intelligence API: Get category stats — Phase 8
 * GET /api/intelligence/stats
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { getAllCategoryStats } = await import('@/lib/pattern-manager');
    const stats = await getAllCategoryStats();

    return NextResponse.json({
      ok: true,
      totalCategories: stats.length,
      stats,
    });
  } catch (err) {
    console.error('[Intelligence API] stats error:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
