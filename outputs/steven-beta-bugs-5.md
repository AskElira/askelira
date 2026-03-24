# Steven Beta -- Installment 5: Bug Report
**Date:** 2026-03-23
**Domain:** Ownership checks, input validation, code quality

---

## SB-041 BUG: Goal detail endpoint has no auth at all (CRITICAL)
- **File:** `app/api/goals/[id]/route.ts`
- **Issue:** GET handler has zero authentication. No `getServerSession` import. Any unauthenticated user can read any goal's full details including floors, logs, Steven suggestions, customerContext, and build outputs.

## SB-042 BUG: Expand endpoint has no ownership check (MEDIUM)
- **File:** `app/api/goals/[id]/expand/route.ts`
- **Issue:** Has auth but never verifies `goal.customerId === session.user.email`. Any authenticated user can add expansion floors to any goal.

## SB-043 BUG: Snapshots endpoint has no ownership check (MEDIUM)
- **File:** `app/api/floors/[floorId]/snapshots/route.ts`
- **Issue:** Has auth but doesn't verify the floor's goal belongs to the authenticated user. Any authenticated user can view snapshots for any floor.

## SB-044 BUG: Heartbeat start has no ownership check (MEDIUM)
- **File:** `app/api/heartbeat/[goalId]/start/route.ts`
- **Issue:** Has auth but no ownership check. Any authenticated user can start heartbeat monitoring on any goal, wasting system resources (LLM calls every 5 minutes).

## SB-045 BUG: Heartbeat GET/POST has no ownership check (MEDIUM)
- **File:** `app/api/heartbeat/[goalId]/route.ts`
- **Issue:** Both GET and POST have auth but no ownership. Any authenticated user can view heartbeat status and trigger manual floor health checks for any goal.

## SB-046 BUG: Rollback endpoint has no ownership check (MEDIUM)
- **File:** `app/api/floors/[floorId]/rollback/route.ts`
- **Issue:** Has auth and loads the goal (line 47) but never checks ownership. Any authenticated user can rollback any floor.

## SB-047 BUG: Goal creation has no goalText length limit (LOW)
- **File:** `app/api/goals/new/route.ts`
- **Issue:** `goalText` is checked for truthiness and type but has no length limit. An attacker can send megabytes of text stored directly in the database.

## SB-048 BUG: Expand has no input length limits (LOW)
- **File:** `app/api/goals/[id]/expand/route.ts`
- **Issue:** `name`, `description`, `successCondition` are checked for truthiness but not length. Very large strings could be stored in the database.

## SB-049 BUG: workspace-manager.ts uses @ts-nocheck (MEDIUM)
- **File:** `lib/workspace/workspace-manager.ts`
- **Issue:** Line 1: `// @ts-nocheck` suppresses all TypeScript type checking. This hides potential type errors and reduces code safety. Should be removed.

## SB-050 BUG: Plan route has no ownership check (MEDIUM)
- **File:** `app/api/goals/[id]/plan/route.ts`
- **Issue:** Has auth but never verifies ownership. Any authenticated user can trigger expensive Elira LLM planning calls (up to 60s) on any goal.
