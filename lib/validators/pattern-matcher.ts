/**
 * Pattern Matching Validation System
 *
 * Validates Alba's research against proven automation patterns from the intelligence database.
 * This is the first of three validation methods (Pattern Matching, Risk Analysis, Swarm Intelligence).
 *
 * Validation Flow:
 * 1. Detect automation category (email, scraping, API, etc.)
 * 2. Load proven patterns for that category
 * 3. Compare Alba's approach against proven patterns
 * 4. Score confidence based on pattern match quality
 * 5. Detect deviations from proven approaches
 * 6. Recommend proven patterns if confidence is low
 */

import {
  detectCategory,
  getTopPatterns,
  type AutomationPattern,
} from '../pattern-manager';

// ============================================================
// Types
// ============================================================

export interface PatternValidationResult {
  passed: boolean;
  confidence: number; // 0-1 score
  matchedPatterns: AutomationPattern[];
  deviations: string[];
  recommendations: string[];
  category: string | null;
  validationReport: string;
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

const MIN_CONFIDENCE_THRESHOLD = 0.6; // 60% confidence to pass
const PATTERN_MATCH_WEIGHT = 0.4;     // 40% of score from pattern match
const LIBRARY_MATCH_WEIGHT = 0.3;     // 30% of score from library match
const COMPLEXITY_MATCH_WEIGHT = 0.3;  // 30% of score from complexity similarity

// ============================================================
// Main Validation Function
// ============================================================

/**
 * Validate Alba's research output against proven automation patterns
 */
export async function validateAgainstPatterns(
  albaResult: AlbaApproach,
  floorName: string,
  floorDescription: string | null,
  successCondition: string,
): Promise<PatternValidationResult> {
  console.log(`[PatternMatcher] Validating Alba's approach for: ${floorName}`);

  // Step 1: Detect automation category
  const category = detectCategory(floorName, floorDescription ?? '', successCondition);

  if (!category) {
    console.warn(`[PatternMatcher] Could not detect category - skipping pattern validation`);
    return {
      passed: true, // Pass by default if no category detected
      confidence: 0.5,
      matchedPatterns: [],
      deviations: [],
      recommendations: ['No category detected - manual review recommended'],
      category: null,
      validationReport: 'Pattern validation skipped: category not detected',
    };
  }

  console.log(`[PatternMatcher] Detected category: ${category}`);

  // Step 2: Load proven patterns for this category
  const patterns = await getTopPatterns(category, 5, MIN_CONFIDENCE_THRESHOLD);

  if (patterns.length === 0) {
    console.log(`[PatternMatcher] No proven patterns found for category: ${category}`);
    return {
      passed: true, // Pass by default if no patterns available
      confidence: 0.5,
      matchedPatterns: [],
      deviations: [],
      recommendations: ['No proven patterns available for this category - proceed with caution'],
      category,
      validationReport: `Pattern validation skipped: no patterns available for ${category}`,
    };
  }

  console.log(`[PatternMatcher] Loaded ${patterns.length} proven patterns`);

  // Step 3: Compare Alba's approach against proven patterns
  const matchScores = patterns.map(pattern => scorePatternMatch(albaResult, pattern));

  // Step 4: Calculate overall confidence
  const confidence = calculateConfidence(matchScores, patterns);

  // Step 5: Detect deviations
  const deviations = detectDeviations(albaResult, patterns, matchScores);

  // Step 6: Generate recommendations
  const recommendations = generateRecommendations(albaResult, patterns, matchScores, confidence);

  // Step 7: Determine pass/fail
  const passed = confidence >= MIN_CONFIDENCE_THRESHOLD;

  // Step 8: Generate validation report
  const validationReport = generateValidationReport(
    albaResult,
    patterns,
    matchScores,
    confidence,
    deviations,
    recommendations,
    category,
  );

  console.log(`[PatternMatcher] Validation ${passed ? 'PASSED' : 'FAILED'} (confidence: ${(confidence * 100).toFixed(1)}%)`);

  return {
    passed,
    confidence,
    matchedPatterns: patterns,
    deviations,
    recommendations,
    category,
    validationReport,
  };
}

// ============================================================
// Scoring Functions
// ============================================================

/**
 * Score how well Alba's approach matches a proven pattern
 */
function scorePatternMatch(albaResult: AlbaApproach, pattern: AutomationPattern): number {
  let score = 0;

  // Check approach similarity
  const approachSimilarity = calculateTextSimilarity(
    albaResult.approach + ' ' + albaResult.implementation,
    pattern.patternDescription + ' ' + (pattern.implementationNotes ?? ''),
  );
  score += approachSimilarity * PATTERN_MATCH_WEIGHT;

  // Check library overlap
  const librarySimilarity = calculateLibrarySimilarity(
    albaResult.libraries,
    pattern.implementationNotes ?? '',
  );
  score += librarySimilarity * LIBRARY_MATCH_WEIGHT;

  // Check complexity similarity (prefer patterns with similar complexity)
  const complexitySimilarity = 1 - Math.abs(albaResult.complexity - (pattern.complexity ?? 5)) / 10;
  score += complexitySimilarity * COMPLEXITY_MATCH_WEIGHT;

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate text similarity using keyword overlap
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);

