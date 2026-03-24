# AskElira Agents

## Alba -- Research Agent

**Status:** REAL WEB ACCESS (upgraded March 2026)

**Tools:**
- `brave_search` -- Brave Search API, up to 10 results per query
- `fetch_url` -- URL fetcher with HTML-to-text stripping, 12k char cap

**Output schema:**
- summary, findings[], recommendation, sources[], confidence

**Trust level:** HIGH -- all claims are backed by cited URLs fetched during the run.
Previously: UNTRUSTED -- Alba hallucinated library names with no web access.

**API key required:** `BRAVE_SEARCH_API_KEY` in .env

## David -- Debate Orchestrator

**Status:** Active

Simulates a 10,000-agent debate on the research question. 5,000 agents argue FOR, 5,000 argue AGAINST. Consensus emerges from strongest arguments.

**Output schema:**
- decision, confidence, argumentsFor[], argumentsAgainst[], conditions[], reasoning

## Vex -- Quality Auditor

**Status:** Active

Audits David's debate result for quality, validity, logical soundness, bias, and confidence calibration.

**Output schema:**
- valid, issues[], suggestions[], adjustedConfidence, auditScore, notes

## Elira -- Synthesis Agent + Floor 0 Architect

**Status:** Active (Floor 0 LIVE -- March 2026)

### Synthesis Role
Synthesizes all agent outputs into a final decision with actionable recommendations and optional build plan.

**Output schema:**
- finalDecision, confidence, recommendation, actionPlan[], risks[], buildable, buildPlan

### Floor 0 Architect Role (Phase 3)
Designs the complete building plan for a customer goal. Given a goal, Elira produces 2-6 floors, each with:
- name (plain English, max 5 words)
- description (one sentence)
- successCondition (binary, checkable without human judgment)
- complexity (1-3, auto-splits if > 3)
- estimatedHours

**Complexity gate:** Any floor with complexity > 3 is automatically sent back to Elira for splitting.

**API routes:**
- `POST /api/goals/[id]/plan` -- triggers Floor 0 design
- `POST /api/goals/[id]/approve` -- transitions goal to 'building', activates Floor 1

**Model:** claude-sonnet-4-5 (planning does not need Opus)

## Phase 4: Building Loop Engine

**Status:** LIVE (March 2026) -- Hardened by Steven Gamma (50 features)

The loop engine runs each floor through a 5-agent pipeline:

1. **Alba** researches the floor requirements (Brave Search + URL fetcher, Sonnet)
2. **Vex Gate 1** audits the research plan (Sonnet)
3. **David** builds the code from approved research (Opus)
4. **Vex Gate 2** audits the built code (Sonnet)
5. **Elira** reviews strategic fit and goal alignment (Sonnet)

**Iteration limit:** 5 per floor. If all 5 fail, floor is marked 'blocked'.

**Auto-chaining:** When a floor goes live, the next pending floor starts automatically via setImmediate.
When the last floor goes live, the goal is marked 'goal_met'.

### Pipeline Hardening (Steven Gamma)

The building pipeline includes the following hardening features:

- **Request ID tracking** -- every pipeline run gets a unique ID for log correlation
- **Per-agent retry** -- each agent call retries once after 30s delay on failure
- **30-minute global timeout** -- pipeline auto-blocks if total execution exceeds 30 minutes
- **Response validation** -- minimum 50-char response enforced on all agent outputs
- **Floor dependency enforcement** -- prior floor must be 'live' before next starts
- **Concurrent floor protection** -- in-memory goal locks prevent parallel floor execution
- **David model escalation** -- if Vex2 confidence < 60, David retries with Opus model
- **Build cancellation** -- POST /api/goals/[id]/cancel stops a running pipeline
- **Slow build detection** -- logs [SLOW] warning when David step exceeds 60 seconds
- **Quality scoring** -- Elira adds explicit quality score in review step
- **Error classification** -- errors categorized as network/timeout/parse/auth/rate_limit/unknown
- **Structured build summary** -- Telegram notification with cost, time, search counts after finalize

### Search Hardening (Steven Gamma)

- **URL deduplication** -- removes duplicate search results by normalized URL
- **Relevance scoring** -- keyword overlap scoring, highest relevance first
- **Stale result flagging** -- results older than 90 days marked [STALE]
- **In-memory cache** -- 1-hour TTL search cache to avoid duplicate queries
- **Minimum result enforcement** -- supplements with alt provider if < 3 results returned
- **Query expansion** -- retries with alternative phrasings when 0 results
- **Confidence score** -- Alba outputs confidence 0-100 in JSON schema
- **Source URLs** -- David instructed to include source URLs in code comments

### Gateway Hardening (Steven Gamma)

- **Per-agent timeouts** -- Alba 180s, David 300s, Vex 120s, Elira 180s, Steven 120s
- **Request deduplication** -- 5-second window prevents duplicate gateway calls
- **Latency monitoring** -- rolling average of last 10 requests, alerts at > 10s
- **Stale session cleanup** -- `cleanupStaleSessions()` removes orphaned connections
- **Gateway health endpoint** -- `/api/health` returns gateway status, latency, circuit breaker state

