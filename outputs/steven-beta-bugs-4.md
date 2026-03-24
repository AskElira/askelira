# Steven Beta -- Installment 4: Bug Report
**Date:** 2026-03-23
**Domain:** API auth, data access, type safety, memory leaks, frontend

---

## SB-031 BUG: Usage API email parameter bypass (HIGH)
- **File:** `app/api/usage/route.ts`
- **Issue:** Line 10: `const email = session?.user?.email || emailParam;` — identical to the debates bypass fixed in SB-022. Unauthenticated user can query any user's usage/tier data via `?email=victim@example.com`.

## SB-032 BUG: Plan route has no authentication (HIGH)
- **File:** `app/api/goals/[id]/plan/route.ts`
- **Issue:** No `getServerSession` call. Anyone can trigger expensive Elira LLM planning calls (up to 60s) for any goal.

## SB-033 BUG: Build route allows anonymous demo access (HIGH)
- **File:** `app/api/build/route.ts`
- **Issue:** Line 43: `const email = session?.user?.email || 'demo@askelira.com';` — unauthenticated users can create goals, floors, and trigger the full 5-agent building pipeline (Alba → Vex → David → Vex → Elira) as demo@askelira.com.

## SB-034 BUG: Loop start has no auth (HIGH)
- **File:** `app/api/loop/start/[floorId]/route.ts`
- **Issue:** No session auth and no CRON_SECRET check. Anyone with a valid floorId can trigger the building loop (expensive LLM calls). Only rate-limited to 10/hour.

## SB-035 BUG: stallRecoveryTimestamps memory leak (MEDIUM)
- **File:** `lib/heartbeat.ts`
- **Issue:** Line 814: `const stallRecoveryTimestamps = new Map<string, number>();` — entries are added per floor ID but never removed. Unlike the heartbeatRegistry (cleaned by `stopHeartbeat()`) and rate-limiter (cleanup timer), this Map grows indefinitely.

## SB-036 BUG: Unsafe `as any` type casts in step-runner (MEDIUM)
- **File:** `lib/step-runner.ts`
- **Issue:** Lines 878-881: Four `(albaResult as any).field` casts to extract `patternValidation`, `riskAnalysis`, `swarmValidation`, `researchMetadata`. The `AlbaResult` interface (line 67) doesn't include these fields. Should use a proper extended type.

## SB-037 BUG: Unused `templateUsed` variable in plan route (LOW)
- **File:** `app/api/goals/[id]/plan/route.ts`
- **Issue:** Line 74: `let templateUsed = false;` — set to `true` on line 94 but never read. Dead variable.

## SB-038 BUG: Heartbeat fetch has no abort cleanup (LOW)
- **File:** `hooks/useBuilding.ts`
- **Issue:** The heartbeat useEffect (line ~164) calls `fetch(/api/heartbeat/${goalId})` but returns no cleanup function. If `goalId` changes rapidly, stale responses can update state for the wrong building.

## SB-039 BUG: Checkout success_url uses unvalidated Origin header (MEDIUM)
- **File:** `app/api/billing/checkout/route.ts`
- **Issue:** Line 66-67: `const origin = request.headers.get('origin') ?? process.env.NEXTAUTH_URL`. An attacker can send a crafted Origin header causing Stripe to redirect to a malicious URL after checkout (open redirect).

## SB-040 BUG: Approve route has no ownership check (MEDIUM)
- **File:** `app/api/goals/[id]/approve/route.ts`
- **Issue:** Has auth check but never verifies `goal.customerId === session.user.email`. Any authenticated user can approve any other user's goal by ID (IDOR).
