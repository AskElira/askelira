# Steven Alpha QA -- Installment 5 (FINAL): Bug Report

**Date**: 2026-03-23
**Agent**: Steven Alpha (Opus 4.6)
**Bugs Found**: 10 (Bugs 41-50)

---

## Bug 41 (CRITICAL): PTY Shell Leaks Server Secrets to Customer

**File**: `lib/terminal-server.ts` line 138-148
**Severity**: CRITICAL
**Category**: Security -- Information Disclosure

The terminal server PTY spawn spreads `...Object.fromEntries(Object.entries(process.env).filter(...))` into the customer's shell environment, only filtering out entries where `entry[1] === undefined`. This means every server secret -- `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `POSTGRES_URL`, `STRIPE_WEBHOOK_SECRET`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `ADMIN_EMAIL` -- is available in the customer's terminal shell. A customer can simply run `env` or `echo $ANTHROPIC_API_KEY` to extract all secrets.

---

## Bug 42 (MEDIUM): Operator Precedence Bug in Swarm Confidence Display

**File**: `lib/validators/swarm-intelligence.ts` line 465
**Severity**: MEDIUM
**Category**: Logic -- Incorrect Computation

The expression `(confidence ?? 0 * 100).toFixed(1)` evaluates as `(confidence ?? (0 * 100))` due to `*` having higher precedence than `??`. This means the fallback is `0` instead of `0`, and confidence is displayed as a 0-1 raw decimal (e.g., "0.7%") instead of a percentage (e.g., "70.0%") in the combined validation report.

---

## Bug 43 (HIGH): SSRF in URL Fetcher -- No Internal Address Blocking

**File**: `lib/tools/url-fetcher.ts` line 8-18
**Severity**: HIGH
**Category**: Security -- SSRF

The `fetchUrl()` function accepts any URL and fetches it with no validation. An attacker who controls floor descriptions or research inputs (e.g., via goal text) can trigger Alba's research flow to fetch internal URLs such as:
- `http://169.254.169.254/latest/meta-data/` (AWS instance metadata, leaks IAM credentials)
- `http://localhost:3000/api/...` (internal API routes, bypassing auth)
- `http://10.0.0.1/...` (internal network services)
- `file:///etc/passwd` (local file access)

---

## Bug 44 (HIGH): Command Injection in Syntax Validator via execSync

**File**: `lib/syntax-validator.ts` lines 92, 112, 140
**Severity**: HIGH
**Category**: Security -- Command Injection

The syntax validator uses `execSync()` with string interpolation for file paths: `execSync(\`node --check "${filePath}"\`)`. Since `filePath` includes `file.name` from David's LLM-generated output, a malicious or hallucinated file name like `"; rm -rf / #.js` would execute arbitrary commands. The quotes around `"${filePath}"` provide minimal protection (can be escaped with `$(...)` or backticks).

---

## Bug 45 (MEDIUM): Template Routes Leak Internal Error Details

**File**: `app/api/templates/route.ts` line 21-24, `app/api/templates/[id]/route.ts` line 46-50
**Severity**: MEDIUM
**Category**: Security -- Information Disclosure

Both template routes pass `err.message` directly to the JSON response on 500 errors. Database errors can contain connection strings (`postgres://user:pass@host/db`), table names, column names, and stack traces -- all useful for attackers mapping the infrastructure.

---

## Bug 46 (HIGH): Billing Checkout Missing Goal Ownership Verification

**File**: `app/api/billing/checkout/route.ts` lines 39-48
**Severity**: HIGH
**Category**: Security -- Authorization Bypass (IDOR)

The checkout route is authenticated but does not verify that the authenticated user owns the goal. Any authenticated user can POST `{ goalId: "other-users-goal-id" }` and create a Stripe checkout session for another user's goal. This can:
- Allow an attacker to pay for someone else's goal and gain control
- Manipulate subscription records
- Associate their payment with another user's infrastructure

---

## Bug 47 (MEDIUM): Stripe Client Crashes on Missing STRIPE_SECRET_KEY

**File**: `lib/stripe.ts` line 3
**Severity**: MEDIUM
**Category**: Reliability -- Crash at Import

`new Stripe(process.env.STRIPE_SECRET_KEY!, ...)` uses a TypeScript non-null assertion. When `STRIPE_SECRET_KEY` is not set (local dev, new deployments, misconfigured env), this creates a Stripe client with `undefined` as the key. The client object exists but every subsequent call produces cryptic "Invalid API Key provided: undefined" errors. Worse, since this runs at module import time, importing `@/lib/stripe` in any file crashes the entire module graph.

---

## Bug 48 (LOW): Env Validator Throws Before Logging Recommended Var Warnings

**File**: `lib/env-validator.ts` lines 52-66
**Severity**: LOW
**Category**: Observability -- Missing Diagnostics

The validator logs missing required vars and then `throw`s before reaching the code that logs missing recommended vars. An operator deploying to production with missing `STRIPE_SECRET_KEY` and `BRAVE_SEARCH_API_KEY` would only see the required vars error, not the recommended vars warning. This makes debugging incomplete deployments harder.

---

## Bug 49 (HIGH): IDOR on Debate Results -- No Ownership Scoping

**File**: `app/api/swarm/[id]/route.ts` lines 15-24
**Severity**: HIGH
**Category**: Security -- Authorization Bypass (IDOR)

The debate result endpoint is authenticated but does not verify that the requested debate belongs to the authenticated user. Debate IDs follow a predictable pattern (`sw_<timestamp36>_<random6>`), making enumeration feasible. Any authenticated user can fetch any other user's debate results, which may contain sensitive business strategy information.

---

## Bug 50 (MEDIUM): No Limit on Concurrent PTY Sessions Per Customer

**File**: `lib/terminal-server.ts` lines 96-211
**Severity**: MEDIUM
**Category**: Security -- Resource Exhaustion (DoS)

The terminal server tracks sessions by socket ID but does not limit how many PTY processes a single customer can spawn. A malicious customer can open hundreds of WebSocket connections, each spawning a new bash process with `node-pty`. This is effectively a fork bomb that can exhaust server memory and process limits, causing denial of service for all other customers.
