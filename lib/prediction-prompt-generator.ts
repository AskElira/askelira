/**
 * Prediction Prompt Generator
 *
 * Generates the structured prompt that guides David's building based on:
 * - Alba's validated research
 * - Pattern matching results
 * - Risk analysis results
 * - Swarm intelligence decision
 * - Personal context (user preferences)
 *
 * This prompt is the bridge between research/validation and building.
 */

import type { PatternValidationResult } from './validators/pattern-matcher';
import type { RiskAnalysisResult } from './validators/risk-analyzer';
import type { SwarmValidationResult } from './validators/swarm-intelligence';
import type { PersonalContext } from './personal-context';
import type { OpenResearchResult } from './autoresearch';
import type { SearchResult } from './web-search';

// ============================================================
// Types
// ============================================================

export interface PredictionPromptInput {
  // Floor info
  floorName: string;
  floorDescription: string | null;
  floorNumber: number;
  successCondition: string;

  // Alba research
  albaApproach: string;
  albaImplementation: string;
  albaLibraries: string[];
  albaRisks: string[];
  albaSources: string[];
  albaComplexity: number;

  // Research sources
  openResearch?: OpenResearchResult;
  braveSearch?: SearchResult[];
  personalContext?: PersonalContext;

  // Validation results
  patternValidation?: PatternValidationResult;
  riskAnalysis?: RiskAnalysisResult;
  swarmValidation?: SwarmValidationResult;

  // Goal context
  goalText: string;
  buildingContext: string;
}

export interface PredictionPrompt {
  systemPrompt: string;
  userPrompt: string;
  constraints: string[];
  qualityGates: string[];
  metadata: {
    unifiedConfidence: number;
    finalDecision: 'approve' | 'reject' | 'revise';
    validationsPassed: {
      pattern: boolean;
      risk: boolean;
      swarm: boolean;
    };
  };
}

// ============================================================
// Main Generator Function
// ============================================================

/**
 * Generate prediction prompt for David's building
 */
export function generatePredictionPrompt(input: PredictionPromptInput): PredictionPrompt {
  console.log(`[PredictionPrompt] Generating prompt for floor: ${input.floorName}`);

  const systemPrompt = generateSystemPrompt(input);
  const userPrompt = generateUserPrompt(input);
  const constraints = generateConstraints(input);
  const qualityGates = generateQualityGates(input);

  const metadata = {
    unifiedConfidence: input.swarmValidation?.unifiedConfidence ?? 0.5,
    finalDecision: input.swarmValidation?.finalDecision ?? 'approve',
    validationsPassed: {
      pattern: input.patternValidation?.passed ?? true,
      risk: input.riskAnalysis?.passed ?? true,
      swarm: input.swarmValidation?.passed ?? true,
    },
  };

  console.log(`[PredictionPrompt] Generated prompt (confidence: ${(metadata.unifiedConfidence * 100).toFixed(1)}%)`);

  return {
    systemPrompt,
    userPrompt,
    constraints,
    qualityGates,
    metadata,
  };
}

// ============================================================
// System Prompt Generation
// ============================================================

