# Steven Beta -- Installment 5: Fixes Log
**Date:** 2026-03-23
**Tests:** 16/16 passing

---

## SB-041 FIX: Add auth + ownership to goal detail
- **File:** `app/api/goals/[id]/route.ts`
- **Change:** Added getServerSession import with 401 guard. Added `goal.customerId !== session.user.email` ownership check returning 404.

## SB-042 FIX: Add ownership check to expand
- **File:** `app/api/goals/[id]/expand/route.ts`
- **Change:** Added `goal.customerId !== session.user.email` check after loading goal.

## SB-043 FIX: Add ownership check to snapshots
- **File:** `app/api/floors/[floorId]/snapshots/route.ts`
- **Change:** Added `getGoal` to imports. After loading floor, loads goal and verifies `goal.customerId !== session.user.email`.

## SB-044 FIX: Add ownership check to heartbeat start
- **File:** `app/api/heartbeat/[goalId]/start/route.ts`
- **Change:** Added `getGoal` import and ownership check before starting heartbeat.

## SB-045 FIX: Add ownership check to heartbeat GET/POST
- **File:** `app/api/heartbeat/[goalId]/route.ts`
- **Change:** Added `getGoal` to both GET and POST handler imports. Both verify `goal.customerId !== session.user.email` before proceeding.

## SB-046 FIX: Add ownership check to rollback
- **File:** `app/api/floors/[floorId]/rollback/route.ts`
- **Change:** Changed existing `await getGoal(floor.goalId)` to `const goal = await getGoal(floor.goalId)` and added ownership verification.

## SB-047 FIX: Add goalText length limit
- **File:** `app/api/goals/new/route.ts`
- **Change:** Added `goalText.length > 5000` check returning 400.

## SB-048 FIX: Add field length limits to expand
- **File:** `app/api/goals/[id]/expand/route.ts`
- **Change:** Added length checks: name (200), description (5000), successCondition (2000).

## SB-049 FIX: Remove @ts-nocheck from workspace-manager
- **File:** `lib/workspace/workspace-manager.ts`
- **Change:** Removed `// @ts-nocheck` from line 1.

## SB-050 FIX: Add ownership check to plan route
- **File:** `app/api/goals/[id]/plan/route.ts`
- **Change:** Added `goal.customerId !== session.user.email` check after loading goal.
