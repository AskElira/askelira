# Building Loop Fix - Alba JSON Format Bug

## Problem
Building stuck at 0% after Vex Gate 1 rejection - Alba never progressed past iteration 1.

**Symptoms:**
- `askelira watch` showed [RESEARCHING] (iter 2) indefinitely
- Recent Activity stopped after "Vex gate1 rejected"
- No progress for extended period

## Root Cause Analysis

### Investigation Steps
1. Checked server logs: `[API /loop/step] Step "alba" error: Cannot read properties of undefined (reading 'slice')`
2. Found error location: `lib/step-runner.ts` line 360: `albaResult.approach.slice(0, 2000)`
3. Traced back to Alba response: **Alba was returning markdown, not JSON**

### The Bug
Alba returned:
```markdown
# Alba's Research Report: Google Maps Scraper Foundation (Revised)

## Approach

After addressing the VEX Gate 1 legal concerns...
```

Instead of:
```json
{
  "approach": "...",
  "implementation": "...",
  "libraries": [...],
  ...
}
```

**Impact:**
- `parseJSON()` failed to extract valid JSON from markdown
- Returned partial object with `approach` undefined
- Code called `albaResult.approach.slice()` → TypeError
- Building loop crashed, no continuation triggered

## Fixes Applied

### 1. Alba Prompt Fix (`lib/agent-prompts.ts`)
**Before:**
```typescript
export const ALBA_RESEARCH_PROMPT = `You are Alba...

Output valid JSON matching this schema:
{
  "approach": "...",
  ...
}`;
```

**After:**
```typescript
export const ALBA_RESEARCH_PROMPT = `You are Alba...

CRITICAL: You MUST respond with ONLY a raw JSON object. Do NOT use markdown code fences, do NOT add explanatory text before or after the JSON. Your entire response must be parseable as JSON.

Output valid JSON matching this schema:
{
  "approach": "...",
  ...
}

Return ONLY the JSON object, nothing else.`;
```

### 2. Validation Fix (`lib/step-runner.ts`)
Added defensive validation after JSON parsing:

```typescript
const albaResult = parseJSON<AlbaResult>(albaRaw, 'Alba');

// Validate required fields exist
if (!albaResult.approach || typeof albaResult.approach !== 'string') {
  console.error('[StepRunner] Alba returned invalid result - missing approach field');
  return {
    step: 'alba',
    success: false,
    nextStep: iterationCount < MAX_ITERATIONS ? 'alba' : 'done',
    message: `Alba error: Invalid response format (missing approach). ${iterationCount < MAX_ITERATIONS ? 'Will retry.' : 'Max iterations reached.'}`,
    floorId,
    iteration: iterationCount < MAX_ITERATIONS ? iterationCount + 1 : iterationCount,
  };
}
```

## Verification

**Before Fix:**
- Floor 1: [RESEARCHING] (iter 2) - STUCK indefinitely
- Logs: `Cannot read properties of undefined (reading 'slice')`
- No progress after Vex rejection

**After Fix:**
```
✓ Alba iteration 2 completed (JSON format)
✓ Vex Gate 1 ran (rejected with feedback)
✓ Alba iteration 3 triggered automatically
✓ Vex Gate 1 ran (rejected again)
✓ Alba iteration 4 triggered automatically
✓ Vex Gate 1 ran (rejected again)
✓ Alba iteration 5 currently running
```

Building now progressing through iterations correctly! Vex is rejecting for valid reasons (cost concerns, ethical issues, data completeness <90%), which is the quality gate system working as designed.

## Status
✅ **FIXED** - Building loop operational
✅ Iterations progressing: 2 → 3 → 4 → 5 → ...
✅ Alba → Vex rejection cycle working correctly
✅ Continuation mechanism firing successfully

## Related Fixes
- **Yesterday**: Fixed NEXTAUTH_URL port mismatch (3001 → 3000)
- **Today**: Fixed Alba JSON format + validation

Both issues were **separate bugs** affecting the building loop.

## Prevention
Consider adding:
1. JSON schema validation for all agent responses
2. Unit tests for parseJSON with various malformed inputs
3. Integration tests for Alba → Vex rejection cycle
4. Stronger prompt engineering for all agents to enforce JSON-only output