**Core file:** `lib/building-loop.ts`
- `runFloor(floorId)` -- runs the full loop, returns 'live' or 'blocked'
- `getFloorForHeartbeat(floorId)` -- thin DB wrapper for Phase 5

**Pipeline state tracker:** `lib/pipeline-state.ts`
- `startPipelineRun(goalId)` -- initialize tracking for a pipeline execution
- `getPipelineRun(goalId)` -- retrieve current state (agent, elapsed, tokens, searches)
- `cancelPipelineRun(goalId)` -- flag pipeline for cancellation
- `acquireGoalLock(goalId)` / `releaseGoalLock(goalId)` -- concurrency control

**Error classifier:** `lib/error-classifier.ts`
- `classifyError(err)` -- returns category: network, timeout, parse, auth, rate_limit, unknown

**New agent prompts** (in `lib/agent-prompts.ts`):
- `ALBA_RESEARCH_PROMPT` -- research with tools, JSON output, confidence score, proven patterns
- `VEX_GATE1_PROMPT` -- pre-build audit, JSON output
- `DAVID_BUILD_PROMPT` -- build with self-audit, JSON output, source URLs
- `VEX_GATE2_PROMPT` -- post-build audit, JSON output
- `ELIRA_FLOOR_REVIEW_PROMPT` -- strategic review, quality score, JSON output

**New DB functions** (in `lib/building-manager.ts`):
- `getFloor(floorId)` -- single floor by ID
- `getNextFloor(goalId, currentFloorNumber)` -- next pending floor
- `getPriorVex2Reports(floorId)` -- prior Vex Gate 2 rejection summaries

**API routes:**
- `POST /api/loop/start/[floorId]` -- fire-and-forget loop start (checks pending/researching)
- `POST /api/goals/[id]/approve` -- now auto-fires loop for Floor 1
- `GET /api/goals/[id]/progress` -- real-time pipeline progress (agent, elapsed, tokens)
- `POST /api/goals/[id]/cancel` -- cancel running pipeline
- `GET /api/goals/[id]/timeline` -- chronological agent action timeline
- `GET /api/goals/[id]/compare/[id2]` -- side-by-side build comparison
- `GET /api/cron/daily-stats` -- daily build stats (Vercel cron)

**Test script:** `npx tsx scripts/test-building-loop.ts` (requires `TEST_GOAL_ID` env var)

## Phase 5: Steven's Heartbeat

**Status:** LIVE (March 2026)

Steven is the autonomous monitor for AskElira 2.1. He runs on a configurable interval (default 5 minutes), checks every live floor's health, and takes action when things break.

### Steven -- Monitor Agent

**Role:** Checks live floors for health and success condition drift. Routes by action:
- `healthy` -- floor is fine, condition met
- `rerun` -- condition not met but fixable, re-triggers building loop
- `escalate` -- 3+ consecutive failures or structural problem, escalates to Elira

**Output schema:**
- conditionMet, healthStatus, observation, action, suggestedNextAutomation, consecutiveFailures

**Escalation flow:**
1. Steven creates an escalation report (STEVEN_ESCALATION_PROMPT)
2. Elira receives and decides recovery path (ELIRA_ESCALATION_PROMPT)
3. Elira verdict routes to: patch (David rebuild), rebuild (full loop reset), replan (floor redesign), pause (block + notify)

**Model:** claude-sonnet-4-5 (Steven and Elira escalation both use Sonnet -- never Opus)

### Heartbeat Registry

In-memory Map at module level in `lib/heartbeat.ts`. Not persisted across restarts.
Recovery via `instrumentation.ts` (Next.js 14 hook) on server start -- scans for goals with status 'building' and live floors, restarts heartbeats.

### Suggestion Accumulator

When Steven finds a healthy floor and suggests a next automation, the suggestion is saved to `agent_logs` with action `automation_suggestion`. The GET `/api/goals/[id]` response includes `stevenSuggestions[]`.

### Core files
- `lib/heartbeat.ts` -- Steven's runtime (startHeartbeat, stopHeartbeat, checkFloor, getHeartbeatStatus)
- `lib/heartbeat-recovery.ts` -- Startup recovery (recoverHeartbeats)
- `instrumentation.ts` -- Next.js 14 hook calling recoverHeartbeats

### New agent prompts (in `lib/agent-prompts.ts`)
- `STEVEN_HEARTBEAT_PROMPT` -- floor health check, JSON output
- `STEVEN_ESCALATION_PROMPT` -- escalation report, JSON output
- `ELIRA_ESCALATION_PROMPT` -- escalation verdict, JSON output

