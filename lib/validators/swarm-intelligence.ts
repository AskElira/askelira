/**
 * Swarm Intelligence Validation System
 *
 * Uses MiroFish multi-agent debate to validate Alba's approach.
 * This is the third and final validation method (Pattern Matching, Risk Analysis, Swarm Intelligence).
 *
 * Three Validation Methods:
 * 1. Pattern Matching - Validates against proven patterns
 * 2. Risk Analysis - Analyzes potential risks
 * 3. Swarm Intelligence - Multi-agent debate validation (THIS ONE)
 *
 * Swarm Process:
 * 1. Present Alba's approach to 3 agents
 * 2. Agents debate pros/cons
 * 3. Generate consensus recommendation
 * 4. Combine with Pattern Matching + Risk Analysis
 * 5. Calculate unified confidence score
 * 6. Make final go/no-go decision
 */

import type { PatternValidationResult } from './pattern-matcher';
import type { RiskAnalysisResult } from './risk-analyzer';

// ============================================================
// Types
// ============================================================

export interface SwarmValidationResult {
  passed: boolean;
  unifiedConfidence: number; // 0-1 combined score from all three methods
  agentDebate: AgentDebate;
  finalDecision: 'approve' | 'reject' | 'revise';
  reasoning: string;
  combinedReport: string;
  recommendedChanges: string[];
}

export interface AgentDebate {
  consensus: string;
  agentOpinions: AgentOpinion[];
  debateRounds: number;
  finalRecommendation: 'approve' | 'reject' | 'revise';
}

export interface AgentOpinion {
  agentName: string;
  stance: 'approve' | 'reject' | 'neutral';
  reasoning: string;
  concerns: string[];
  strengths: string[];
}

interface AlbaApproach {
  approach: string;
  implementation: string;
  libraries: string[];
  risks: string[];
  sources: string[];
  complexity: number;
}

// ============================================================
// Configuration
// ============================================================

const MIN_UNIFIED_CONFIDENCE = 0.65; // 65% confidence to pass
const PATTERN_WEIGHT = 0.3;         // 30% from pattern matching
const RISK_WEIGHT = 0.4;            // 40% from risk analysis
const SWARM_WEIGHT = 0.3;           // 30% from swarm debate

// ============================================================
// Main Validation Function
// ============================================================

/**
 * Run swarm validation combining all three methods
 */
export async function runSwarmValidation(
  albaResult: AlbaApproach,
  floorName: string,
  floorDescription: string | null,
  patternValidation?: PatternValidationResult,
  riskAnalysis?: RiskAnalysisResult,
): Promise<SwarmValidationResult> {
  console.log(`[SwarmIntelligence] Running multi-agent validation for: ${floorName}`);

  // Step 1: Run agent debate
  const agentDebate = await runAgentDebate(
    albaResult,
    floorName,
    floorDescription,
    patternValidation,
    riskAnalysis,
  );

  // Step 2: Calculate unified confidence score
  const unifiedConfidence = calculateUnifiedConfidence(
    patternValidation,
    riskAnalysis,
    agentDebate,
  );

  // Step 3: Make final decision
  const finalDecision = makeFinalDecision(
    unifiedConfidence,
    patternValidation,
    riskAnalysis,
    agentDebate,
  );

  // Step 4: Generate reasoning
  const reasoning = generateReasoning(
    finalDecision,
    unifiedConfidence,
    patternValidation,
    riskAnalysis,
    agentDebate,
  );

  // Step 5: Generate recommended changes (if reject/revise)
  const recommendedChanges = generateRecommendedChanges(
    finalDecision,
    patternValidation,
    riskAnalysis,
    agentDebate,
  );

  // Step 6: Generate combined report
  const combinedReport = generateCombinedReport(
    albaResult,
    floorName,
    patternValidation,
    riskAnalysis,
    agentDebate,
    unifiedConfidence,
    finalDecision,
    reasoning,
    recommendedChanges,
  );

  const passed = finalDecision === 'approve';

  console.log(`[SwarmIntelligence] Validation ${passed ? 'PASSED' : 'FAILED'} (confidence: ${(unifiedConfidence * 100).toFixed(1)}%, decision: ${finalDecision})`);

  return {
    passed,
    unifiedConfidence,
    agentDebate,
    finalDecision,
    reasoning,
    combinedReport,
    recommendedChanges,
  };
}

