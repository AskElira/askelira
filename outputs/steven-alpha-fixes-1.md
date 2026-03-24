# Steven Alpha -- Installment 1: Fix Log

## FIX-1-01: Remove double recordFailure in gateway-client invokeAgent
- **Bug:** BUG-1-01
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/gateway-client.ts
- **Line:** 542-546
- **Change:** Removed `this.recordFailure()` from the outer catch block in `invokeAgent()`. The inner promise handlers (timeout on line 489, error listener on line 507) already call `recordFailure()`. The outer catch was double-counting failures, causing the circuit breaker to trip at half the configured threshold. Added a comment explaining why.
- **Test:** `invokeAgent catch block does not call recordFailure` -- verifies the catch block does not contain a `this.recordFailure()` call (excluding comments).
- **Status:** AUTO-ADDED

## FIX-1-02: Add 10-second timeout to Telegram notify() fetch calls
- **Bug:** BUG-1-02
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/notify.ts
- **Change:** Added AbortController with 10-second timeout to both fetch calls in `notify()`. The controller is shared between the initial Markdown request and the plain-text retry. Timeout is cleaned up in a finally block. AbortError is logged distinctly so operators know it was a timeout vs a network error.
- **Test:** `notify.ts contains AbortController for timeout` + `notify.ts logs AbortError distinctly` -- verifies the file contains AbortController, NOTIFY_TIMEOUT_MS, signal parameter, and AbortError detection.
- **Status:** AUTO-ADDED

## FIX-1-03: Add configurable timeout to openclaw-client Anthropic API calls
- **Bug:** BUG-1-03
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/openclaw-client.ts
- **Change:** Added AbortController with 120-second default timeout (configurable via `ANTHROPIC_TIMEOUT_MS` env var) to both `callClaudeWithSystem()` and `callClaudeWithTools()`. Timeout is cleaned up in a finally block. Both functions now pass `signal: controller.signal` to fetch.
- **Test:** `callClaudeWithSystem has AbortController` + `callClaudeWithTools has AbortController` + `ANTHROPIC_TIMEOUT_MS is configurable via env` -- verifies both functions have signals, clearTimeout, and env var config.
- **Status:** AUTO-ADDED

## FIX-1-04: Singleton PrismaClient in personal-context getUserHistory
- **Bug:** BUG-1-04
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/personal-context.ts
- **Line:** 164-185 (replaced with singleton pattern)
- **Change:** Replaced per-call `new PrismaClient()` with a module-level singleton accessed via `getPrismaClient()`. The singleton is created once on first use and reused across all subsequent calls. Removed the `prisma.$disconnect()` call since the singleton should stay connected. The 1-hour context cache further reduces how often this code path is hit.
- **Test:** `personal-context uses singleton PrismaClient` + `personal-context no longer calls prisma.$disconnect per call` -- verifies the singleton variable exists, the factory function exists, getUserHistory does not create new PrismaClient instances, and $disconnect is not called.
- **Status:** AUTO-ADDED

## FIX-1-05: Cache Anthropic SDK client and add OpenAI timeout in autoresearch callLLM
- **Bug:** BUG-1-05
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/autoresearch.ts
- **Line:** 386-415 (replaced callLLM function)
- **Change:** (1) Added module-level `_anthropicClient` and `_anthropicClientKey` variables. The Anthropic SDK client is now created once and reused if the apiKey has not changed. (2) Added a 60-second AbortController timeout to the OpenAI fetch path which previously had none.
- **Test:** `autoresearch.ts caches Anthropic client` + `autoresearch.ts OpenAI path has fetch timeout` -- verifies cache variables exist and OpenAI path has AbortController + signal.
- **Status:** AUTO-ADDED

## FIX-1-06: Fix reconnect flag race in gateway-client scheduleReconnect
- **Bug:** BUG-1-06
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/gateway-client.ts
- **Line:** 594-601
- **Change:** Moved `this.reconnecting = false` to BEFORE the `try { await this.connect() }` block, instead of inside the catch block. This prevents a theoretical race where the close handler's `scheduleReconnect()` call is blocked if `connect()` throws synchronously or the close event fires between the connect attempt and the catch block resetting the flag.
- **Test:** `reconnecting flag is reset before connect() call in reconnect timer` -- verifies the flag reset line appears before the try block in the timer callback.
- **Status:** AUTO-ADDED

## FIX-1-07: Validate goalId from Socket.io handshake query before room join
- **Bug:** BUG-1-07
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/server.js
- **Line:** 73
- **Change:** Added UUID format validation to the initial connection handler's goalId check. The condition now requires `typeof goalId === 'string' && UUID_RE.test(goalId)` before joining the room, matching the validation already present in the `subscribe` handler. This prevents arbitrary room names from being created via the handshake query.
- **Test:** `server.js validates goalId with UUID regex before room join` -- verifies UUID_RE.test appears in the connect handler and before the socket.join call.
- **Status:** AUTO-ADDED

## FIX-1-08: Log Brave Search error response bodies for debugging
- **Bug:** BUG-1-08
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/web-search.ts
- **Line:** 51-59
- **Change:** (1) When Brave API returns non-ok status, now captures and logs the response body (truncated to 300 chars) so expired keys and rate limits can be diagnosed. (2) When Brave returns 200 OK but has no `web.results` key, logs a warning with the actual keys present in the response to detect error-shaped payloads that silently return empty results.
- **Test:** `web-search.ts logs response body on non-ok Brave response` + `web-search.ts logs when 200 OK has no web.results` -- verifies errBody capture, truncation, and error-shaped 200 detection.
- **Status:** AUTO-ADDED

## FIX-1-09: Add IP-based rate limiting for unauthenticated swarm requests
- **Bug:** BUG-1-09
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/app/api/swarm/route.ts
- **Line:** 100 (before unauthenticated path)
- **Change:** Added import of `checkRateLimit` and `getClientIp` from rate-limiter. Before the unauthenticated code path, added a rate limit check of 3 requests per hour per IP address with `swarm_anon:` key prefix. Returns 429 with a message suggesting sign-in for higher limits. Each unauthenticated debate costs ~$0.024 in LLM calls; without this, an attacker could burn $86.40/hour per concurrent connection.
- **Test:** `swarm route imports rate limiter` + `unauthenticated swarm path has rate limit check` -- verifies the import, the swarm_anon key, the 3/hour limit, and the 429 response.
- **Status:** AUTO-ADDED

## FIX-1-10: Clear validation report fields in building-manager resetFloor
- **Bug:** BUG-1-10
- **File:** /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm/lib/building-manager.ts
- **Line:** 486-501
- **Change:** Added `pattern_validation_report = NULL`, `risk_analysis_report = NULL`, and `swarm_validation_report = NULL` to the UPDATE statement in `resetFloor()`. These three columns were introduced in later phases but never added to the reset query, causing stale validation data from previous iterations to persist and leak into David's prediction prompt during rerun/rebuild cycles.
- **Test:** `resetFloor SQL clears pattern_validation_report` + `resetFloor SQL clears risk_analysis_report` + `resetFloor SQL clears swarm_validation_report` -- verifies each column is set to NULL in the resetFloor function body.
- **Status:** AUTO-ADDED