### New DB functions (in `lib/building-manager.ts`)
- `getLiveFloors(goalId)` -- all live floors for a goal
- `getAllFloors(goalId)` -- all floors for a goal
- `getRecentHeartbeats(floorId, limit)` -- recent heartbeat logs
- `resetFloor(floorId)` -- reset floor to pending state
- `saveStevenSuggestion(goalId, floorId, suggestion)` -- save automation suggestion
- `getStevenSuggestions(goalId)` -- get all suggestions for a goal

### API routes
- `GET /api/heartbeat/[goalId]` -- heartbeat status + recent logs
- `POST /api/heartbeat/[goalId]` -- manually trigger one heartbeat cycle
- `POST /api/heartbeat/[goalId]/start` -- start heartbeat (intervalMs: 30000-86400000, default 300000)
- `POST /api/heartbeat/[goalId]/stop` -- stop heartbeat
- `POST /api/goals/[id]/approve` -- now also starts heartbeat 10s after loop start

### Test script
`npx tsx scripts/test-heartbeat.ts` (requires `TEST_GOAL_ID` env var)

## Phase 6: Real-Time Frontend Dashboard

**Status:** LIVE (March 2026)

Customer-facing dashboard for monitoring building progress in real-time. Uses Socket.io for live updates and GSAP for animations. All components use inline styles matching the existing codebase pattern (no Tailwind).

### Architecture

Single hook (`useBuildingState`) manages all state and Socket.io events. Components are pure presentational, receiving data via props.

### Core files

**Hook:**
- `hooks/useBuilding.ts` -- single source of truth for building state; initial API fetch + Socket.io real-time updates for all BUILDING_EVENTS; exports `useBuildingState(goalId)` returning `{ building, isLoading, error, refetch }`

**Components:**
- `components/FloorCard.tsx` -- floor card with 7 visual states (pending, researching, building, auditing, live, broken, blocked); GSAP scale/shake animations on status change; collapsible success condition; gold pulse dot on live floors
- `components/AgentTicker.tsx` -- live feed of agent actions; color-coded badges (Alba=green, David=teal, Vex=red, Elira=purple, Steven=gold); human-readable action translations; relative timestamps
- `components/StevenStatus.tsx` -- Steven heartbeat monitor; pulse dot; last check time; collapsible automation suggestions panel
- `components/BuildingLoadingSkeleton.tsx` -- skeleton UI for building page loading state
- `components/BuildingError.tsx` -- error display with retry button
- `components/Nav.tsx` -- navigation bar (hidden on home page); links to My Buildings, New Building; includes UserMenu

**Pages:**
- `app/buildings/[goalId]/page.tsx` -- main building dashboard; goal header with progress bar; StevenStatus; stacked FloorCards; AgentTicker (last 8); GSAP completion animation when goal_met (floor cards stagger bottom-to-top, banner reveal)
- `app/buildings/page.tsx` -- building list; fetches from GET /api/goals; goal cards with status badges, floor progress bars, dates; empty state with onboard link

**API routes:**
- `GET /api/goals` -- lists all goals with floor counts; filters by authenticated user email if session exists; graceful fallback to empty array if DB unavailable

**Layout changes:**
- `app/layout.tsx` -- added Nav component (renders on all pages except home)
- `app/globals.css` -- added keyframe animations (pulse-border, pulse-dot, steven-pulse, ticker-slide-in, skeleton-pulse)

### Dependencies added
- `socket.io-client` -- client-side Socket.io for real-time events

### Socket.io events handled
All events from `lib/events.ts` BUILDING_EVENTS const:
- `building:approved` -- status -> 'building'
- `building:goal_met` -- isGoalMet flag + status -> 'goal_met'
- `floor:status_change` -- updates specific floor status
- `floor:live` -- floor -> 'live' with handoff notes
- `floor:blocked` -- floor -> 'blocked'
- `floor:healthy` -- floor confirmed healthy
- `floor:broken` -- floor -> 'broken'
- `agent:action` -- prepended to activity feed
- `building:heartbeat` -- updates heartbeat status and suggestions

## Phase 7: Customer Onboarding Wizard

**Status:** LIVE (March 2026)

4-step onboarding wizard at `/onboard` that takes a customer from goal description to a running building. No auth required. Makes exactly 3 API calls: POST /api/goals/new, POST /api/goals/[id]/plan, POST /api/goals/[id]/approve.

### Wizard Steps

1. **Goal Input** -- large textarea, 3 example chips (click to fill), email input, minimum 20 chars to continue. Creates goal via POST /api/goals/new.
2. **Business Context** -- industry dropdown (8 options), multi-select tool chips (10 options), delivery method select, frequency select. Stores context for Elira's planning.
3. **Blueprint** -- calls POST /api/goals/[id]/plan with customerContext. 3D building visualization via React Three Fiber canvas (280px height). Floors reveal one-by-one at 600ms intervals with scale animation. Floor plan cards below canvas. "Request changes" input with "Redesign" button (re-calls /plan). "Approve & Build" button appears when all floors are revealed.
4. **Build** -- calls POST /api/goals/[id]/approve. Checkmark animation + "Starting your agents..." pulsing text. Redirects to /buildings/${goalId} after 2s.