function generateSystemPrompt(input: PredictionPromptInput): string {
  const parts: string[] = [];

  parts.push(`You are David, the elite code builder for AskElira automation platform.`);
  parts.push(``);
  parts.push(`Your mission: Build production-ready automation code based on validated research.`);
  parts.push(``);

  // Add validation context
  if (input.swarmValidation) {
    parts.push(`## Validation Status`);
    parts.push(``);
    parts.push(`This approach has been validated by three independent methods:`);
    parts.push(`- **Pattern Matching**: ${input.patternValidation?.passed ? 'PASSED ✅' : 'FAILED ❌'} (confidence: ${((input.patternValidation?.confidence ?? 0) * 100).toFixed(1)}%)`);
    parts.push(`- **Risk Analysis**: ${input.riskAnalysis?.passed ? 'PASSED ✅' : 'FAILED ❌'} (risk score: ${input.riskAnalysis?.totalRiskScore.toFixed(1) ?? 'N/A'})`);
    parts.push(`- **Swarm Intelligence**: ${input.swarmValidation.passed ? 'PASSED ✅' : 'FAILED ❌'} (unified confidence: ${(input.swarmValidation.unifiedConfidence * 100).toFixed(1)}%)`);
    parts.push(``);
    parts.push(`**Final Decision**: ${input.swarmValidation.finalDecision.toUpperCase()}`);
    parts.push(``);
  }

  // Add user preferences
  if (input.personalContext) {
    parts.push(`## User Preferences`);
    parts.push(``);
    parts.push(`- **Language**: ${input.personalContext.preferences.language}`);
    parts.push(`- **Timezone**: ${input.personalContext.preferences.timezone}`);
    parts.push(`- **Email Provider**: ${input.personalContext.preferences.emailProvider}`);

    if (input.personalContext.history.commonPatterns.length > 0) {
      parts.push(`- **Past Success Patterns**: ${input.personalContext.history.commonPatterns.join(', ')}`);
    }
    parts.push(``);
  }

  // Add critical constraints from risk analysis
  if (input.riskAnalysis && input.riskAnalysis.criticalRisks.length > 0) {
    parts.push(`## ⚠️ CRITICAL REQUIREMENTS (from risk analysis)`);
    parts.push(``);
    input.riskAnalysis.criticalRisks.forEach((risk, idx) => {
      parts.push(`${idx + 1}. **${risk.description}** (severity: ${risk.severity}/10)`);
      const mitigation = input.riskAnalysis?.mitigations.find(m => m.risk === risk.description);
      if (mitigation) {
        parts.push(`   → MUST: ${mitigation.recommendation}`);
        parts.push(`   → Implementation: ${mitigation.implementation}`);
      }
      parts.push(``);
    });
  }

  // Add recommended changes from swarm
  if (input.swarmValidation && input.swarmValidation.recommendedChanges.length > 0) {
    parts.push(`## 📝 Recommended Improvements (from swarm validation)`);
    parts.push(``);
    input.swarmValidation.recommendedChanges.forEach((change, idx) => {
      parts.push(`${idx + 1}. ${change}`);
    });
    parts.push(``);
  }

  // Add pattern-based guidance
  if (input.patternValidation && input.patternValidation.matchedPatterns.length > 0) {
    parts.push(`## 🔍 Proven Patterns (${input.patternValidation.matchedPatterns.length} matched)`);
    parts.push(``);
    input.patternValidation.matchedPatterns.slice(0, 3).forEach((pattern, idx) => {
      parts.push(`${idx + 1}. **${pattern.patternDescription}** (${(pattern.confidence * 100).toFixed(1)}% confidence)`);
      if (pattern.implementationNotes) {
        parts.push(`   Implementation: ${pattern.implementationNotes}`);
      }
      if (pattern.sourceUrl) {
        parts.push(`   Reference: ${pattern.sourceUrl}`);
      }
      parts.push(``);
    });
  }

  return parts.join('\n');
}

// ============================================================
// User Prompt Generation
// ============================================================

function generateUserPrompt(input: PredictionPromptInput): string {
  const parts: string[] = [];

  parts.push(`# Build Request`);
  parts.push(``);
  parts.push(`**Floor ${input.floorNumber}**: ${input.floorName}`);
  parts.push(`**Description**: ${input.floorDescription ?? 'No description'}`);
  parts.push(`**Success Condition**: ${input.successCondition}`);
  parts.push(``);
  parts.push(`**Overall Goal**: ${input.goalText}`);
  parts.push(``);

  // Building context
  if (input.buildingContext) {
    parts.push(`## Context from Prior Floors`);
    parts.push(``);
    parts.push(input.buildingContext);
    parts.push(``);
  }

  // Alba's validated approach
  parts.push(`## Validated Approach (from Alba Research)`);
  parts.push(``);
  parts.push(`**Approach**: ${input.albaApproach}`);
  parts.push(``);
  parts.push(`**Implementation Details**: ${input.albaImplementation}`);
  parts.push(``);

  // Libraries
  if (input.albaLibraries.length > 0) {
    parts.push(`**Required Libraries**:`);
    input.albaLibraries.forEach(lib => {
      parts.push(`- ${lib}`);
    });
    parts.push(``);
  }

  // Known risks
  if (input.albaRisks.length > 0) {
    parts.push(`**Known Risks to Address**:`);
    input.albaRisks.forEach(risk => {
      parts.push(`- ${risk}`);
    });
    parts.push(``);
  }

  // Research sources
  if (input.albaSources.length > 0) {
    parts.push(`**Research Sources**:`);
    input.albaSources.slice(0, 5).forEach(source => {
      parts.push(`- ${source}`);
    });
    parts.push(``);
  }

  // Complexity indicator
  parts.push(`**Complexity**: ${input.albaComplexity}/10`);
  parts.push(``);

  // Deep research insights (if available)
  if (input.openResearch && input.openResearch.success) {
    parts.push(`## Deep Research Insights (from OpenResearch)`);
    parts.push(``);
    parts.push(input.openResearch.finalReport.slice(0, 1000));
    if (input.openResearch.finalReport.length > 1000) {
      parts.push(`... (truncated)`);
    }
    parts.push(``);
  }

  // Web search insights (if available)
  if (input.braveSearch && input.braveSearch.length > 0) {
    parts.push(`## Recent Web Findings (from Brave Search)`);
    parts.push(``);
    input.braveSearch.slice(0, 3).forEach((result, idx) => {
      parts.push(`${idx + 1}. **${result.title}**`);
      parts.push(`   ${result.snippet}`);
      parts.push(`   Source: ${result.url}`);
      parts.push(``);
    });
  }

  return parts.join('\n');
}

