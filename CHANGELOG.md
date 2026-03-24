# Changelog

## [2.1.1] - 2026-03-24 — Steven Gamma: 50-Feature Pipeline Hardening

### Installment 1: Core Pipeline Hardening (Features 1-10)
- **Feature 1:** Request ID tracking across the full pipeline (`lib/pipeline-state.ts`)
- **Feature 2:** Per-agent retry with 30s delay in `routeAgentCallWithRetry()`
- **Feature 3:** 30-minute global pipeline timeout with auto-block on breach
- **Feature 4:** Response validation — minimum 50-char output enforced
- **Feature 5:** Floor dependency enforcement — prior floor must be 'live' before next starts
- **Feature 6:** Concurrent floor protection via in-memory goal locks
- **Feature 7:** Search provider logging in Alba step (Tavily/Brave/Perplexity)
- **Feature 8:** David model escalation to Opus when Vex2 confidence < 60
- **Feature 9:** Real-time progress endpoint `GET /api/goals/[id]/progress`
- **Feature 10:** Build cancellation endpoint `POST /api/goals/[id]/cancel`

### Installment 2: Search & Research Hardening (Features 11-20)
- **Feature 11:** URL-based deduplication of search results
- **Feature 12:** Keyword-overlap relevance scoring for search results
- **Feature 13:** Minimum result enforcement — supplements with alt provider if < 3 results
- **Feature 14:** Fallback chain logging for search provider selection
- **Feature 15:** Source URL instruction added to David's build prompt
- **Feature 16:** Confidence score (0-100) added to Alba's output schema
- **Feature 17:** 90-day stale result flagging with `[STALE]` marker
- **Feature 18:** Query expansion when 0 results — tries alternative phrasings
- **Feature 19:** In-memory search cache with 1-hour TTL
- **Feature 20:** Search call counting in pipeline state tracker

### Installment 3: Gateway & Routing Hardening (Features 21-30)
- **Feature 21:** Per-agent timeout map (Alba 180s, David 300s, Vex 120s, Elira 180s, Steven 120s)
- **Feature 22:** Active session tracking in gateway client
- **Feature 23:** Request deduplication with 5-second window
- **Feature 24:** Rolling latency monitoring with 10s alert threshold
- **Feature 25:** Circuit breaker notification includes triggering agent name
- **Feature 26:** Reconnect logging with seconds elapsed and ISO timestamp
- **Feature 27:** Hot-reload documentation for AGENT_ROUTING_MODE
- **Feature 28:** Stale session cleanup (`cleanupStaleSessions()`)
- **Feature 29:** Routing metrics persistence (`saveRoutingMetrics()`)
- **Feature 30:** Gateway health info in `GET /api/health` response

### Installment 4: Observability & Reporting (Features 31-40)
- **Feature 31:** Token usage tracking in pipeline state
- **Feature 32:** Chronological timeline endpoint `GET /api/goals/[id]/timeline`
- **Feature 33:** Steven weekly digest to Telegram (`sendWeeklyDigest()`)
- **Feature 34:** Error classification engine (`lib/error-classifier.ts`)
- **Feature 35:** Slow build detection with `[SLOW]` warning when David > 60s
- **Feature 36:** Build comparison endpoint `GET /api/goals/[id]/compare/[id2]`
- **Feature 37:** Structured Telegram build summary in finalize step
- **Feature 38:** Daily stats cron `GET /api/cron/daily-stats`
- **Feature 39:** Agent performance tracking (`getAgentPerformance()`)
- **Feature 40:** Quality scoring instruction added to Elira review prompt

### Installment 5: Developer Experience & Polish (Features 41-50)
- **Feature 41:** API key validation in `askelira init` (Anthropic, Tavily, Telegram)
- **Feature 42:** Status command hardening (pre-existing, verified)
- **Feature 43:** Logs command hardening (pre-existing, verified)
- **Feature 44:** `--dry-run` flag on `askelira build` — shows blueprint without starting
- **Feature 45:** `--agent` flag on `askelira build` — run single agent in isolation
- **Feature 46:** Vercel cron schedule for daily-stats (integrated into vercel.json)
- **Feature 47:** CHANGELOG.md updated with full 50-feature documentation
- **Feature 48:** CONTRIBUTING.md updated for 2.1 architecture
- **Feature 49:** AGENTS.md updated with new pipeline capabilities
- **Feature 50:** TypeScript compilation verification (0 errors)

### New Files
- `lib/pipeline-state.ts` — shared pipeline state tracker (request IDs, locks, cancellation, tokens)
- `lib/error-classifier.ts` — error classification into categories (network, timeout, parse, auth, rate_limit)
- `app/api/goals/[id]/progress/route.ts` — real-time progress endpoint
- `app/api/goals/[id]/cancel/route.ts` — build cancellation endpoint
- `app/api/goals/[id]/timeline/route.ts` — chronological timeline endpoint
- `app/api/goals/[id]/compare/[id2]/route.ts` — build comparison endpoint
- `app/api/cron/daily-stats/route.ts` — daily stats cron endpoint

### Modified Files
- `lib/step-runner.ts` — retry, timeout, cancellation, validation, escalation, quality scoring
- `lib/building-loop.ts` — floor dependency enforcement, goal locking
- `lib/web-search.ts` — dedup, scoring, stale flagging, caching, minimum results
- `lib/autoresearch.ts` — query expansion on zero results
- `lib/agent-prompts.ts` — confidence score, source URLs, quality scoring
- `lib/gateway-client.ts` — per-agent timeouts, dedup, latency monitoring, health info
- `lib/agent-router.ts` — routing metrics
- `lib/heartbeat.ts` — weekly digest, agent performance
- `app/api/health/route.ts` — gateway health and routing metrics
- `cli/commands/init.ts` — API key validation
- `cli/commands/build.ts` — dry-run and single-agent modes

## [2.1.0] - 2026-03-20
### Added
- Next.js 14 web interface
- Gmail OAuth authentication
- Real-time swarm progress (SSE)
- Rate limiting by tier (Free/Pro/Enterprise)
- Debate results & history pages
- Shareable result links (/results/[id])
- Responsive design
- FAQ and "How it Works" sections
- Upgrade/pricing page
- Vercel deployment support
- Comprehensive documentation

## [2.0.0] - 2026-03-15
- Initial swarm intelligence platform
- CLI & Electron interfaces
- 4-agent system (Alba, David, Vex, Elira)
- Brave Search integration
- 10K agent debates
- In-memory caching