### Core files

**Page:**
- `app/onboard/page.tsx` -- 'use client' wizard component; 4-step React state machine; GSAP step transitions (exit: opacity 0, y -12, 200ms; enter: opacity 0->1, y 12->0, 300ms); all inline styles matching codebase pattern

**Components:**
- `components/StepIndicator.tsx` -- 4-dot step indicator with labels (Goal, Context, Blueprint, Build); filled dots for completed/current, empty for future; connector lines between dots
- `components/BlueprintBuilding.tsx` -- React Three Fiber 3D building; Box geometries stacked vertically; floors reveal with spring-like scale animation driven by revealedCount prop; orbiting gold sphere (Elira indicator); OrbitControls; no Socket.io, no API calls (pure presentational). Wrapped in dynamic() import with ssr: false in onboard page.

### Architecture decisions

- BlueprintBuilding is a pure presentational component driven by `floorCount` and `revealedCount` props
- Three.js canvas uses dynamic() import with ssr: false to avoid SSR hydration errors
- Floor reveal uses useFrame spring animation (not @react-spring) since R3F + useFrame already available
- No new packages installed -- reuses existing three, @react-three/fiber, @react-three/drei, gsap
- No localStorage -- all state in React useState
- No modifications to lib/ files from phases 1-5
- The /onboard page is public (no auth check)
- Nav.tsx already had /onboard link and active highlighting (added in Phase 6)

### API calls (3 total)

1. `POST /api/goals/new` -- Step 1 to Step 2 transition; body: `{ goalText, customerId, customerContext: { email } }`
2. `POST /api/goals/${goalId}/plan` -- Step 3 on enter + Redesign button; body: `{ customerContext }` (with optional changes field)
3. `POST /api/goals/${goalId}/approve` -- Step 3 Approve & Build button; triggers building loop + heartbeat

### Types

```typescript
interface CustomerContext {
  industry: string;
  existingTools: string[];
  deliveryMethod: string;
  frequency: string;
  email: string;
  changes?: string;
}

interface FloorPlanResult {
  goalId: string;
  buildingSummary: string;
  floorCount: number;
  totalEstimatedHours: number;
  floors: { id: string; floorNumber: number; name: string; description: string; successCondition: string; }[];
}
```

## Phase 8: Daily Intelligence Scraping

**Status:** LIVE (March 2026)

Autonomous intelligence gathering system that scrapes automation patterns from the web daily, stores them in a confidence-scored database, and feeds proven patterns into Alba's research step. Includes a feedback loop: successful builds boost pattern confidence, repeated failures reduce it.

### Architecture

1. **Daily Cron** (3am UTC) scrapes 10 random categories via Brave Search + URL fetcher
2. Claude extracts actionable patterns from web content
3. Patterns stored in `automation_patterns` table with confidence scoring
4. Before each Alba research step, the building loop detects the floor's category and injects proven patterns
5. After floor goes live: pattern success recorded + customer build pattern saved
6. After 2+ Vex Gate 2 rejections: pattern failure recorded

### Core files

**Scraper:**
- `lib/daily-scraper.ts` -- `scrapeCategory(category)` returns `ScrapedPattern[]`; uses braveSearch (top 8), fetchUrl (top 3), Claude extraction; NEVER throws
- `lib/scraper-categories.ts` -- `SCRAPER_CATEGORIES` array of 50 categories across 10 domains (Lead Gen, Email, Scheduling, Data Collection, File Processing, Notifications, CRM, E-commerce, Infrastructure, AI & Data)

**Pattern Manager:**
- `lib/pattern-manager.ts` -- all DB ops for `automation_patterns` table
  - `upsertPattern(pattern)` -- upsert by category+source_url, mean reversion on confidence
  - `getTopPatterns(category, limit, minConfidence)` -- confidence DESC, last 14 days
  - `recordPatternSuccess(patternId)` -- confidence += 0.05 (max 0.95), success_count++
  - `recordPatternFailure(patternId)` -- confidence -= 0.10 (min 0.1), failure_count++
  - `saveCustomerBuildPattern(params)` -- source='customer_build', confidence=0.65
  - `getCategoryStats(category)` -- totalPatterns, avgConfidence, provenPatterns
  - `getAllCategoryStats()` -- grouped stats for all categories
  - `getPatternsByCategory(category, limit)` -- all patterns for a category
  - `detectCategory(floorName, description, successCondition)` -- keyword matching only, no API calls

### DB Schema

Table: `automation_patterns`
- id (UUID), category, pattern_description, source_url, implementation_notes
- confidence (FLOAT, 0.1-0.95), last_seen, use_count, success_count, failure_count
- source ('scraper' | 'customer_build' | 'manual')
- created_at, updated_at
- Indexes: category, confidence DESC, (category, confidence DESC)
- Unique partial index: (category, source_url) WHERE source_url IS NOT NULL