  if (keywords1.length === 0 || keywords2.length === 0) return 0;

  const overlap = keywords1.filter(k => keywords2.includes(k)).length;
  return overlap / Math.max(keywords1.length, keywords2.length);
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !STOP_WORDS.includes(word));
}

const STOP_WORDS = [
  'this', 'that', 'with', 'from', 'have', 'will', 'would', 'could', 'should',
  'using', 'used', 'uses', 'make', 'makes', 'made', 'each', 'then', 'than',
];

/**
 * Calculate library similarity
 */
function calculateLibrarySimilarity(libraries: string[], implementationNotes: string): number {
  if (libraries.length === 0) return 0.5; // Neutral if no libraries specified

  const notesLower = implementationNotes.toLowerCase();
  const matches = libraries.filter(lib => notesLower.includes(lib.toLowerCase()));

  return matches.length / libraries.length;
}

/**
 * Calculate overall confidence from pattern match scores
 */
function calculateConfidence(matchScores: number[], patterns: AutomationPattern[]): number {
  if (matchScores.length === 0) return 0.5;

  // Weight by pattern confidence
  let weightedSum = 0;
  let weightTotal = 0;

  for (let i = 0; i < matchScores.length; i++) {
    const weight = patterns[i].confidence;
    weightedSum += matchScores[i] * weight;
    weightTotal += weight;
  }

  return weightTotal > 0 ? weightedSum / weightTotal : 0.5;
}

// ============================================================
// Deviation Detection
// ============================================================

/**
 * Detect deviations from proven patterns
 */
function detectDeviations(
  albaResult: AlbaApproach,
  patterns: AutomationPattern[],
  matchScores: number[],
): string[] {
  const deviations: string[] = [];

  // Find best matching pattern
  const bestMatchIndex = matchScores.indexOf(Math.max(...matchScores));
  const bestPattern = patterns[bestMatchIndex];
  const bestScore = matchScores[bestMatchIndex];

  if (bestScore < 0.4) {
    deviations.push(`Low pattern match (${(bestScore * 100).toFixed(1)}%) - approach differs significantly from proven patterns`);
  }

  // Check if Alba suggests different libraries than proven patterns
  const commonLibraries = extractCommonLibraries(patterns);
  const albaLibraries = albaResult.libraries.map(l => l.toLowerCase());
  const missingCommon = commonLibraries.filter(lib => !albaLibraries.some(al => al.includes(lib)));

  if (missingCommon.length > 0 && commonLibraries.length > 0) {
    deviations.push(`Missing common libraries: ${missingCommon.join(', ')} (used in ${Math.round(missingCommon.length / commonLibraries.length * 100)}% of proven patterns)`);
  }

  // Check if complexity is significantly higher than proven patterns
  const avgComplexity = patterns.reduce((sum, p) => sum + (p.complexity ?? 5), 0) / patterns.length;
  if (albaResult.complexity > avgComplexity + 2) {
    deviations.push(`Higher complexity (${albaResult.complexity}) than proven patterns (avg: ${avgComplexity.toFixed(1)}) - may be over-engineering`);
  }

  return deviations;
}

/**
 * Extract common libraries from patterns
 */
