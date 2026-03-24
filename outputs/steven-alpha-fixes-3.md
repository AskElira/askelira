# Steven Alpha -- Installment 3: Fix Log

**Date**: 2026-03-23
**Bugs fixed**: 10
**Tests written**: 30 (all passing)
**Regressions**: 0 (installment 1: 19/19, installment 2: 24/24)

---

## Fix 1: Add authentication to plan route

**File**: `app/api/goals/[id]/plan/route.ts`

**Before**: No auth check. Anyone could POST to trigger expensive Elira LLM calls.

**After**: Added `getServerSession(authOptions)` check at the top of the POST handler, returning 401 for unauthenticated requests.

```diff
+ import { getServerSession } from 'next-auth';
+ import { authOptions } from '@/lib/auth';
...
  try {
+   const session = await getServerSession(authOptions);
+   if (!session?.user?.email) {
+     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
+   }
    const goalId = params.id;
```

---

## Fix 2: Add authentication to heartbeat GET and POST routes

**File**: `app/api/heartbeat/[goalId]/route.ts`

**Before**: Both GET (returns agent logs) and POST (triggers floor health checks via Claude) had no auth.

**After**: Added `getServerSession(authOptions)` check to both handlers, returning 401 for unauthenticated requests.

```diff
+ import { getServerSession } from 'next-auth';
+ import { authOptions } from '@/lib/auth';
...
  export async function GET(...) {
    try {
+     const session = await getServerSession(authOptions);
+     if (!session?.user?.email) {
+       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
+     }
...
  export async function POST(...) {
    try {
+     const session = await getServerSession(authOptions);
+     if (!session?.user?.email) {
+       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
+     }
```

---

## Fix 3: Add authentication to heartbeat stop route

**File**: `app/api/heartbeat/[goalId]/stop/route.ts`

**Before**: Anyone could stop heartbeat monitoring for any goal.

**After**: Added `getServerSession(authOptions)` check, returning 401 for unauthenticated requests.

```diff
+ import { getServerSession } from 'next-auth';
+ import { authOptions } from '@/lib/auth';
...
  try {
+   const session = await getServerSession(authOptions);
+   if (!session?.user?.email) {
+     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
+   }
    const goalId = params.goalId;
```

---

## Fix 4: Add authentication to billing portal route + scope query to user

**File**: `app/api/billing/portal/route.ts`

**Before**: (1) No auth check. (2) Query fetched ANY subscription's Stripe customer ID globally.

**After**: (1) Added `getServerSession(authOptions)` check. (2) Changed the query to JOIN goals and filter by `g.customer_id = ${session.user.email}`, scoping to the authenticated user's subscriptions only.

```diff
+ import { getServerSession } from 'next-auth';
+ import { authOptions } from '@/lib/auth';
...
  try {
+   const session = await getServerSession(authOptions);
+   if (!session?.user?.email) {
+     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
+   }
...
-   const { rows } = await sql`
-     SELECT stripe_customer_id FROM subscriptions
-     WHERE stripe_customer_id IS NOT NULL
-     ORDER BY created_at DESC
-     LIMIT 1
-   `;
+   const { rows } = await sql`
+     SELECT s.stripe_customer_id FROM subscriptions s
+     JOIN goals g ON g.id = s.goal_id
+     WHERE s.stripe_customer_id IS NOT NULL
+       AND g.customer_id = ${session.user.email}
+     ORDER BY s.created_at DESC
+     LIMIT 1
+   `;
```

---

## Fix 5: Add auth, rate limiting, and duration cap to simulate-activity

**File**: `app/api/building/simulate-activity/route.ts`

**Before**: No auth, no rate limit, no cap on `duration` parameter. Attacker could set `duration: 999999999`.

**After**: (1) Added `getServerSession(authOptions)` check. (2) Added IP-based rate limiting (5/hour). (3) Added `MAX_SIMULATION_DURATION = 300` (5 minutes) constant and capped duration with `Math.min`.

```diff
+ import { getServerSession } from 'next-auth';
+ import { authOptions } from '@/lib/auth';
+ import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
...
+ const MAX_SIMULATION_DURATION = 300;
...
  export async function POST(req) {
    try {
+     const session = await getServerSession(authOptions);
+     if (!session?.user?.email) {
+       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
+     }
+     const ip = getClientIp(req.headers);
+     const rateCheck = checkRateLimit(`simulate:${ip}`, 5, 3600000);
+     if (!rateCheck.allowed) { ... }
...
-     const { goalId, duration = 30 } = body;
+     const { goalId, duration: rawDuration = 30 } = body;
+     const duration = Math.min(
+       Math.max(1, typeof rawDuration === 'number' ? rawDuration : 30),
+       MAX_SIMULATION_DURATION,
+     );
```