Migration: `scripts/migrate-patterns.mjs`

### Building Loop Integration

In `lib/building-loop.ts`:
- Before loop starts: `detectCategory()` + `getTopPatterns()` (once per floor)
- `buildAlbaMessage()` now accepts `existingPatterns` and injects them as "PROVEN AUTOMATION PATTERNS" section
- After floor goes live: `recordPatternSuccess()` on top pattern + `saveCustomerBuildPattern()`
- After Vex Gate 2 rejection (iteration > 2): `recordPatternFailure()` on top pattern

In `lib/agent-prompts.ts`:
- ALBA_RESEARCH_PROMPT rule 5: "If proven patterns are provided above, prioritize them. Only search if patterns are missing or confidence < 70%."

### API routes

**Intelligence:**
- `GET /api/intelligence/patterns?category=lead-generation` -- get patterns for a category
- `GET /api/intelligence/stats` -- get all category stats grouped

**Cron:**
- `GET /api/cron/scrape-patterns` -- Vercel Cron endpoint (requires CRON_SECRET auth header); scrapes 10 random categories with 2s delay between each
- `POST /api/cron/scrape-patterns/manual` -- manual trigger; body: `{ categories?: string[], count?: number }`

### Vercel Cron

Configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-patterns",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### Environment variables

- `CRON_SECRET` -- required for cron endpoint authentication (add to Vercel env vars)
- `BRAVE_SEARCH_API_KEY` -- used by daily scraper (already existed)
- `ANTHROPIC_API_KEY` -- used by pattern extraction (already existed)

### Dependencies added

- `playwright` -- available for future deep scraping but NOT imported in the main Next.js bundle (externalized in next.config.js)

### Constraints

- Scraper NEVER throws -- all errors are silent, returns empty array
- 2 second delay between categories in cron -- prevents rate limiting
- detectCategory is keyword matching ONLY -- zero API calls
- Pattern feedback only after floor goes live or 2+ Vex rejections
- Alba pattern injection is additive -- patterns are added context, not replacement for search
- CRON_SECRET required for the cron endpoint

## Phase 9: Stripe Billing

**Status:** LIVE (March 2026)

Stripe-based billing integration with subscription management, checkout, webhooks, billing portal, and billing gates in the heartbeat and building loop. Dev mode (no STRIPE_SECRET_KEY) bypasses all billing -- builds run free without Stripe configured.

### Architecture

1. **Checkout Flow:** Onboard wizard Step 3 "Approve & Build" routes through `/api/billing/checkout` which creates a Stripe Checkout Session with $99 one-time plan fee + $49/month floor subscription
2. **Webhook Processing:** Stripe sends events to `/api/billing/webhook` -- handles checkout.session.completed (activate + start build), invoice.payment_succeeded (clear grace), invoice.payment_failed (72h grace period), customer.subscription.deleted (cancel + block)
3. **Billing Gate:** In `runHeartbeatCycle()`, checks subscription status before floor checks. Grace period expired = pause heartbeat. Paused/canceled = stop heartbeat
4. **Floor Billing:** In `runFloor()`, after a floor goes live, increments subscription quantity via Stripe API
5. **Billing Dashboard:** `/billing` page shows subscriptions with status, monthly cost, active floors, next billing date, grace period warnings
6. **Billing Portal:** `/api/billing/portal` creates Stripe billing portal session for self-service management

### Pricing Model

- **$99 one-time** -- Building plan design and setup fee (inline price_data, not a saved product)
- **$49/month per floor** -- Recurring floor subscription, quantity incremented as floors go live

### DB Schema

Table: `subscriptions`
- id (UUID), customer_id, goal_id (FK -> goals), stripe_customer_id, stripe_subscription_id, stripe_payment_intent_id
- plan_paid (BOOLEAN), status ('pending' | 'active' | 'past_due' | 'canceled' | 'paused')
- floors_active (INT), current_period_end, grace_period_end
- created_at, updated_at
- Indexes: goal_id, customer_id, stripe_subscription_id

Column added to `goals`: billing_status (TEXT, default 'unpaid')

Migration: `scripts/migrate-subscriptions.mjs`

### Core files

**Stripe client:**
- `lib/stripe.ts` -- Stripe SDK instance, uses `STRIPE_SECRET_KEY`

**Subscription manager:**
- `lib/subscription-manager.ts` -- all subscription DB ops + Stripe API calls
  - `createSubscription({ customerId, goalId })` -- creates DB record
  - `getSubscription(goalId)` -- latest subscription for a goal
  - `updateSubscriptionStatus(goalId, status, extras?)` -- update status + optional period/grace dates
  - `activateSubscription(goalId, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd)` -- full activation
  - `addFloorToSubscription(goalId)` -- increment floors_active in DB + update Stripe quantity
  - `setGracePeriod(goalId)` -- sets 72-hour grace period
  - `isInGracePeriod(goalId)` -- check if currently in grace period

