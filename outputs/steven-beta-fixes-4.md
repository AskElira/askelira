# Steven Beta -- Installment 4: Fixes Log
**Date:** 2026-03-23
**Tests:** 23/23 passing

---

## SB-031 FIX: Remove usage API email parameter bypass
- **File:** `app/api/usage/route.ts`
- **Change:** Removed `emailParam` fallback. Now only uses `session.user.email` from authenticated session. Returns 401 if no session.

## SB-032 FIX: Add auth to plan route
- **File:** `app/api/goals/[id]/plan/route.ts`
- **Change:** Added getServerSession check with 401. (Auth was also added by linter; confirmed present.)

## SB-033 FIX: Remove anonymous demo access from build route
- **File:** `app/api/build/route.ts`
- **Change:** Replaced `session?.user?.email || 'demo@askelira.com'` with proper auth guard. Returns 401 if no session.

## SB-034 FIX: Add CRON_SECRET auth to loop/start
- **File:** `app/api/loop/start/[floorId]/route.ts`
- **Change:** Added CRON_SECRET check (same pattern as loop/step). Reads `x-cron-secret` header, returns 401 on mismatch. Build route already sends this header.

## SB-035 FIX: Add cleanup for stallRecoveryTimestamps
- **File:** `lib/heartbeat.ts`
- **Change:** Added `setInterval` (every 15 minutes) that deletes entries older than 1 hour. Uses `.unref()` to avoid blocking Node shutdown.

## SB-036 FIX: Replace `as any` casts with proper types in step-runner
- **File:** `lib/step-runner.ts`
- **Change:** Extended `AlbaResult` interface with optional fields: `patternValidation`, `riskAnalysis`, `swarmValidation`, `researchMetadata`. Removed all `(albaResult as any)` casts.

## SB-037 FIX: Remove unused `templateUsed` variable
- **File:** `app/api/goals/[id]/plan/route.ts`
- **Change:** Removed `let templateUsed = false;` declaration and `templateUsed = true;` assignment.

## SB-038 FIX: Add AbortController to heartbeat fetch
- **File:** `hooks/useBuilding.ts`
- **Change:** Added `AbortController` to heartbeat useEffect. Cleanup function calls `controller.abort()` to cancel stale requests when goalId changes.

## SB-039 FIX: Remove Origin header from checkout redirect URL
- **File:** `app/api/billing/checkout/route.ts`
- **Change:** Replaced `request.headers.get('origin') ?? process.env.NEXTAUTH_URL` with just `process.env.NEXTAUTH_URL`. Prevents open redirect via crafted Origin header.

## SB-040 FIX: Add ownership check to approve route
- **File:** `app/api/goals/[id]/approve/route.ts`
- **Change:** Added `goal.customerId !== session.user.email` check returning 403. Prevents IDOR where any authenticated user could approve any goal.
