# Steven Alpha -- Installment 1: Bug Report

## BUG-1-01: Unhandled promise rejection in gateway-client invokeAgent on double-recordFailure
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/gateway-client.ts
- **Line:** 542-546
- **Description:** In `invokeAgent()`, when the inner promise rejects (e.g., timeout on line 489), the outer catch block at line 542 calls `this.recordFailure()` again. But the inner listener on line 507 already called `this.recordFailure()`. This means every agent timeout/error double-counts the failure in the circuit breaker, causing it to trip at half the configured threshold (e.g., after 2 failures instead of 3).
- **Severity:** medium

## BUG-1-02: Telegram notify() has no timeout on fetch, can hang indefinitely
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/notify.ts
- **Line:** 24-33
- **Description:** Both fetch calls to the Telegram Bot API have no AbortController/timeout. If Telegram's API hangs (DNS issue, network partition), the entire calling function blocks indefinitely. Since `notify()` is called from the heartbeat cycle, building loop finalize, and escalation handlers, a hung Telegram call can stall critical operations. The function comment says "Never throws" but a hung promise is worse than throwing -- it silently blocks.
- **Severity:** high

## BUG-1-03: openclaw-client callClaudeWithSystem has no fetch timeout, can hang on Anthropic API
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/openclaw-client.ts
- **Line:** 23-36
- **Description:** `callClaudeWithSystem()` and `callClaudeWithTools()` call `fetch()` to the Anthropic API with no AbortController or timeout. On Vercel with maxDuration=60s, the function will be killed after 60s, but the promise never resolves/rejects cleanly -- it just gets silently aborted. Outside Vercel (custom server, local dev), this can hang indefinitely. Every agent call (Alba, Vex, David, Elira, Steven) flows through these functions.
- **Severity:** high

## BUG-1-04: Personal context creates new PrismaClient on every call without connection pooling
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/personal-context.ts
- **Line:** 171
- **Description:** `getUserHistory()` does `new prismaModule.PrismaClient()` on every invocation, creating a fresh database connection pool each time. On Neon Postgres with serverless, this exhausts the connection limit rapidly. While `prisma.$disconnect()` is called, the pattern of new-connect-query-disconnect per call is an anti-pattern that causes connection churn and potential "too many connections" errors under load. The cache mitigates this (1-hour TTL), but the first call per user per cold start hits this.
- **Severity:** medium

## BUG-1-05: autoresearch.ts callLLM creates new Anthropic SDK client on every call
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/autoresearch.ts
- **Line:** 387-388
- **Description:** `callLLM()` instantiates `new Anthropic({ apiKey })` on every single call. The autoresearch flow calls this function at minimum 3 times per iteration (generateNextQuery, performResearch, evaluateQuality) plus synthesizeFinalReport. Each `new Anthropic()` creates a new HTTP client with its own connection pool. This causes unnecessary object creation overhead and prevents HTTP connection reuse across calls within the same research run. Combined with the OpenAI fetch path having no timeout either (line 399-413).
- **Severity:** medium

## BUG-1-06: Gateway client reconnect never resets `reconnecting` flag on success
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/gateway-client.ts
- **Line:** 591-600
- **Description:** In `scheduleReconnect()`, the `reconnecting` flag is set to `true` on line 580. If `this.connect()` succeeds on line 594, the flag is reset in `handleMessage` on line 341. BUT if connect() rejects AND the catch block calls `scheduleReconnect()` again (line 598), it returns immediately on line 579 because `this.reconnecting` is still true from the first call. The flag is only set to false on line 597, but by then `scheduleReconnect()` has already been called and returned. This creates a race where a failed reconnect attempt followed by a quick retry can deadlock reconnection if the catch fires after the flag check.
- **Severity:** low

## BUG-1-07: Server.js Socket.io goalId from query is not validated before room join
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/server.js
- **Line:** 70-77
- **Description:** The `goalId` from `socket.handshake.query.goalId` is used directly in `socket.join(`building:${goalId}`)` on line 76 without any validation. While the `subscribe` handler validates UUID format, the initial connection handler does not. A malicious client could pass `../../../admin` or `__proto__` as goalId, or any string that could cause issues in Socket.io's room naming. The subscribe handler has proper UUID validation, but the initial connect path skips it.
- **Severity:** medium

## BUG-1-08: web-search.ts braveSearch leaks API key in error logs on non-ok response
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/web-search.ts
- **Line:** 51-53
- **Description:** When the Brave API returns a non-ok status, `response.status` is logged but the response body is not captured or logged for debugging. This is actually the inverse problem: when the fetch *throws* (line 67-70), the full error object is logged which on some Node versions can include the request URL with query parameters. More critically, there is no response body logged on 401/403 errors, making it impossible to diagnose expired keys. But the real bug is that `data.web?.results` on line 58 can be undefined when the API returns a 200 with an error payload (e.g., rate limited but 200 OK with `{ query: {...}, mixed: {...} }` and no `web` key). This silently returns empty results indistinguishable from "no results found."
- **Severity:** low

## BUG-1-09: Swarm route allows unauthenticated users to run debates with no rate limiting
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/app/api/swarm/route.ts
- **Line:** 100-125
- **Description:** When no session exists (unauthenticated user), the code falls through to line 100 and runs `runSwarmDebate()` with zero rate limiting. Each debate makes 4 LLM calls (Alba, David/Opus, Vex, Elira) costing ~$0.024. An attacker can hit this endpoint in a loop and burn API credits with no throttling. The authenticated path has proper tier-based rate limiting, but the unauthenticated path has none.
- **Severity:** high

## BUG-1-10: building-manager resetFloor does not clear validation report fields
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/building-manager.ts
- **Line:** 486-501
- **Description:** `resetFloor()` sets `research_output`, `build_output`, `vex_gate1_report`, `vex_gate2_report`, `building_context`, `handoff_notes`, and `completed_at` to NULL, but does NOT clear `pattern_validation_report`, `risk_analysis_report`, or `swarm_validation_report`. When a floor is reset (heartbeat rerun or escalation), the stale validation reports from the previous iteration persist. On the next Alba run, the step-runner reads these stale reports and injects them into David's prediction prompt, potentially giving David outdated risk/pattern analysis from a completely different research approach.
- **Severity:** medium