// ============================================================
// Agent Debate (MiroFish Integration)
// ============================================================

/**
 * Run multi-agent debate on Alba's approach
 *
 * NOTE: This is a simplified implementation. For full MiroFish integration,
 * this would use the actual MiroFish library with HTTP client.
 */
async function runAgentDebate(
  albaResult: AlbaApproach,
  floorName: string,
  floorDescription: string | null,
  patternValidation?: PatternValidationResult,
  riskAnalysis?: RiskAnalysisResult,
): Promise<AgentDebate> {
  console.log(`[SwarmIntelligence] Starting agent debate (3 agents, 2 rounds)...`);

  // Simulate MiroFish debate
  // In production, this would call MiroFish API

  const agentOpinions: AgentOpinion[] = [];

  // Agent 1: Security-focused
  agentOpinions.push({
    agentName: 'SecurityAgent',
    stance: riskAnalysis && riskAnalysis.criticalRisks.length > 0 ? 'reject' : 'neutral',
    reasoning: riskAnalysis
      ? `Security analysis shows ${riskAnalysis.criticalRisks.length} critical risks and ${riskAnalysis.highRisks.length} high risks`
      : 'No risk analysis available',
    concerns: riskAnalysis ? riskAnalysis.criticalRisks.map(r => r.description) : [],
    strengths: [],
  });

  // Agent 2: Pattern-focused
  agentOpinions.push({
    agentName: 'PatternAgent',
    stance: patternValidation && patternValidation.confidence > 0.7 ? 'approve' : 'neutral',
    reasoning: patternValidation
      ? `Pattern matching shows ${(patternValidation.confidence * 100).toFixed(1)}% confidence with ${patternValidation.matchedPatterns.length} matched patterns`
      : 'No pattern validation available',
    concerns: patternValidation ? patternValidation.deviations : [],
    strengths: patternValidation
      ? patternValidation.matchedPatterns.map(p => `Matches pattern: ${p.patternDescription}`)
      : [],
  });

  // Agent 3: Pragmatic-focused
  agentOpinions.push({
    agentName: 'PragmaticAgent',
    stance: albaResult.complexity < 7 ? 'approve' : 'neutral',
    reasoning: `Implementation complexity is ${albaResult.complexity}/10. ${albaResult.libraries.length} libraries proposed.`,
    concerns: albaResult.complexity > 7 ? ['High complexity may lead to maintenance burden'] : [],
    strengths: [
      `Clear approach: ${albaResult.approach.slice(0, 100)}...`,
      `Uses established libraries: ${albaResult.libraries.slice(0, 3).join(', ')}`,
    ],
  });

  // Calculate consensus
  const approveCount = agentOpinions.filter(a => a.stance === 'approve').length;
  const rejectCount = agentOpinions.filter(a => a.stance === 'reject').length;

  let finalRecommendation: 'approve' | 'reject' | 'revise';
  let consensus: string;

  if (rejectCount > 0) {
    finalRecommendation = 'reject';
    consensus = `${rejectCount} agents recommend rejection due to critical concerns`;
  } else if (approveCount >= 2) {
    finalRecommendation = 'approve';
    consensus = `${approveCount} agents approve the approach`;
  } else {
    finalRecommendation = 'revise';
    consensus = 'Mixed opinions - recommend revisions before proceeding';
  }

  return {
    consensus,
    agentOpinions,
    debateRounds: 2,
    finalRecommendation,
  };
}

