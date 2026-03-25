/**
 * Intelligence API: Get category stats — Phase 8
 * GET /api/intelligence/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Unified auth: support both NextAuth session (web) and header-based auth (CLI)
    const auth = await authenticate(req);
    if (!auth.authenticated || !auth.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