### API routes

- `POST /api/billing/checkout` -- creates Stripe Checkout Session; body: `{ goalId }`; returns `{ checkoutUrl }`; dev mode returns mock URL
- `POST /api/billing/webhook` -- Stripe webhook handler; raw body + signature verification; handles 4 event types
- `GET /api/billing/status` -- lists all subscriptions with goal info for billing dashboard
- `POST /api/billing/portal` -- creates Stripe billing portal session; returns `{ portalUrl }`

### Modified files

- `lib/heartbeat.ts` -- added billing gate in `runHeartbeatCycle()` before floor checks
- `lib/building-loop.ts` -- added floor billing after `updateFloorStatus(floorId, 'live')`
- `app/onboard/page.tsx` -- `handleApprove()` routes through billing checkout when `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set; falls back to direct approve in dev mode
- `app/buildings/[goalId]/page.tsx` -- detects `?checkout=success` URL param; shows auto-dismissing payment confirmation banner (5s)
- `components/Nav.tsx` -- added "Billing" link

### Environment variables

- `STRIPE_SECRET_KEY` -- Stripe secret key (server-side)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` -- Stripe publishable key (client-side, for checkout flow detection)
- `STRIPE_WEBHOOK_SECRET` -- Stripe webhook signing secret

### Dependencies added

- `stripe` -- Stripe Node.js SDK (v20.x)
- `@stripe/stripe-js` -- Stripe.js client SDK

### Constraints

- Stripe errors NEVER block builds -- all billing code is wrapped in try/catch
- Dev mode (no STRIPE_SECRET_KEY) bypasses all billing gates and returns mock checkout URLs
- Grace period: 72 hours after payment failure before heartbeat pause
- Floor billing failure never blocks floor going live
- No card details stored -- all handled by Stripe Checkout
- The direct approve route (`POST /api/goals/[id]/approve`) still works for dev/testing
- Webhook returns 200 for all handled and unhandled events; 400 only for signature verification failure

## Phase 10: Perpetual Loop + Production

**Status:** COMPLETE (March 2026) -- ALL 10 PHASES DONE. PRODUCTION READY.

### Part A (Steps 1-6)

1. **Steven Suggestions Engine** -- Elira evaluates accumulated suggestions, auto-creates expansion floors
2. **Building Templates** -- Completed goals saved as reusable blueprints with category detection
3. **Building Versioning + Rollback** -- Floor snapshots before destructive changes, rollback API
4. **Environment Validation** -- Startup validation of required/recommended env vars via `lib/env-validator.ts`
5. **Rate Limiting** -- Per-IP API rate limiter (`lib/rate-limiter.ts`) applied via `middleware.ts`
6. **Admin Dashboard** -- `/admin` page with goals, floors, patterns, system health (requires ADMIN_EMAIL)

### Part B (Steps 7-10)

7. **README + GitHub Preparation**
   - `README.md` -- full project documentation (254 lines): building loop ASCII diagram, env vars table, architecture overview, agent roster, API routes, pricing
   - `CONTRIBUTING.md` -- fork/branch/PR workflow, tsc 0 errors + build pass requirement
   - `LICENSE` -- AGPL-3.0-or-later
   - `.github/ISSUE_TEMPLATE/bug_report.md` -- updated for AskElira 2.1

8. **Unified Database Migration** (`scripts/migrate-all.mjs`)
   - 24 idempotent SQL statements covering all 8 tables + indexes + ALTER TABLE columns
   - Tables: goals, floors, agent_logs, heartbeat_logs, automation_patterns, subscriptions, building_templates, floor_snapshots
   - npm script: `npm run db:migrate`
   - Verified: 24 OK, 0 FAIL

9. **Smoke Test** (`scripts/smoke-test.ts`)
   - 7 test sections: env check, DB tables, Alba (Brave Search), heartbeat registry, pattern manager, cleanup, summary
   - Only 1 Brave Search API call (cheap)
   - No designBuilding or runFloor calls (no token cost)
   - npm script: `npm run smoke`

10. **Final Verification**
    - `npx tsc --noEmit` -- 0 TypeScript errors
    - `npm run build` -- PASSED (24 static pages, all routes compiled)
    - `node scripts/migrate-all.mjs` -- 24/24 OK
    - All new files verified present

### Core files added/modified in Phase 10

| File | Purpose |
|------|---------|
| `lib/env-validator.ts` | Environment variable validation at startup |
| `lib/rate-limiter.ts` | Per-IP sliding window rate limiter |
| `middleware.ts` | Next.js middleware with rate limiting |
| `instrumentation.ts` | Startup hook: env validation + heartbeat recovery |
| `app/admin/page.tsx` | Admin dashboard (goals, floors, patterns, health) |
| `scripts/migrate-all.mjs` | Unified idempotent database migration (24 statements) |
| `scripts/smoke-test.ts` | Cheap smoke test (env, DB, Alba, heartbeat, patterns) |
| `README.md` | Full project documentation |
| `CONTRIBUTING.md` | Contributor guide |
| `LICENSE` | AGPL-3.0-or-later |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Bug report template |