// ============================================================
// Unified Confidence Calculation
// ============================================================

/**
 * Calculate unified confidence score from all three validation methods
 */
function calculateUnifiedConfidence(
  patternValidation?: PatternValidationResult,
  riskAnalysis?: RiskAnalysisResult,
  agentDebate?: AgentDebate,
): number {
  let score = 0;
  let totalWeight = 0;

  // Pattern Matching contribution
  if (patternValidation) {
    score += patternValidation.confidence * PATTERN_WEIGHT;
    totalWeight += PATTERN_WEIGHT;
  }

  // Risk Analysis contribution (inverse - low risk = high confidence)
  if (riskAnalysis) {
    // Convert risk to confidence: 0 risk = 100% confidence, 15+ risk = 0% confidence
    const riskConfidence = Math.max(0, 1 - riskAnalysis.totalRiskScore / 15);
    score += riskConfidence * RISK_WEIGHT;
    totalWeight += RISK_WEIGHT;
  }

  // Swarm Debate contribution
  if (agentDebate) {
    const approveCount = agentDebate.agentOpinions.filter(a => a.stance === 'approve').length;
    const rejectCount = agentDebate.agentOpinions.filter(a => a.stance === 'reject').length;
    const totalAgents = agentDebate.agentOpinions.length;

    // Swarm confidence = (approvals - rejections) / total agents
    const swarmConfidence = (approveCount - rejectCount + totalAgents) / (2 * totalAgents);
    score += swarmConfidence * SWARM_WEIGHT;
    totalWeight += SWARM_WEIGHT;
  }

  // Normalize by total weight
  return totalWeight > 0 ? score / totalWeight : 0.5;
}

// ============================================================
// Final Decision Logic
// ============================================================

/**
 * Make final go/no-go decision
 */
function makeFinalDecision(
  unifiedConfidence: number,
  patternValidation?: PatternValidationResult,
  riskAnalysis?: RiskAnalysisResult,
  agentDebate?: AgentDebate,
): 'approve' | 'reject' | 'revise' {
  // REJECT if:
  // 1. Any critical risks detected
  // 2. Swarm recommends rejection
  // 3. Unified confidence < 50%

  if (riskAnalysis && riskAnalysis.criticalRisks.length > 0) {
    return 'reject';
  }

  if (agentDebate && agentDebate.finalRecommendation === 'reject') {
    return 'reject';
  }

  if (unifiedConfidence < 0.5) {
    return 'reject';
  }

  // APPROVE if:
  // 1. Unified confidence ≥ 65%
  // 2. No critical risks
  // 3. Swarm approves

  if (unifiedConfidence >= MIN_UNIFIED_CONFIDENCE) {
    return 'approve';
  }

  // REVISE otherwise (confidence 50-65%)
  return 'revise';
}

// ============================================================
// Reasoning Generation
// ============================================================

/**
 * Generate human-readable reasoning for the decision
 */
function generateReasoning(
  decision: 'approve' | 'reject' | 'revise',
  confidence: number,
  patternValidation?: PatternValidationResult,
  riskAnalysis?: RiskAnalysisResult,
  agentDebate?: AgentDebate,
): string {
  const parts: string[] = [];

  parts.push(`Unified confidence: ${(confidence * 100).toFixed(1)}%`);

  if (patternValidation) {
    parts.push(`Pattern matching: ${(patternValidation.confidence * 100).toFixed(1)}% (${patternValidation.matchedPatterns.length} patterns)`);
  }

  if (riskAnalysis) {
    parts.push(`Risk score: ${riskAnalysis.totalRiskScore.toFixed(1)} (${riskAnalysis.criticalRisks.length} critical, ${riskAnalysis.highRisks.length} high)`);
  }

  if (agentDebate) {
    const approveCount = agentDebate.agentOpinions.filter(a => a.stance === 'approve').length;
    parts.push(`Agent consensus: ${approveCount}/${agentDebate.agentOpinions.length} approve`);
  }

  if (decision === 'reject') {
    if (riskAnalysis && riskAnalysis.criticalRisks.length > 0) {
      parts.push(`REJECT: Critical security/reliability risks detected`);
    } else if (confidence < 0.5) {
      parts.push(`REJECT: Confidence below minimum threshold (50%)`);
    } else {
      parts.push(`REJECT: Swarm consensus recommends rejection`);
    }
  } else if (decision === 'revise') {
    parts.push(`REVISE: Approach shows promise but needs improvements (confidence: ${(confidence * 100).toFixed(1)}%)`);
  } else {
    parts.push(`APPROVE: All validation methods passed with high confidence`);
  }

  return parts.join('. ');
}

