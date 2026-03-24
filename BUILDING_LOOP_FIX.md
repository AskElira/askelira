# Building Loop Fix - Stuck at 0%

## Problem
Buildings would get stuck at 0% progress after Floor 1 Vex rejection, never progressing beyond iteration 1.

## Root Cause
**Wrong Port in NEXTAUTH_URL**

```bash
# WRONG (in .env)
NEXTAUTH_URL=http://localhost:3001

# Server actually runs on:
Port 3000
```

**Impact:**
- Every building loop continuation would call `http://localhost:3001/api/loop/step/...`
- Nothing listening on port 3001 → 500 error
- Next step never triggered → building stuck forever

## Evidence
```
[API /approve] Firing continuation: http://localhost:3001/api/loop/step/...
[API /approve] Continuation response: 500
```

## Fix Applied

### 1. Update .env
```bash
# Before
NEXTAUTH_URL=http://localhost:3001

# After
NEXTAUTH_URL=http://localhost:3000
```

### 2. Restart Server
```bash
kill <PID>
ANTHROPIC_API_KEY=sk-ant-api03-tH... npm run dev
```

### 3. Manually Trigger Stuck Floor (if needed)
```bash
curl -X POST 'http://localhost:3000/api/loop/step/FLOOR_ID?step=alba&iteration=2' \
  -H "x-cron-secret: dev-cron-secret"
```

## Verification

**Before Fix:**
- Floor 1: `auditing` (iteration 1) - STUCK
- Logs: `Continuation response: 500`
- No progress for 8+ hours

**After Fix:**
- Floor 1: `auditing` (iteration 2) - PROGRESSING ✅
- Logs: `Firing continuation: http://localhost:3000/...` ✅
- Alba → Vex → Alba → Vex cycle working ✅

## How to Prevent

Add to your `.env` validation:
```typescript
if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes(':3000')) {
  console.warn('[WARNING] NEXTAUTH_URL port mismatch - should be :3000');
}
```

## Related Files
- `.env` - Configuration file (not in git)
- `lib/step-runner.ts` - Building loop step execution
- `app/api/loop/step/[floorId]/route.ts` - Step endpoint
- `app/api/loop/start/[floorId]/route.ts` - Loop starter

## Timeline
- **2026-03-22 05:56** - Building started, Floor 1 Alba completes
- **2026-03-22 05:57** - Vex rejects (iteration 1), tries to continue
- **2026-03-22 05:57-13:50** - STUCK for 8 hours (wrong port)
- **2026-03-22 13:50** - Port fixed, manually triggered iteration 2
- **2026-03-22 13:52** - Alba iteration 2 completes, Vex starts ✅
- **RESOLUTION: Building loop now operational**

## Status
✅ **FIXED** - Buildings now progress through iterations correctly