function extractCommonLibraries(patterns: AutomationPattern[]): string[] {
  const libraryCounts = new Map<string, number>();

  patterns.forEach(pattern => {
    const notes = pattern.implementationNotes?.toLowerCase() ?? '';
    const libs = notes.match(/\b[a-z0-9-]+\b/g) ?? [];

    libs.forEach(lib => {
      if (lib.length > 3) {
        libraryCounts.set(lib, (libraryCounts.get(lib) ?? 0) + 1);
      }
    });
  });

  // Return libraries mentioned in >50% of patterns
  const threshold = patterns.length / 2;
  return Array.from(libraryCounts.entries())
    .filter(([_, count]) => count >= threshold)
    .map(([lib]) => lib);
}

// ============================================================
// Recommendation Generation
// ============================================================

/**
 * Generate recommendations based on pattern analysis
 */
function generateRecommendations(
  albaResult: AlbaApproach,
  patterns: AutomationPattern[],
  matchScores: number[],
  confidence: number,
): string[] {
  const recommendations: string[] = [];

  if (confidence < MIN_CONFIDENCE_THRESHOLD) {
    recommendations.push(`Consider reviewing proven patterns for this category before proceeding`);

    // Suggest best matching pattern
    const bestMatchIndex = matchScores.indexOf(Math.max(...matchScores));
    const bestPattern = patterns[bestMatchIndex];

    if (bestPattern.sourceUrl) {
      recommendations.push(`Reference: ${bestPattern.patternDescription} (${bestPattern.sourceUrl})`);
    } else {
      recommendations.push(`Reference: ${bestPattern.patternDescription}`);
    }

    if (bestPattern.implementationNotes) {
      recommendations.push(`Proven approach: ${bestPattern.implementationNotes}`);
    }
  }

  // Recommend common libraries if missing
  const commonLibraries = extractCommonLibraries(patterns);
  const albaLibraries = albaResult.libraries.map(l => l.toLowerCase());
  const missingCommon = commonLibraries.filter(lib => !albaLibraries.some(al => al.includes(lib)));

  if (missingCommon.length > 0) {
    recommendations.push(`Consider using proven libraries: ${missingCommon.join(', ')}`);
  }

  return recommendations;
}

// ============================================================
// Report Generation
// ============================================================

/**
 * Generate detailed validation report
 */
function generateValidationReport(
  albaResult: AlbaApproach,
  patterns: AutomationPattern[],
  matchScores: number[],
  confidence: number,
  deviations: string[],
  recommendations: string[],
  category: string,
): string {
  const parts: string[] = [];

  parts.push(`# Pattern Matching Validation Report`);
  parts.push(``);
  parts.push(`**Category**: ${category}`);
  parts.push(`**Confidence**: ${(confidence * 100).toFixed(1)}%`);
  parts.push(`**Status**: ${confidence >= MIN_CONFIDENCE_THRESHOLD ? 'PASSED ✅' : 'FAILED ❌'}`);
  parts.push(``);

  // Matched patterns
  parts.push(`## Matched Patterns (${patterns.length})`);
  patterns.forEach((pattern, idx) => {
    parts.push(``);
    parts.push(`### Pattern ${idx + 1}: ${pattern.patternDescription}`);
    parts.push(`- Match Score: ${(matchScores[idx] * 100).toFixed(1)}%`);
    parts.push(`- Pattern Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
    if (pattern.sourceUrl) {
      parts.push(`- Source: ${pattern.sourceUrl}`);
    }
    if (pattern.implementationNotes) {
      parts.push(`- Implementation: ${pattern.implementationNotes}`);
    }
  });
  parts.push(``);

  // Deviations
  if (deviations.length > 0) {
    parts.push(`## Deviations (${deviations.length})`);
    deviations.forEach((dev, idx) => {
      parts.push(`${idx + 1}. ${dev}`);
    });
    parts.push(``);
  }

  // Recommendations
  if (recommendations.length > 0) {
    parts.push(`## Recommendations (${recommendations.length})`);
    recommendations.forEach((rec, idx) => {
      parts.push(`${idx + 1}. ${rec}`);
    });
    parts.push(``);
  }

  // Alba's approach summary
  parts.push(`## Alba's Proposed Approach`);
  parts.push(``);
  parts.push(`**Approach**: ${albaResult.approach.slice(0, 200)}...`);
  parts.push(`**Libraries**: ${albaResult.libraries.join(', ') || 'None specified'}`);
  parts.push(`**Complexity**: ${albaResult.complexity}/10`);
  parts.push(``);

  return parts.join('\n');
}