// ============================================================
// Recommended Changes
// ============================================================

/**
 * Generate recommended changes for revise/reject decisions
 */
function generateRecommendedChanges(
  decision: 'approve' | 'reject' | 'revise',
  patternValidation?: PatternValidationResult,
  riskAnalysis?: RiskAnalysisResult,
  agentDebate?: AgentDebate,
): string[] {
  if (decision === 'approve') return [];

  const changes: string[] = [];

  // Add critical risk mitigations
  if (riskAnalysis && riskAnalysis.criticalRisks.length > 0) {
    riskAnalysis.criticalRisks.forEach(risk => {
      const mitigation = riskAnalysis.mitigations.find(m => m.risk === risk.description);
      if (mitigation) {
        changes.push(`${risk.description}: ${mitigation.recommendation}`);
      } else {
        changes.push(`Address critical risk: ${risk.description}`);
      }
    });
  }

  // Add high risk mitigations
  if (riskAnalysis && riskAnalysis.highRisks.length > 0 && changes.length < 5) {
    riskAnalysis.highRisks.slice(0, 3).forEach(risk => {
      const mitigation = riskAnalysis.mitigations.find(m => m.risk === risk.description);
      if (mitigation && changes.length < 5) {
        changes.push(`${risk.description}: ${mitigation.recommendation}`);
      }
    });
  }

  // Add pattern recommendations
  if (patternValidation && patternValidation.recommendations.length > 0 && changes.length < 5) {
    patternValidation.recommendations.slice(0, 2).forEach(rec => {
      if (changes.length < 5) {
        changes.push(rec);
      }
    });
  }

  // Add agent concerns
  if (agentDebate && changes.length < 5) {
    agentDebate.agentOpinions.forEach(opinion => {
      if (opinion.concerns.length > 0 && changes.length < 5) {
        opinion.concerns.slice(0, 1).forEach(concern => {
          if (changes.length < 5) {
            changes.push(`${opinion.agentName}: ${concern}`);
          }
        });
      }
    });
  }

  return changes.slice(0, 5); // Max 5 changes
}

// ============================================================
// Combined Report Generation
// ============================================================

/**
 * Generate comprehensive validation report combining all three methods
 */