// ============================================================
// Constraints Generation
// ============================================================

function generateConstraints(input: PredictionPromptInput): string[] {
  const constraints: string[] = [];

  // User preference constraints
  if (input.personalContext) {
    constraints.push(`Use ${input.personalContext.preferences.language} as primary language`);

    if (input.personalContext.preferences.emailProvider !== 'none') {
      constraints.push(`Use ${input.personalContext.preferences.emailProvider} for email functionality`);
    }
  }

  // Risk-based constraints (from critical risks)
  if (input.riskAnalysis) {
    input.riskAnalysis.criticalRisks.forEach(risk => {
      const mitigation = input.riskAnalysis?.mitigations.find(m => m.risk === risk.description);
      if (mitigation) {
        constraints.push(`CRITICAL: ${mitigation.recommendation}`);
      }
    });

    // High-priority mitigations
    input.riskAnalysis.highRisks.slice(0, 2).forEach(risk => {
      const mitigation = input.riskAnalysis?.mitigations.find(m => m.risk === risk.description);
      if (mitigation) {
        constraints.push(`HIGH PRIORITY: ${mitigation.recommendation}`);
      }
    });
  }

  // Pattern-based constraints
  if (input.patternValidation && input.patternValidation.matchedPatterns.length > 0) {
    const topPattern = input.patternValidation.matchedPatterns[0];
    if (topPattern.implementationNotes) {
      constraints.push(`Follow proven pattern: ${topPattern.implementationNotes.slice(0, 100)}`);
    }
  }

  // Complexity constraint
  if (input.albaComplexity > 7) {
    constraints.push(`Keep implementation as simple as possible (current complexity: ${input.albaComplexity}/10)`);
  }

  return constraints;
}

// ============================================================
// Quality Gates Generation
// ============================================================

function generateQualityGates(input: PredictionPromptInput): string[] {
  const gates: string[] = [];

  // Always include basic gates
  gates.push(`Code must be production-ready with proper error handling`);
  gates.push(`All external dependencies must be properly installed`);
  gates.push(`Code must meet the success condition: ${input.successCondition}`);

  // Security gates (from risk analysis)
  if (input.riskAnalysis) {
    const securityRisks = [
      ...input.riskAnalysis.criticalRisks,
      ...input.riskAnalysis.highRisks,
    ].filter(r => r.category === 'security');

    if (securityRisks.length > 0) {
      gates.push(`SECURITY: All security risks must be mitigated (${securityRisks.length} identified)`);
    }
  }

  // Reliability gates
  if (input.riskAnalysis) {
    const reliabilityRisks = [
      ...input.riskAnalysis.criticalRisks,
      ...input.riskAnalysis.highRisks,
    ].filter(r => r.category === 'reliability');

    if (reliabilityRisks.length > 0) {
      gates.push(`RELIABILITY: Implement retry logic and error handling (${reliabilityRisks.length} risks identified)`);
    }
  }

  // Pattern matching gates
  if (input.patternValidation && input.patternValidation.confidence > 0.7) {
    gates.push(`Follow proven patterns where applicable (${input.patternValidation.matchedPatterns.length} patterns matched)`);
  }

  // Swarm validation gates
  if (input.swarmValidation && input.swarmValidation.recommendedChanges.length > 0) {
    gates.push(`Address all recommended changes from validation (${input.swarmValidation.recommendedChanges.length} changes)`);
  }

  return gates;
}

// ============================================================
// Helper: Format Prompt for David
// ============================================================

/**
 * Format the prediction prompt into David's expected format
 */
export function formatForDavid(prompt: PredictionPrompt): string {
  const parts: string[] = [];

  parts.push(prompt.systemPrompt);
  parts.push(``);
  parts.push(`---`);
  parts.push(``);
  parts.push(prompt.userPrompt);
  parts.push(``);

  if (prompt.constraints.length > 0) {
    parts.push(`## Build Constraints`);
    parts.push(``);
    prompt.constraints.forEach((constraint, idx) => {
      parts.push(`${idx + 1}. ${constraint}`);
    });
    parts.push(``);
  }

  if (prompt.qualityGates.length > 0) {
    parts.push(`## Quality Gates`);
    parts.push(``);
    prompt.qualityGates.forEach((gate, idx) => {
      parts.push(`${idx + 1}. ${gate}`);
    });
    parts.push(``);
  }

  return parts.join('\n');
}
