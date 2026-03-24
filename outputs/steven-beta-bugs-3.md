# Steven Beta -- Installment 3: Bug Report
**Date:** 2026-03-23
**Domain:** API auth, data access, frontend resilience

---

## SB-021 BUG: Workspace API has no auth (HIGH)
- **File:** `app/api/workspace/route.ts`
- **Issue:** GET and POST handlers have zero authentication. Anyone can read the full workspace config (soul, agents, tools) and overwrite agent definitions.

## SB-022 BUG: Debates API email parameter bypass (HIGH)
- **File:** `app/api/debates/route.ts`
- **Issue:** Line 9: `const email = session?.user?.email || emailParam;` — if no session exists, an attacker can pass `?email=victim@example.com` to query any user's debate history.

## SB-023 BUG: Customer workspace listing has no auth (HIGH)
- **File:** `app/api/workspaces/[customerId]/route.ts`
- **Issue:** No auth check. Anyone can list any customer's workspace files by providing their customerId in the URL.

## SB-024 BUG: ShareButton clipboard call not wrapped in try-catch (MEDIUM)
- **File:** `components/ShareButton.tsx`
- **Issue:** `navigator.clipboard.writeText()` throws if clipboard API is unavailable (HTTP context, permissions denied, Firefox restrictions). No error handling — causes uncaught promise rejection.

## SB-025 BUG: Logs API never validates API key against adminKey (HIGH)
- **File:** `app/api/goals/[id]/logs/route.ts`
- **Issue:** Lines 26-44: When `x-api-key` header is present, it skips session auth entirely. But the key is never compared to `adminKey`. Any arbitrary `x-api-key: garbage` bypasses all authentication.

## SB-026 BUG: Logs API silently bypasses auth if import fails (MEDIUM)
- **File:** `app/api/goals/[id]/logs/route.ts`
- **Issue:** Lines 41-43: `catch { // Auth module not available — allow through for dev }` — if `next-auth` or `@/lib/auth` import throws for any reason, auth is silently skipped. Production code should not degrade to open access.

## SB-027 BUG: Swarm results API has no auth (MEDIUM)
- **File:** `app/api/swarm/[id]/route.ts`
- **Issue:** No auth. Anyone with a debate/swarm ID can fetch full results including AI-generated analysis.

## SB-028 BUG: Intelligence patterns API has no auth (MEDIUM)
- **File:** `app/api/intelligence/patterns/route.ts`
- **Issue:** No auth. Internal intelligence pattern data is publicly accessible.

## SB-029 BUG: Intelligence stats API has no auth (MEDIUM)
- **File:** `app/api/intelligence/stats/route.ts`
- **Issue:** No auth. Internal analytics/category stats are publicly accessible.

## SB-030 BUG: Template detail exposes private templates (MEDIUM)
- **File:** `app/api/templates/[id]/route.ts`
- **Issue:** The list endpoint uses `getPublicTemplates()` (filtered), but the detail endpoint uses `getTemplate(id)` without checking `isPublic`. Private templates accessible by ID. Also leaks `sourceGoalId`.