### Production Checklist

- [x] All 10 phases implemented
- [x] TypeScript strict mode: 0 errors
- [x] Production build: PASSED
- [x] Database: 8 tables with idempotent migrations
- [x] 5-agent building loop: Alba -> Vex1 -> David -> Vex2 -> Elira
- [x] Steven heartbeat: autonomous monitoring with escalation
- [x] Daily intelligence scraping: 50 categories, confidence scoring
- [x] Stripe billing: checkout, webhooks, portal, billing gates
- [x] Real-time dashboard: Socket.io + GSAP animations
- [x] Customer onboarding: 4-step wizard with 3D visualization
- [x] Building templates: reusable blueprints from completed goals
- [x] Floor versioning: snapshots + rollback
- [x] Rate limiting: per-IP sliding window
- [x] Environment validation: startup checks
- [x] Admin dashboard: system overview + management

## CLI Phase 1: Foundation & Auth

**Status:** COMPLETE (March 2026)

Standalone CLI package at `cli/` with commander-based entry point, persistent auth store (`~/.askelira/config.json`), and login/logout/whoami commands. CommonJS-compatible deps (chalk@4, ora@5, inquirer@8, conf@10). Server-side verify-key API at `app/api/auth/verify-key/route.ts`.

## CLI Phase 2: API Client + Core Commands

**Status:** COMPLETE (March 2026)

Full API client (`cli/lib/api.ts`) wrapping all endpoints with native http/https. Shared formatting (`cli/lib/format.ts`). Commands: status, floors, logs (--tail, --agent, --floor), watch (live TUI), build (7-step wizard), heartbeat (--trigger).

## CLI Phase 3: Xterm.js Browser Terminal

**Status:** COMPLETE (March 2026)

Browser-based terminal and file browser for customer workspace access. Xterm.js with AskElira purple/dark theme. Socket.io /terminal namespace for PTY sessions. Workspace sync writes build outputs to per-customer directories.

### Architecture

1. **Workspace Isolation:** Each customer gets a sandboxed workspace at `~/askelira/workspaces/<customerId>/`
2. **Terminal Mode:** Full xterm.js PTY terminal when node-pty is available, readonly file browser fallback when not
3. **Workspace Sync:** Building loop writes floor outputs to customer workspace after each floor goes live
4. **Path Safety:** All workspace access validated against path traversal attacks

### Core files

**Workspace Management:**
- `lib/workspace-paths.ts` -- Workspace directory management; `getWorkspacePath(customerId)`, `ensureWorkspace(customerId)`, `listWorkspaceFiles(customerId)`, `readWorkspaceFile(customerId, path)`, `isPathSafe(customerId, path)`; path traversal protection via sanitizeId + resolved path check

**Terminal Server:**
- `lib/terminal-server.ts` -- Socket.io /terminal namespace handler; `registerTerminalHandlers(io)` spawns bash in customer workspace via node-pty; `isPtyAvailable()` check; `killAllSessions()` cleanup; graceful fallback when node-pty not installed

**Workspace Sync:**
- `lib/workspace-sync.ts` -- `writeFloorOutput(customerId, floorNumber, floorName, buildOutput, handoffNotes)` writes to floors/ and automations/; `writeSoulMd(customerId, goalText, floors)` updates workspace SOUL.md; NEVER throws