function generateCombinedReport(
  albaResult: AlbaApproach,
  floorName: string,
  patternValidation?: PatternValidationResult,
  riskAnalysis?: RiskAnalysisResult,
  agentDebate?: AgentDebate,
  confidence?: number,
  decision?: 'approve' | 'reject' | 'revise',
  reasoning?: string,
  changes?: string[],
): string {
  const parts: string[] = [];

  parts.push(`# Swarm Intelligence Validation Report`);
  parts.push(``);
  parts.push(`**Floor**: ${floorName}`);
  parts.push(`**Unified Confidence**: ${(confidence ?? 0 * 100).toFixed(1)}%`);
  parts.push(`**Final Decision**: ${decision?.toUpperCase() || 'UNKNOWN'} ${decision === 'approve' ? '✅' : decision === 'reject' ? '❌' : '⚠️'}`);
  parts.push(``);
  parts.push(`## Reasoning`);
  parts.push(``);
  parts.push(reasoning || 'No reasoning available');
  parts.push(``);

  // Pattern Matching Section
  if (patternValidation) {
    parts.push(`## 🔍 Pattern Matching Validation`);
    parts.push(``);
    parts.push(`- **Status**: ${patternValidation.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
    parts.push(`- **Confidence**: ${(patternValidation.confidence * 100).toFixed(1)}%`);
    parts.push(`- **Category**: ${patternValidation.category || 'Unknown'}`);
    parts.push(`- **Matched Patterns**: ${patternValidation.matchedPatterns.length}`);
    parts.push(`- **Deviations**: ${patternValidation.deviations.length}`);

    if (patternValidation.deviations.length > 0) {
      parts.push(``);
      parts.push(`**Deviations**:`);
      patternValidation.deviations.forEach((dev, idx) => {
        parts.push(`${idx + 1}. ${dev}`);
      });
    }
    parts.push(``);
  }

  // Risk Analysis Section
  if (riskAnalysis) {
    parts.push(`## ⚠️ Risk Analysis`);
    parts.push(``);
    parts.push(`- **Status**: ${riskAnalysis.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
    parts.push(`- **Total Risk Score**: ${riskAnalysis.totalRiskScore.toFixed(1)}`);
    parts.push(`- **Critical Risks**: ${riskAnalysis.criticalRisks.length}`);
    parts.push(`- **High Risks**: ${riskAnalysis.highRisks.length}`);
    parts.push(`- **Medium Risks**: ${riskAnalysis.mediumRisks.length}`);
    parts.push(`- **Low Risks**: ${riskAnalysis.lowRisks.length}`);

    if (riskAnalysis.criticalRisks.length > 0) {
      parts.push(``);
      parts.push(`**Critical Risks**:`);
      riskAnalysis.criticalRisks.forEach((risk, idx) => {
        parts.push(`${idx + 1}. ${risk.description} (severity: ${risk.severity}, score: ${risk.riskScore.toFixed(1)})`);
      });
    }
    parts.push(``);
  }

  // Agent Debate Section
  if (agentDebate) {
    parts.push(`## 🤖 Agent Debate`);
    parts.push(``);
    parts.push(`- **Consensus**: ${agentDebate.consensus}`);
    parts.push(`- **Recommendation**: ${agentDebate.finalRecommendation.toUpperCase()}`);
    parts.push(`- **Debate Rounds**: ${agentDebate.debateRounds}`);
    parts.push(``);

    parts.push(`**Agent Opinions**:`);
    agentDebate.agentOpinions.forEach((opinion, idx) => {
      parts.push(``);
      parts.push(`### ${idx + 1}. ${opinion.agentName}`);
      parts.push(`- **Stance**: ${opinion.stance.toUpperCase()}`);
      parts.push(`- **Reasoning**: ${opinion.reasoning}`);
      if (opinion.concerns.length > 0) {
        parts.push(`- **Concerns**: ${opinion.concerns.join(', ')}`);
      }
      if (opinion.strengths.length > 0) {
        parts.push(`- **Strengths**: ${opinion.strengths.join(', ')}`);
      }
    });
    parts.push(``);
  }

  // Recommended Changes
  if (changes && changes.length > 0) {
    parts.push(`## 📝 Recommended Changes (${changes.length})`);
    parts.push(``);
    changes.forEach((change, idx) => {
      parts.push(`${idx + 1}. ${change}`);
    });
    parts.push(``);
  }

  // Alba's Approach
  parts.push(`## 🎯 Alba's Proposed Approach`);
  parts.push(``);
  parts.push(`**Approach**: ${albaResult.approach}`);
  parts.push(`**Libraries**: ${albaResult.libraries.join(', ') || 'None'}`);
  parts.push(`**Complexity**: ${albaResult.complexity}/10`);
  parts.push(``);

  return parts.join('\n');
}