---

## Fix 6: Add authentication and fetch timeout to test-anthropic route

**File**: `app/api/test-anthropic/route.ts`

**Before**: No auth (any visitor triggers billable API call). No fetch timeout (could hang).

**After**: (1) Added `getServerSession(authOptions)` check. (2) Added 15s AbortController timeout on the Anthropic fetch, with `clearTimeout` after completion.

```diff
+ import { getServerSession } from 'next-auth';
+ import { authOptions } from '@/lib/auth';
...
  export async function GET() {
+   const session = await getServerSession(authOptions);
+   if (!session?.user?.email) {
+     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
+   }
...
+   const controller = new AbortController();
+   const timeoutId = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      ...
+     signal: controller.signal,
    });
+   clearTimeout(timeoutId);
```

---

## Fix 7: Validate agents input type and size in workspace POST

**File**: `app/api/workspace/route.ts`

**Before**: `agents` was destructured from JSON body and passed directly to `writeAgents()`. Non-string values would be coerced to `[object Object]`, corrupting the file. No size limit.

**After**: Added type check (`typeof agents !== 'string'` -> 400) and size check (`agents.length > 100_000` -> 400).

```diff
- const { agents } = await req.json();
- await writeAgents(agents);
- return Response.json({ ok: true });
+ const body = await req.json();
+ const { agents } = body;
+ if (typeof agents !== 'string') {
+   return Response.json({ error: 'agents must be a string' }, { status: 400 });
+ }
+ if (agents.length > 100_000) {
+   return Response.json({ error: 'agents content exceeds maximum size (100KB)' }, { status: 400 });
+ }
+ await writeAgents(agents);
+ return Response.json({ ok: true });
```

---

## Fix 8: Add authentication to workspace file read route

**File**: `app/api/workspaces/[customerId]/[...path]/route.ts`

**Before**: No auth check. Any anonymous user could read files from any customer workspace. The sibling listing route (`/api/workspaces/[customerId]`) had auth, but this one did not.

**After**: Added `getServerSession(authOptions)` check at the top of the GET handler.

```diff
+ import { getServerSession } from 'next-auth';
+ import { authOptions } from '@/lib/auth';
...
  export async function GET(...) {
+   const session = await getServerSession(authOptions);
+   if (!session?.user?.email) {
+     return Response.json({ error: 'Unauthorized' }, { status: 401 });
+   }
    const { customerId, path: pathSegments } = params;
```

---

## Fix 9: Ensure workspace directory exists before writing

**File**: `lib/workspace/workspace-manager.ts`

**Before**: Both `writeAgents()` and `writeSoul()` called `fs.writeFile()` without ensuring the directory exists. Throws `ENOENT` on fresh installations.

**After**: Added `await fs.mkdir(dir, { recursive: true })` before `fs.writeFile()` in both functions.

```diff
  export async function writeAgents(content: string): Promise<void> {
-   const p = path.join(getWorkspacePath(), 'AGENTS.md');
+   const dir = getWorkspacePath();
+   await fs.mkdir(dir, { recursive: true });
+   const p = path.join(dir, 'AGENTS.md');
    await fs.writeFile(p, content, 'utf-8');
  }

  export async function writeSoul(content: string): Promise<void> {
-   const p = path.join(getWorkspacePath(), 'SOUL.md');
+   const dir = getWorkspacePath();
+   await fs.mkdir(dir, { recursive: true });
+   const p = path.join(dir, 'SOUL.md');
    await fs.writeFile(p, content, 'utf-8');
  }
```

---

## Fix 10: Add authentication to goals/new route + prevent customerId spoofing

**File**: `app/api/goals/new/route.ts`

**Before**: (1) No authentication -- only IP-based rate limiting. (2) `customerId` was taken directly from the request body, allowing any user to create goals under another user's email.

**After**: (1) Added `getServerSession(authOptions)` check. (2) Changed `customerId` to use `session.user.email` instead of `body.customerId`, preventing impersonation. Removed `customerId` from body destructuring.

```diff
+ import { getServerSession } from 'next-auth';
+ import { authOptions } from '@/lib/auth';
...
  try {
+   const session = await getServerSession(authOptions);
+   if (!session?.user?.email) {
+     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
+   }
    ...
-   const { goalText, customerId, customerContext } = body;
+   const { goalText, customerContext } = body;
+   const customerId = session.user.email;
    ...
-   if (!customerId || typeof customerId !== 'string') { ... }
```