**React Components:**
- `components/WorkspaceTerminal.tsx` -- Xterm.js terminal; dynamic import (ssr:false); connects to Socket.io /terminal namespace; AskElira dark theme (#07070E bg, #9D72FF cursor); toolbar with status indicator and workspace path; FitAddon + WebLinksAddon; ResizeObserver for auto-fit
- `components/WorkspaceFileBrowser.tsx` -- Readonly file browser fallback; two-panel layout (file tree + content viewer); fetches from /api/workspaces/* API routes

**API Routes:**
- `GET /api/workspaces/[customerId]` -- lists files (2 levels deep)
- `GET /api/workspaces/[customerId]/[...path]` -- reads file content with path traversal protection
- `GET /api/terminal/available` -- checks node-pty availability; returns `{ available, mode: 'full'|'readonly' }`

**Dashboard Integration:**
- `app/buildings/[goalId]/page.tsx` -- terminal/file browser toggle button; checks /api/terminal/available on mount; shows WorkspaceTerminal (full mode) or WorkspaceFileBrowser (readonly mode)

**CLI Command:**
- `cli/commands/workspace.ts` -- `askelira workspace` (info), `askelira workspace ls` (list files), `askelira workspace cat <file>` (read file), `askelira workspace open` (open in Finder/Explorer)

### Building Loop Integration

In `lib/building-loop.ts`: after a floor goes live, calls `writeFloorOutput()` and `writeSoulMd()` from workspace-sync.ts. Uses goal.customerId for workspace directory. Wrapped in try/catch -- never blocks the loop.

### Dependencies

**Root project:**
- `@xterm/xterm` -- terminal emulator (browser-side)
- `@xterm/addon-fit` -- auto-fit terminal to container
- `@xterm/addon-web-links` -- clickable links in terminal
- `node-pty` -- PTY spawner (optionalDependency, build works without it)

### Modified files

- `package.json` -- added @xterm/*, node-pty (optionalDependencies)
- `next.config.js` -- added node-pty to serverComponentsExternalPackages
- `tsconfig.json` -- excluded cli/ from root compilation
- `.env.example` -- added WORKSPACES_PATH
- `lib/building-loop.ts` -- added workspace sync after floor goes live
- `app/buildings/[goalId]/page.tsx` -- added terminal/file browser toggle
- `cli/bin/askelira.ts` -- replaced workspace placeholder with real command

### Environment variables

- `WORKSPACES_PATH` -- customer workspace root (default: ~/askelira/workspaces)

### Constraints

- node-pty is optionalDependency -- Next.js build passes without it
- Path traversal protection on all workspace access (sanitizeId + resolved path check)
- Terminal scoped to customer workspace -- HOME env set to workspace directory
- One PTY shell per socket connection -- killed on disconnect
- WorkspaceTerminal uses dynamic import with ssr: false
- Workspace sync NEVER throws -- all errors are swallowed
- CLI workspace command works via API (no direct filesystem access from CLI)

## CLI Phase 4: Final Commands + NPM Publish Preparation

**Status:** COMPLETE (March 2026)

All 16 CLI commands wired with zero placeholders. NPM publish preparation complete. Shell completions, update checker, smoke test suite.

### New Commands (6)

| Command | File | Description |
|---------|------|-------------|
| `askelira run [goalId]` | `cli/commands/run.ts` | Trigger heartbeat check manually (--floor, --dry-run) |
| `askelira rollback [goalId]` | `cli/commands/rollback.ts` | Interactive floor rollback to prior snapshot |
| `askelira start [goalId]` | `cli/commands/start.ts` | Start Steven heartbeat with interval selection |
| `askelira stop [goalId]` | `cli/commands/stop.ts` | Stop heartbeat with confirmation |
| `askelira init` | `cli/commands/init.ts` | Setup wizard (server URL, auth, env check) |
| `askelira completion [shell]` | `cli/commands/completion.ts` | Shell completion (bash, zsh, install) |

### All 16 Commands

login, logout, whoami, build, status, floors, logs, watch, run, rollback, workspace, start, stop, heartbeat, init, completion

### New Features

**--json flag:** `askelira status --json` and `askelira floors --json` output raw JSON for scripting.

**Mini dashboard:** Running `askelira` with no args (when logged in) shows last 3 buildings with progress bars.

**Update checker:** Background npm registry check, cached 1 hour, prints update notice after command. Never throws or blocks.

**Shell completions:** Bash and zsh completion scripts with command and option completion. Auto-install to ~/.bashrc or ~/.zshrc.

**Global error handling:** uncaughtException and unhandledRejection handlers with bug report link.

### New API Route

- `GET /api/floors/[floorId]/snapshots` -- returns snapshots for a floor (used by rollback command)

### New API Client Methods (cli/lib/api.ts)

- `getSnapshots(floorId)` -- GET /api/floors/${floorId}/snapshots
- `rollbackFloor(floorId, snapshotId?)` -- POST /api/floors/${floorId}/rollback
- `startHeartbeatApi(goalId, intervalMs?)` -- POST /api/heartbeat/${goalId}/start
- `stopHeartbeatApi(goalId)` -- POST /api/heartbeat/${goalId}/stop

### New Format Helper (cli/lib/format.ts)

- `formatInterval(ms)` -- human-readable interval (e.g., "5 minutes", "1 hour")

### NPM Publish Preparation

- `cli/package.json` -- name "askelira", author "Alvin Kerremans", AGPL-3.0, files array, engines node>=18, keywords, homepage, repository, bugs
- `cli/README.md` -- install, quick start, command table, options, agents
- `cli/.npmignore` -- excludes source files, only publishes dist/
- Root `package.json` -- added `cli:publish` and `cli:publish:dry` scripts

### Smoke Test

- `cli/scripts/smoke-test.sh` -- tests --version, --help, all 16 command helps, placeholder check
- npm script: `cd cli && npm run smoke-test`
- 19 tests, all passing

### Constraints

- CLI uses CommonJS (chalk@4, ora@5, inquirer@8, conf@10)
- Update checker NEVER throws or blocks
- Shell completion outputs ONLY the script to stdout (no extra text)
- init wizard works for localhost and hosted
- rollback shows helpful message if no snapshots available
- All new commands accept optional goalId (prompt to select if omitted)
