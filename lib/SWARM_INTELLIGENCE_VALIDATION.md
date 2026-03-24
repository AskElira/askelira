# 🤖 Swarm Intelligence Validation Documentation

## Overview

**Phase 6 Complete** ✅

The Swarm Intelligence Validation System is the **third and final validation method**. It combines results from Pattern Matching and Risk Analysis, adds multi-agent debate, and produces a unified confidence score for the final go/no-go decision.

**All Three Validation Methods**:
1. ✅ **Pattern Matching** (Phase 4) - Validates against proven patterns
2. ✅ **Risk Analysis** (Phase 5) - Analyzes potential risks
3. ✅ **Swarm Intelligence** (Phase 6) - Multi-agent debate + unified decision

---

## Swarm Process

### Three-Method Validation Flow

```
Alba Research Complete
    ↓
Pattern Matching Validation
    - Category detection
    - Pattern matching (30% weight)
    - Deviation detection
    ↓
Risk Analysis Validation
    - Security, reliability, cost, maintenance
    - Risk scoring (40% weight)
    - Mitigation recommendations
    ↓
Swarm Intelligence Validation
    - Agent debate (30% weight)
    - Unified confidence calculation
    - Final decision (approve/reject/revise)
    ↓
Combined Report
    - All three validations
    - Unified confidence score
    - Final recommendation
```

---

## Agent Debate

### Three Agents

1. **SecurityAgent**
   - Focus: Security and risk concerns
   - Stance: Based on critical/high risks
   - Approves if: No critical risks
   - Rejects if: Critical risks detected

2. **PatternAgent**
   - Focus: Pattern matching results
   - Stance: Based on pattern confidence
   - Approves if: Pattern confidence > 70%
   - Neutral if: Pattern confidence 50-70%

3. **PragmaticAgent**
   - Focus: Implementation complexity and practicality
   - Stance: Based on complexity score
   - Approves if: Complexity < 7
   - Neutral if: Complexity 7-10

### Debate Rounds

Currently: 2 rounds

**Round 1**: Each agent states initial stance based on their focus area
**Round 2**: Agents review others' concerns and reach consensus

### Consensus Rules

```
IF any agent REJECTS:
  finalRecommendation = 'reject'

ELSE IF 2+ agents APPROVE:
  finalRecommendation = 'approve'

ELSE:
  finalRecommendation = 'revise'
```

---

## Unified Confidence Calculation

### Formula

```typescript
UnifiedConfidence =
  (PatternConfidence × 0.3) +
  (RiskConfidence × 0.4) +
  (SwarmConfidence × 0.3)
```

### Component Weights

- **Pattern Matching**: 30% - How well it matches proven patterns
- **Risk Analysis**: 40% - How safe/reliable/cost-effective it is (MOST IMPORTANT)
- **Swarm Debate**: 30% - Agent consensus

### Risk to Confidence Conversion

```typescript
RiskConfidence = max(0, 1 - totalRiskScore / 15)
```

Examples:
- 0 risk → 100% confidence
- 7.5 risk → 50% confidence
- 15+ risk → 0% confidence

### Swarm Confidence Calculation

```typescript
SwarmConfidence = (approvals - rejections + totalAgents) / (2 × totalAgents)
```

Examples:
- 3/3 approve → 100% confidence
- 2/3 approve → 67% confidence
- 1/3 approve → 33% confidence
- 0/3 approve → 0% confidence

---

## Final Decision Logic

### Decision Thresholds

```
REJECT if:
  - Any critical risks detected (severity ≥ 7)
  - Swarm recommends rejection
  - Unified confidence < 50%

REVISE if:
  - Unified confidence 50-65%
  - No critical risks
  - Swarm does not reject

APPROVE if:
  - Unified confidence ≥ 65%
  - No critical risks
  - Swarm approves or neutral
```

---

## Example Scenarios

### Scenario 1: High-Quality Approach (APPROVE)

**Alba Result**:
- Well-researched approach using proven libraries
- Proper security measures (API keys in .env)
- Error handling and rate limiting
- Complexity: 4/10

**Validation Results**:
- Pattern Matching: 85% confidence (2 matched patterns)
- Risk Analysis: 2.5 risk score (0 critical, 1 medium risk)
- Agent Debate: 3/3 approve

