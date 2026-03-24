# Steven Beta -- Installment 2: Bug Report
**Date:** 2026-03-23
**Domain:** Frontend, Dashboard UI, Config, Integration

---

## SB-011: goals/plan rate-limits before validating goalId
- **File:** `app/api/goals/[id]/plan/route.ts`
- **Lines:** 14-29
- **Description:** Same pattern as SB-005/006. Rate limit check at L14 runs before goalId null check at L24.
- **Severity:** LOW

## SB-012: billing/status endpoint has no auth -- leaks all subscriptions
- **File:** `app/api/billing/status/route.ts`
- **Lines:** 3-21
- **Description:** `GET /api/billing/status` returns ALL subscriptions from ALL customers joined with goal data. No session check. Anyone can enumerate all paid customers and their goals.
- **Severity:** HIGH

## SB-013: SwarmProgress onerror silently swallows connection failures
- **File:** `components/SwarmProgress.tsx`
- **Lines:** 68-70
- **Description:** The EventSource `onerror` handler calls `source.close()` but never invokes the `onError` callback. If the SSE connection drops (network issue, server restart), the UI shows phase indicators stuck at "running" forever with no error message.
- **Severity:** MEDIUM

## SB-014: test-anthropic endpoint leaks API key prefix and env var names
- **File:** `app/api/test-anthropic/route.ts`
- **Lines:** 9, 34
- **Description:** Line 9 returns `Object.keys(process.env).filter(k => k.includes('ANTHROPIC'))` -- reveals all Anthropic-related env var names. Line 34 returns `apiKey.substring(0, 15)` -- leaks 15 characters of the API key. These are useful to attackers.
- **Severity:** HIGH

## SB-015: skeleton-pulse CSS keyframe animation is never defined
- **File:** `app/globals.css` (missing definition)
- **Referenced in:** `components/BuildingLoadingSkeleton.tsx`, `app/buildings/page.tsx`
- **Description:** Multiple components use `animation: 'skeleton-pulse 1.5s ease-in-out infinite'` but the `@keyframes skeleton-pulse` rule doesn't exist in any stylesheet. Loading skeletons appear static instead of pulsing.
- **Severity:** MEDIUM

## SB-016: steven-pulse CSS keyframe animation is never defined
- **File:** `app/globals.css` (missing definition)
- **Referenced in:** `components/StevenStatus.tsx`
- **Description:** StevenStatus uses `animation: heartbeatActive ? 'steven-pulse 2s ease-in-out infinite' : 'none'` but `@keyframes steven-pulse` doesn't exist. The heartbeat status dot never animates.
- **Severity:** LOW

## SB-017: floors/rollback endpoint has no auth
- **File:** `app/api/floors/[floorId]/rollback/route.ts`
- **Lines:** 3-6
- **Description:** `POST /api/floors/{id}/rollback` rolls back floor state with no session check. Anyone who knows a floor UUID can roll back production builds.
- **Severity:** HIGH

## SB-018: heartbeat/start endpoint has no auth
- **File:** `app/api/heartbeat/[goalId]/start/route.ts`
- **Lines:** 3-6
- **Description:** `POST /api/heartbeat/{id}/start` starts a heartbeat timer consuming server resources with no session check. Can be abused for DoS.
- **Severity:** MEDIUM

## SB-019: goals/expand endpoint has no auth
- **File:** `app/api/goals/[id]/expand/route.ts`
- **Lines:** 3-6
- **Description:** `POST /api/goals/{id}/expand` creates new floors and triggers building loops with no session check. Anyone who knows a goal UUID can add floors and burn API credits.
- **Severity:** HIGH

## SB-020: billing/checkout endpoint has no auth
- **File:** `app/api/billing/checkout/route.ts`
- **Lines:** 4-6
- **Description:** `POST /api/billing/checkout` creates Stripe checkout sessions for any goal without verifying the caller owns the goal. While the attacker still needs to pay, they could enumerate goal metadata and create spam checkout sessions.
- **Severity:** MEDIUM
