# Steven Beta -- Installment 2: Fixes Log
**Date:** 2026-03-23
**Tests:** 18/18 passing

---

## SB-011 FIX: Swap rate limit/validation order in goals/plan
- **File:** `app/api/goals/[id]/plan/route.ts`
- **Change:** Moved goalId null check before checkRateLimit call.

## SB-012 FIX: Add auth + user-scoped filter to billing/status
- **File:** `app/api/billing/status/route.ts`
- **Change:** Added getServerSession check with 401 response. Added WHERE clause filtering by customer_id = session.user.email.
- **Rationale:** Prevented information disclosure of all customer subscriptions.

## SB-013 FIX: Call onError from EventSource onerror handler
- **File:** `components/SwarmProgress.tsx`
- **Change:** Added `onError('Connection lost')` call before `source.close()` in the onerror handler.

## SB-014 FIX: Remove API key prefix and env var name leaks
- **File:** `app/api/test-anthropic/route.ts`
- **Change:** Removed `apiKeyPrefix: apiKey.substring(0, 15)` and `envKeys: Object.keys(process.env).filter(...)`.

## SB-015 FIX: Add skeleton-pulse CSS keyframe animation
- **File:** `app/globals.css`
- **Change:** Added `@keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`.

## SB-016 FIX: Add steven-pulse CSS keyframe animation
- **File:** `app/globals.css`
- **Change:** Added `@keyframes steven-pulse` with box-shadow breathing effect.

## SB-017 FIX: Add auth to heartbeat/start
- **File:** `app/api/heartbeat/[goalId]/start/route.ts`
- **Change:** Added getServerSession check with 401.

## SB-018 FIX: Add auth to floors/rollback
- **File:** `app/api/floors/[floorId]/rollback/route.ts`
- **Change:** Added getServerSession check with 401.

## SB-019 FIX: Add auth to goals/expand
- **File:** `app/api/goals/[id]/expand/route.ts`
- **Change:** Added getServerSession check with 401.

## SB-020 FIX: Add auth to billing/checkout
- **File:** `app/api/billing/checkout/route.ts`
- **Change:** Added getServerSession check with 401. Used `authSession` name to avoid conflict with Stripe `session` variable.