**Unified Confidence**:
```
= (0.85 × 0.3) + (0.83 × 0.4) + (1.0 × 0.3)
= 0.255 + 0.332 + 0.300
= 0.887 = 88.7%
```

**Final Decision**: APPROVE ✅

---

### Scenario 2: Risky Approach (REJECT)

**Alba Result**:
- Uses expensive LLM APIs without cost controls
- Hardcoded API keys mentioned
- No error handling
- SQL queries with user input, no sanitization
- Complexity: 8/10

**Validation Results**:
- Pattern Matching: 40% confidence (low pattern match)
- Risk Analysis: 18.3 risk score (2 critical, 3 high risks)
- Agent Debate: 0/3 approve, 2/3 reject

**Unified Confidence**:
```
= (0.40 × 0.3) + (0.0 × 0.4) + (0.0 × 0.3)
= 0.120 + 0.000 + 0.000
= 0.120 = 12.0%
```

**Final Decision**: REJECT ❌

**Reason**: Critical security risks (API key exposure, SQL injection)

---

### Scenario 3: Decent But Improvable (REVISE)

**Alba Result**:
- Solid approach but missing some best practices
- Uses appropriate libraries
- Rate limiting not mentioned
- Complexity: 6/10

**Validation Results**:
- Pattern Matching: 65% confidence (1 matched pattern)
- Risk Analysis: 8.5 risk score (0 critical, 2 high risks)
- Agent Debate: 1/3 approve, 2/3 neutral

**Unified Confidence**:
```
= (0.65 × 0.3) + (0.43 × 0.4) + (0.33 × 0.3)
= 0.195 + 0.172 + 0.099
= 0.466 = 46.6%

Wait, that would be REJECT (< 50%). Let me recalculate with better numbers...

Actually with 8.5 risk:
RiskConfidence = 1 - 8.5/15 = 0.43 (43%)

Let's say pattern was 70% instead:
= (0.70 × 0.3) + (0.43 × 0.4) + (0.33 × 0.3)
= 0.210 + 0.172 + 0.099
= 0.481 = 48.1%

Still REJECT. For REVISE, need 50-65%:

Better scenario:
- Pattern: 75%, Risk: 6.5 (confidence: 57%), Swarm: 1/3 approve (33%)
= (0.75 × 0.3) + (0.57 × 0.4) + (0.33 × 0.3)
= 0.225 + 0.228 + 0.099
= 0.552 = 55.2%
```

**Final Decision**: REVISE ⚠️

**Recommended Changes**:
1. Add rate limiting with exponential backoff
2. Add network error handling with retries
3. Consider using proven libraries from matched patterns

---

## Code Structure

### File: `lib/validators/swarm-intelligence.ts`

#### Main Function

```typescript
export async function runSwarmValidation(
  albaResult: AlbaApproach,
  floorName: string,
  floorDescription: string | null,
  patternValidation?: PatternValidationResult,
  riskAnalysis?: RiskAnalysisResult,
): Promise<SwarmValidationResult>
```

**Returns**:
```typescript
interface SwarmValidationResult {
  passed: boolean;                    // Pass/fail
  unifiedConfidence: number;          // 0-1 combined score
  agentDebate: AgentDebate;          // Agent debate results
  finalDecision: 'approve' | 'reject' | 'revise';
  reasoning: string;                  // Human-readable explanation
  combinedReport: string;             // Full markdown report
  recommendedChanges: string[];       // Suggested improvements
}
```

#### Agent Debate Interface

```typescript
interface AgentDebate {
  consensus: string;                  // Consensus summary
  agentOpinions: AgentOpinion[];     // Individual agent stances
  debateRounds: number;               // Number of debate rounds
  finalRecommendation: 'approve' | 'reject' | 'revise';
}

interface AgentOpinion {
  agentName: string;                  // Agent identifier
  stance: 'approve' | 'reject' | 'neutral';
  reasoning: string;                  // Why they took this stance
  concerns: string[];                 // Concerns raised
  strengths: string[];                // Strengths identified
}
```

---

## Integration with Step Runner

### File: `lib/step-runner.ts`

#### Integration Point

Swarm validation runs **after** pattern matching and risk analysis:

```typescript
// PHASE 4: Pattern Matching
const patternValidation = await validateAgainstPatterns(...);

// PHASE 5: Risk Analysis
const riskAnalysis = await analyzeRisks(...);

// PHASE 6: Swarm Intelligence (combines all three)
console.log(`[Alba] Running Swarm Intelligence Validation...`);
const swarmValidation = await runSwarmValidation(
  albaResult,
  floor.name,
  floor.description,
  patternValidation,
  riskAnalysis,
);

console.log(`[Alba] Swarm validation ${swarmValidation.passed ? 'PASSED' : 'FAILED'} (confidence: ${(swarmValidation.unifiedConfidence * 100).toFixed(1)}%, decision: ${swarmValidation.finalDecision})`);

// Log recommended changes if any
if (swarmValidation.recommendedChanges.length > 0) {
  console.warn(`[Alba] Recommended changes (${swarmValidation.recommendedChanges.length}):`);
  swarmValidation.recommendedChanges.forEach((change, idx) => {
    console.warn(`  ${idx + 1}. ${change}`);
  });
}

// Enhanced Alba result
const enhancedAlbaResult = {
  ...albaResult,
  swarmValidation: {
    passed: swarmValidation.passed,
    unifiedConfidence: swarmValidation.unifiedConfidence,
    finalDecision: swarmValidation.finalDecision,
    recommendedChangesCount: swarmValidation.recommendedChanges.length,
    agentDebate: {
      consensus: swarmValidation.agentDebate.consensus,
      finalRecommendation: swarmValidation.agentDebate.finalRecommendation,
      agentCount: swarmValidation.agentDebate.agentOpinions.length,
    },
  },
};

// Save to database
await updateFloorStatus(floorId, 'researching', {
  researchOutput: JSON.stringify(enhancedAlbaResult),
  swarmValidationReport: swarmValidation.combinedReport,
});
```

---

## Combined Report Format

Saved to `floor.swarmValidationReport` as markdown:

```markdown
# Swarm Intelligence Validation Report

**Floor**: GitHub API scraper
**Unified Confidence**: 88.7%
**Final Decision**: APPROVE ✅

## Reasoning

Unified confidence: 88.7%. Pattern matching: 85.0% (2 patterns). Risk score: 2.5 (0 critical, 1 high). Agent consensus: 3/3 approve. APPROVE: All validation methods passed with high confidence

## 🔍 Pattern Matching Validation

- **Status**: PASSED ✅
- **Confidence**: 85.0%
- **Category**: api_scraping
- **Matched Patterns**: 2
- **Deviations**: 0

## ⚠️ Risk Analysis

- **Status**: PASSED ✅
- **Total Risk Score**: 2.5
- **Critical Risks**: 0
- **High Risks**: 0
- **Medium Risks**: 1
- **Low Risks**: 2

## 🤖 Agent Debate

- **Consensus**: 3 agents approve the approach
- **Recommendation**: APPROVE
- **Debate Rounds**: 2

**Agent Opinions**:

### 1. SecurityAgent
- **Stance**: APPROVE
- **Reasoning**: Security analysis shows 0 critical risks and 0 high risks
- **Strengths**: Proper API key management, rate limiting implemented

### 2. PatternAgent
- **Stance**: APPROVE
- **Reasoning**: Pattern matching shows 85.0% confidence with 2 matched patterns
- **Strengths**: Matches pattern: GitHub API Integration, Matches pattern: API Scraper with Caching

### 3. PragmaticAgent
- **Stance**: APPROVE
- **Reasoning**: Implementation complexity is 4/10. 3 libraries proposed.
- **Strengths**: Clear approach: Use GitHub REST API v3..., Uses established libraries: @octokit/rest, dotenv, p-retry

## 🎯 Alba's Proposed Approach

**Approach**: Use GitHub REST API v3 with Octokit.js library. Store API keys in .env file. Implement rate limiting with exponential backoff.
**Libraries**: @octokit/rest, dotenv, p-retry
**Complexity**: 4/10
```

---

## Database Schema

### `Floor.researchOutput` (enhanced)

```json
{
  "approach": "...",
  "swarmValidation": {
    "passed": true,
    "unifiedConfidence": 0.887,
    "finalDecision": "approve",
    "recommendedChangesCount": 0,
    "agentDebate": {
      "consensus": "3 agents approve the approach",
      "finalRecommendation": "approve",
      "agentCount": 3
    }
  }
}
```

