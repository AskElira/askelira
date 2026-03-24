# Steven Alpha QA -- Installment 5 (FINAL): Fix Log

**Date**: 2026-03-23
**Agent**: Steven Alpha (Opus 4.6)
**Bugs Fixed**: 10 (Bugs 41-50)

---

## Fix 41: PTY Shell Environment Allowlist

**File**: `lib/terminal-server.ts`
**Root Cause**: Spread of entire `process.env` into customer PTY shell
**Fix**: Replaced the open env filter (`entry[1] !== undefined`) with an explicit `SAFE_ENV_VARS` Set allowlist containing only: PATH, LANG, LC_ALL, LC_CTYPE, SHELL, USER, LOGNAME, TMPDIR, TMP, TEMP. All server secrets (API keys, DB URLs, webhook secrets) are now excluded from the PTY environment.
**Lines Changed**: +12

---

## Fix 42: Operator Precedence in Confidence Display

**File**: `lib/validators/swarm-intelligence.ts`
**Root Cause**: `confidence ?? 0 * 100` evaluated as `confidence ?? 0` due to `*` precedence over `??`
**Fix**: Changed to `((confidence ?? 0) * 100)` with explicit parentheses
**Lines Changed**: 1

---

## Fix 43: SSRF Protection in URL Fetcher

**File**: `lib/tools/url-fetcher.ts`
**Root Cause**: No validation of URLs before fetching
**Fix**: Added `isBlockedUrl()` function with:
  - `BLOCKED_HOSTS` array (localhost, 127.0.0.1, 169.254.169.254, metadata.google.internal, etc.)
  - `PRIVATE_IP_PATTERNS` regex array (10.x.x.x, 172.16-31.x.x, 192.168.x.x, link-local, IPv6 ULA/link-local)
  - Protocol check: only http: and https: allowed (blocks file://, ftp://, etc.)
  - Called before every fetch in `fetchUrl()`
**Lines Changed**: +38

---

## Fix 44: Command Injection Prevention in Syntax Validator

**File**: `lib/syntax-validator.ts`
**Root Cause**: `execSync()` with string interpolation passes file paths through shell interpretation
**Fix**: Replaced all `execSync()` calls with `execFileSync()` which passes arguments as an array, bypassing shell interpretation entirely:
  - `execSync(\`node --check "${filePath}"\`)` -> `execFileSync('node', ['--check', filePath])`
  - `execSync(\`python3 -m py_compile "${filePath}"\`)` -> `execFileSync('python3', ['-m', 'py_compile', filePath])`
  - `execSync(\`tsc --version\`)` -> `execFileSync('tsc', ['--version'])`
  - `execSync(\`tsc --noEmit ... "${filePath}"\`)` -> `execFileSync('tsc', ['--noEmit', ..., filePath])`
**Lines Changed**: ~8

---

## Fix 45: Generic Error Messages in Template Routes

**Files**: `app/api/templates/route.ts`, `app/api/templates/[id]/route.ts`
**Root Cause**: `err.message` passed directly to JSON response
**Fix**: Log the real error server-side, return a static generic message to the client:
  - `/templates`: returns `"Failed to fetch templates"`
  - `/templates/[id]`: returns `"Failed to fetch template"`
**Lines Changed**: 4 per file

---

## Fix 46: Goal Ownership Check in Billing Checkout

**File**: `app/api/billing/checkout/route.ts`
**Root Cause**: Authenticated user could create checkout for any goalId
**Fix**: After `getGoal(goalId)`, added ownership check: `if (goal.customerId !== authSession.user.email) return 404`. Returns 404 (not 403) to prevent goal enumeration.
**Lines Changed**: +6

---

## Fix 47: Lazy Stripe Client Initialization

**File**: `lib/stripe.ts`
**Root Cause**: `new Stripe(process.env.STRIPE_SECRET_KEY!)` at import time crashes or creates invalid client when key is missing
**Fix**: Replaced eager initialization with lazy `getStripeClient()` function that:
  - Initializes on first use, not at import time
  - Throws a clear error message when STRIPE_SECRET_KEY is not set
  - Uses a Proxy for backward compatibility (`import { stripe }` still works)
**Lines Changed**: ~20

---

## Fix 48: Env Validator Logging Order

**File**: `lib/env-validator.ts`
**Root Cause**: `throw` for missing required vars happened before recommended vars warning was logged
**Fix**: Moved the `if (warnings.length > 0)` block BEFORE the `if (missing.length > 0)` block, so recommended var warnings are always logged even when required vars are missing and cause a throw.
**Lines Changed**: Reordered existing blocks

---

## Fix 49: IDOR Protection on Debate Results

**File**: `app/api/swarm/[id]/route.ts`
**Root Cause**: Any authenticated user could fetch any debate by ID
**Fix**: After fetching the debate result, query the `debates` table for `user_email` and compare to `session.user.email`. Returns 404 if ownership does not match. Gracefully handles DB unavailability (local dev fallback).
**Lines Changed**: +15

---

## Fix 50: Per-Customer PTY Session Limit

**File**: `lib/terminal-server.ts`
**Root Cause**: No limit on concurrent PTY processes per customer
**Fix**: Added:
  - `MAX_SESSIONS_PER_CUSTOMER = 3` constant
  - `customerSessionCounts` Map tracking active sessions per customer
  - Check on connection: reject if at limit
  - Increment on successful spawn
  - Decrement on disconnect (with proper cleanup when count reaches 0)
**Lines Changed**: +18
