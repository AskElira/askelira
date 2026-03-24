# Steven Alpha -- Installment 3: Bug Report

**Date**: 2026-03-23
**Scanned**: `app/api/`, `lib/`, `server.js`, `middleware.ts`, `cli/`, `config/`
**Bugs found**: 10

---

## Bug 1: plan route missing authentication
- **File**: `app/api/goals/[id]/plan/route.ts`
- **Line**: 6 (POST handler entry)
- **Severity**: CRITICAL
- **Description**: The `/api/goals/[id]/plan` POST endpoint calls `designBuilding()` which makes expensive Anthropic API calls (Sonnet). No `getServerSession` check exists. Any anonymous user can trigger LLM calls, costing $0.50-2.00 per invocation. Rate limiting by goalId is present but does not prevent abuse since goalIds are guessable UUIDs.

## Bug 2: heartbeat GET/POST routes missing authentication
- **File**: `app/api/heartbeat/[goalId]/route.ts`
- **Lines**: 7 (GET), 66 (POST)
- **Severity**: HIGH
- **Description**: Neither GET nor POST check authentication. GET returns agent logs (Steven checks, escalation reports) for any goalId -- information disclosure. POST triggers `checkFloor()` which calls Claude to evaluate floor health -- unauthorized API cost. The POST has rate limiting per goalId but no auth.

## Bug 3: heartbeat stop route missing authentication
- **File**: `app/api/heartbeat/[goalId]/stop/route.ts`
- **Line**: 5 (POST handler entry)
- **Severity**: HIGH
- **Description**: The `/api/heartbeat/[goalId]/stop` POST endpoint has no authentication. Anyone who knows a goalId can stop its heartbeat monitoring, silently disabling floor health checks. This is a denial-of-service vector against any building's monitoring system.

## Bug 4: billing portal route missing auth + unscoped subscription query
- **File**: `app/api/billing/portal/route.ts`
- **Line**: 3 (POST handler entry), 18-23 (query)
- **Severity**: CRITICAL
- **Description**: Two bugs: (1) No `getServerSession` check -- any anonymous user can access the billing portal. (2) The subscription query selects the MOST RECENT subscription globally with no user scoping (`WHERE stripe_customer_id IS NOT NULL ORDER BY created_at DESC LIMIT 1`). This means User A gets User B's billing portal URL if User B subscribed more recently.

## Bug 5: simulate-activity route missing auth + unbounded duration
- **File**: `app/api/building/simulate-activity/route.ts`
- **Lines**: 41 (POST handler), 44 (duration)
- **Severity**: HIGH
- **Description**: Three bugs: (1) No authentication -- any anonymous user can trigger simulations. (2) No rate limiting. (3) The `duration` parameter from the request body is unbounded. An attacker can POST `{goalId: "x", duration: 999999999}` causing a `setInterval` that runs for ~31 years, leaking memory and CPU. Even moderate values (e.g., 86400) waste server resources.

## Bug 6: test-anthropic route missing auth + no fetch timeout
- **File**: `app/api/test-anthropic/route.ts`
- **Lines**: 3 (GET handler), 14 (fetch)
- **Severity**: HIGH
- **Description**: Two bugs: (1) No authentication -- any visitor can trigger a billable Anthropic API call and confirm whether the API key is configured (information disclosure). (2) The fetch to `api.anthropic.com` has no timeout. If Anthropic is slow or unresponsive, the serverless function hangs until the Vercel timeout kills it.

## Bug 7: workspace POST route accepts non-string agents input
- **File**: `app/api/workspace/route.ts`
- **Line**: 25 (agents destructure)
- **Severity**: MEDIUM
- **Description**: The POST handler destructures `agents` from `req.json()` and passes it directly to `writeAgents(agents)` which calls `fs.writeFile(p, content, 'utf-8')`. If `agents` is not a string (e.g., a number, object, or array), Node.js will coerce it to `[object Object]` or similar, silently corrupting the workspace AGENTS.md file. No size limit either -- could write gigabytes.

## Bug 8: workspace file read route missing authentication
- **File**: `app/api/workspaces/[customerId]/[...path]/route.ts`
- **Line**: 12 (GET handler entry)
- **Severity**: CRITICAL
- **Description**: The file read endpoint has no authentication check. It correctly validates path traversal, but any anonymous user can read files from any customer's workspace by enumerating customerIds. The sibling route (`/api/workspaces/[customerId]` for listing) does have auth, making this an inconsistency.

## Bug 9: workspace-manager write functions don't ensure directory exists
- **File**: `lib/workspace/workspace-manager.ts`
- **Lines**: 36-39 (writeAgents), 48-51 (writeSoul)
- **Severity**: MEDIUM
- **Description**: Both `writeAgents()` and `writeSoul()` call `fs.writeFile()` without first ensuring the workspace directory exists. If the directory doesn't exist (e.g., fresh installation, deleted workspace), `fs.writeFile` throws `ENOENT`. The `ensureWorkspace()` function exists but is not called by these write functions. The `syncToFiles()` function calls `writeSoul` and `writeAgents` and would fail on a fresh install.

## Bug 10: goals/new route missing auth + customerId spoofing
- **File**: `app/api/goals/new/route.ts`
- **Lines**: 4 (POST handler), 17 (customerId)
- **Severity**: CRITICAL
- **Description**: Two bugs: (1) No authentication -- creating a goal only requires rate limiting (10/hour per IP). (2) The `customerId` is taken directly from the request body, not from the authenticated session. An attacker can create goals under any customerId (which is the user's email), polluting another user's goal list and potentially triggering builds under their billing account.