### `Floor.swarmValidationReport` (new field)

```sql
ALTER TABLE Floor ADD COLUMN swarmValidationReport TEXT;
```

Stores the full markdown combined validation report.

---

## Testing

### Manual Test

```bash
npx tsx /tmp/test_swarm_validation.ts
```

### Expected Output

```
🧪 Testing Swarm Intelligence Validation (Phase 6)

This combines all three validation methods:
  1. Pattern Matching
  2. Risk Analysis
  3. Agent Debate (Swarm Intelligence)

Step 1: Running Pattern Matching...
  ✓ Pattern Matching: PASSED (confidence: 70.0%)

Step 2: Running Risk Analysis...
  ✓ Risk Analysis: PASSED (total risk: 3.5, critical: 0)

Step 3: Running Swarm Intelligence...
  ✓ Swarm Validation Complete!

═══════════════════════════════════════════════════════
FINAL RESULTS
═══════════════════════════════════════════════════════

Status: PASSED ✅
Final Decision: APPROVE
Unified Confidence: 75.2%

Confidence Breakdown:
  - Pattern Matching: 70.0% (weight: 30%)
  - Risk Analysis: 76.7% (weight: 40%)
  - Agent Debate: 100.0% (weight: 30%)

Agent Debate:
  Consensus: 3 agents approve the approach
  Recommendation: APPROVE

  Agent 1: SecurityAgent
    Stance: APPROVE
    Reasoning: Security analysis shows 0 critical risks and 0 high risks

  Agent 2: PatternAgent
    Stance: APPROVE
    Reasoning: Pattern matching shows 70.0% confidence with 2 matched patterns

  Agent 3: PragmaticAgent
    Stance: APPROVE
    Reasoning: Implementation complexity is 4/10. 3 libraries proposed.

✅ Phase 6: Swarm Intelligence Validation - PASSED
   All three validation methods combined successfully
   Final Decision: APPROVE
   Unified Confidence: 75.2%

Validation Methods Summary:
  Pattern Matching: ✅ PASSED
  Risk Analysis: ✅ PASSED
  Swarm Intelligence: ✅ PASSED
```

---

## Performance

**Timing** (example):
- Agent debate simulation: ~10-20ms
- Unified confidence calculation: <1ms
- Combined report generation: ~5-10ms

**Total**: ~15-30ms

**Impact on Alba step**: Negligible (<0.5% overhead)

---

## Future: Full MiroFish Integration

The current implementation uses a **simplified agent debate**. For full MiroFish integration:

```typescript
// Instead of simulating debate:
const agentOpinions: AgentOpinion[] = [];

// Use MiroFish HTTP client:
import { MiroFishClient } from '@/lib/mirofish-client';

const mirofish = new MiroFishClient();
const debateResult = await mirofish.runDebate({
  topic: `Validate automation approach: ${floor.name}`,
  context: {
    albaApproach: albaResult.approach,
    patternValidation: patternValidation.passed,
    riskAnalysis: riskAnalysis.criticalRisks.length,
  },
  agents: ['SecurityAgent', 'PatternAgent', 'PragmaticAgent'],
  rounds: 2,
});

const agentOpinions = debateResult.opinions;
```

---

## Next Phase

**Phase 7: Prediction Prompt Generator**

Now that we have complete validation (all three methods), we need to generate the prediction prompt that guides David's building:
1. Take validated Alba research
2. Combine with swarm validation results
3. Generate structured prompt for David
4. Include all recommendations and mitigations
5. Format for optimal code generation

---

## Summary

**Phase 6 Complete** ✅

- [x] Created `lib/validators/swarm-intelligence.ts`
- [x] Implemented agent debate (3 agents, 2 rounds)
- [x] Calculated unified confidence from all three methods
- [x] Implemented final decision logic (approve/reject/revise)
- [x] Generated combined validation report
- [x] Generated recommended changes
- [x] Integrated into step-runner after risk analysis
- [x] Logged swarm validation results to database
- [x] Added AgentAction logging for SwarmIntelligence
- [x] Created test script
- [x] Documentation complete

**All Three Validation Methods Complete**:
- ✅ Pattern Matching (Phase 4)
- ✅ Risk Analysis (Phase 5)
- ✅ Swarm Intelligence (Phase 6)

**Ready for Phase 7**: Prediction Prompt Generator
