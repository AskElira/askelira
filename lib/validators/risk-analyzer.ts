/**
 * Risk Analysis Validation System
 *
 * Analyzes potential risks in Alba's proposed automation approach.
 * This is the second of three validation methods (Pattern Matching, Risk Analysis, Swarm Intelligence).
 *
 * Risk Categories:
 * 1. Security - API keys, injection vulnerabilities, XSS, data exposure
 * 2. Reliability - Rate limiting, timeouts, errors, downtime
 * 3. Cost - API pricing, compute costs, unexpected charges
 * 4. Maintenance - Deprecated APIs, library updates, breaking changes
 *
 * Risk Scoring:
 * Risk Score = Severity (1-10) × Likelihood (0-1)
 * Total Risk = Sum of all risk scores
 *
 * Pass Threshold:
 * - Critical risks (score ≥ 7): Block
 * - High risks (score 5-7): Warn
 * - Medium risks (score 3-5): Caution
 * - Low risks (score < 3): Note
 */

// ============================================================
// Types
// ============================================================

export interface RiskAnalysisResult {
  passed: boolean;
  totalRiskScore: number; // Sum of all risk scores
  criticalRisks: Risk[];  // Severity ≥ 7
  highRisks: Risk[];      // Severity 5-7
  mediumRisks: Risk[];    // Severity 3-5
  lowRisks: Risk[];       // Severity < 3
  mitigations: Mitigation[];
  riskReport: string;
}

export interface Risk {
  category: 'security' | 'reliability' | 'cost' | 'maintenance';
  description: string;
  severity: number;    // 1-10
  likelihood: number;  // 0-1
  riskScore: number;   // severity × likelihood
  evidence: string[];  // Evidence from Alba's approach
}

export interface Mitigation {
  risk: string;        // Risk description
  recommendation: string;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
}

interface AlbaApproach {
  approach: string;
  implementation: string;
  libraries: string[];
  risks: string[];     // Alba's identified risks
  sources: string[];
  complexity: number;
}

// ============================================================
// Configuration
// ============================================================

const CRITICAL_RISK_THRESHOLD = 7;   // Block if any risk ≥ 7
const MAX_TOTAL_RISK_SCORE = 15;    // Block if total risk > 15

// ============================================================
// Main Analysis Function
// ============================================================

/**
 * Analyze risks in Alba's proposed approach
 */
export async function analyzeRisks(
  albaResult: AlbaApproach,
  floorName: string,
  floorDescription: string | null,
): Promise<RiskAnalysisResult> {
  console.log(`[RiskAnalyzer] Analyzing risks for: ${floorName}`);

  const risks: Risk[] = [];

  // Analyze each risk category
  risks.push(...analyzeSecurityRisks(albaResult, floorName));
  risks.push(...analyzeReliabilityRisks(albaResult, floorName));
  risks.push(...analyzeCostRisks(albaResult, floorName));
  risks.push(...analyzeMaintenanceRisks(albaResult, floorName));

  // Calculate total risk score
  const totalRiskScore = risks.reduce((sum, r) => sum + r.riskScore, 0);

  // Categorize by severity
  const criticalRisks = risks.filter(r => r.severity >= CRITICAL_RISK_THRESHOLD);
  const highRisks = risks.filter(r => r.severity >= 5 && r.severity < CRITICAL_RISK_THRESHOLD);
  const mediumRisks = risks.filter(r => r.severity >= 3 && r.severity < 5);
  const lowRisks = risks.filter(r => r.severity < 3);

  // Generate mitigations
  const mitigations = generateMitigations([...criticalRisks, ...highRisks, ...mediumRisks]);

  // Determine pass/fail
  const passed = criticalRisks.length === 0 && totalRiskScore <= MAX_TOTAL_RISK_SCORE;

  // Generate risk report
  const riskReport = generateRiskReport(
    risks,
    criticalRisks,
    highRisks,
    mediumRisks,
    lowRisks,
    mitigations,
    totalRiskScore,
    passed,
  );

  console.log(`[RiskAnalyzer] Analysis ${passed ? 'PASSED' : 'FAILED'} (total risk: ${totalRiskScore.toFixed(1)}, critical: ${criticalRisks.length})`);

  return {
    passed,
    totalRiskScore,
    criticalRisks,
    highRisks,
    mediumRisks,
    lowRisks,
    mitigations,
    riskReport,
  };
}

// ============================================================
// Security Risk Analysis
// ============================================================

function analyzeSecurityRisks(alba: AlbaApproach, floorName: string): Risk[] {
  const risks: Risk[] = [];
  const text = `${alba.approach} ${alba.implementation} ${alba.libraries.join(' ')}`.toLowerCase();

  // API key exposure risk
  if (text.includes('api key') || text.includes('api_key') || text.includes('token')) {
    const evidence = [];
    if (!text.includes('env') && !text.includes('.env') && !text.includes('environment')) {
      evidence.push('API keys mentioned but no environment variable usage detected');
    }
    if (text.includes('hardcode') || text.includes('hard-code')) {
      evidence.push('Hardcoded credentials mentioned');
    }

    if (evidence.length > 0) {
      risks.push({
        category: 'security',
        description: 'API Key Exposure Risk',
        severity: 8,
        likelihood: evidence.length > 1 ? 0.7 : 0.4,
        riskScore: 0,
        evidence,
      });
    }
  }

  // Injection vulnerability risk
  const hasUserInput = text.includes('user input') || text.includes('user-provided') || text.includes('query') || text.includes('parameter');
  const hasDatabase = text.includes('database') || text.includes('sql') || text.includes('query');
  const hasSanitization = text.includes('sanitize') || text.includes('escape') || text.includes('validate') || text.includes('parameterized');

  if (hasUserInput && hasDatabase && !hasSanitization) {
    risks.push({
      category: 'security',
      description: 'SQL Injection Risk',
      severity: 9,
      likelihood: 0.6,
      riskScore: 0,
      evidence: [
        'User input used with database',
        'No sanitization or parameterized queries mentioned',
      ],
    });
  }

  // XSS risk
  const hasWebOutput = text.includes('html') || text.includes('web') || text.includes('browser') || text.includes('dom');
  const hasXSSProtection = text.includes('escape') || text.includes('sanitize html') || text.includes('xss');

  if (hasUserInput && hasWebOutput && !hasXSSProtection) {
    risks.push({
      category: 'security',
      description: 'Cross-Site Scripting (XSS) Risk',
      severity: 7,
      likelihood: 0.5,
      riskScore: 0,
      evidence: [
        'User input rendered in web context',
        'No XSS protection mentioned',
      ],
    });
  }

  // Insecure dependencies
  const hasOldLibraries = alba.libraries.some(lib =>
    lib.includes('request') || // deprecated npm package
    lib.includes('node-fetch@1') || // old version
    lib.includes('axios@0')  // very old version
  );

  if (hasOldLibraries) {
    risks.push({
      category: 'security',
      description: 'Deprecated/Insecure Dependencies',
      severity: 6,
      likelihood: 0.8,
      riskScore: 0,
      evidence: [
        `Potentially deprecated libraries: ${alba.libraries.filter(l => l.includes('request')).join(', ')}`,
      ],
    });
  }

  // Calculate risk scores
  risks.forEach(risk => {
    risk.riskScore = risk.severity * risk.likelihood;
  });

  return risks;
}

// ============================================================
// Reliability Risk Analysis
// ============================================================

function analyzeReliabilityRisks(alba: AlbaApproach, floorName: string): Risk[] {
  const risks: Risk[] = [];
  const text = `${alba.approach} ${alba.implementation}`.toLowerCase();

  // Rate limiting risk
  const hasAPICall = text.includes('api') || text.includes('http') || text.includes('request');
  const hasRateLimit = text.includes('rate limit') || text.includes('throttle') || text.includes('backoff');

  if (hasAPICall && !hasRateLimit) {
    risks.push({
      category: 'reliability',
      description: 'Rate Limiting Risk',
      severity: 5,
      likelihood: 0.7,
      riskScore: 0,
      evidence: [
        'API calls without rate limiting mentioned',
        'Risk of hitting API rate limits',
      ],
    });
  }

  // Timeout/retry risk
  const hasNetworkCall = hasAPICall || text.includes('fetch') || text.includes('axios');
  const hasErrorHandling = text.includes('retry') || text.includes('timeout') || text.includes('error handling');

  if (hasNetworkCall && !hasErrorHandling) {
    risks.push({
      category: 'reliability',
      description: 'Network Error Handling Risk',
      severity: 6,
      likelihood: 0.8,
      riskScore: 0,
      evidence: [
        'Network calls without retry/timeout logic',
        'May fail on transient errors',
      ],
    });
  }

  // Single point of failure
  const hasSingleAPI = text.match(/\b(only|single|one)\s+(api|service|endpoint)\b/);
  const hasNoFallback = !text.includes('fallback') && !text.includes('backup') && !text.includes('alternative');

  if (hasSingleAPI && hasNoFallback) {
    risks.push({
      category: 'reliability',
      description: 'Single Point of Failure',
      severity: 4,
      likelihood: 0.6,
      riskScore: 0,
      evidence: [
        'Relies on single API/service',
        'No fallback mechanism mentioned',
      ],
    });
  }

  // Data loss risk
  const hasDataStorage = text.includes('save') || text.includes('store') || text.includes('write') || text.includes('database');
  const hasBackup = text.includes('backup') || text.includes('redundancy') || text.includes('replicate');

  if (hasDataStorage && !hasBackup && alba.complexity > 5) {
    risks.push({
      category: 'reliability',
      description: 'Data Loss Risk',
      severity: 5,
      likelihood: 0.3,
      riskScore: 0,
      evidence: [
        'Data storage without backup strategy',
        'Complex system increases failure points',
      ],
    });
  }

  // Calculate risk scores
  risks.forEach(risk => {
    risk.riskScore = risk.severity * risk.likelihood;
  });

  return risks;
}

// ============================================================
// Cost Risk Analysis
// ============================================================

function analyzeCostRisks(alba: AlbaApproach, floorName: string): Risk[] {
  const risks: Risk[] = [];
  const text = `${alba.approach} ${alba.implementation}`.toLowerCase();

  // Expensive API risk
  const expensiveAPIs = ['openai', 'gpt-4', 'claude', 'anthropic', 'aws bedrock', 'vertex ai'];
  const usesExpensiveAPI = expensiveAPIs.some(api => text.includes(api));
  const hasCostControl = text.includes('cost limit') || text.includes('budget') || text.includes('rate limit');

  if (usesExpensiveAPI && !hasCostControl) {
    risks.push({
      category: 'cost',
      description: 'Uncontrolled API Costs',
      severity: 7,
      likelihood: 0.5,
      riskScore: 0,
      evidence: [
        `Uses expensive API: ${expensiveAPIs.filter(api => text.includes(api)).join(', ')}`,
        'No cost control mechanism mentioned',
      ],
    });
  }

  // High-frequency polling
  const hasPolling = text.includes('poll') || text.includes('check every') || text.includes('interval');
  const highFrequency = text.match(/\b(second|1\s*min|30\s*sec|every\s*\d+\s*s)\b/);

  if (hasPolling && highFrequency) {
    risks.push({
      category: 'cost',
      description: 'High-Frequency Polling Costs',
      severity: 4,
      likelihood: 0.7,
      riskScore: 0,
      evidence: [
        'High-frequency polling detected',
        'May result in excessive API calls',
      ],
    });
  }

  // Storage costs
  const hasLargeStorage = text.includes('store all') || text.includes('archive') || text.includes('historical data');
  const hasStorageLimit = text.includes('ttl') || text.includes('expire') || text.includes('delete old');

  if (hasLargeStorage && !hasStorageLimit) {
    risks.push({
      category: 'cost',
      description: 'Unlimited Storage Growth',
      severity: 3,
      likelihood: 0.6,
      riskScore: 0,
      evidence: [
        'Stores large amounts of data',
        'No retention policy or cleanup mentioned',
      ],
    });
  }

  // Calculate risk scores
  risks.forEach(risk => {
    risk.riskScore = risk.severity * risk.likelihood;
  });

  return risks;
}

// ============================================================
// Maintenance Risk Analysis
// ============================================================

function analyzeMaintenanceRisks(alba: AlbaApproach, floorName: string): Risk[] {
  const risks: Risk[] = [];
  const text = `${alba.approach} ${alba.implementation} ${alba.libraries.join(' ')}`.toLowerCase();

  // Deprecated API risk
  const deprecatedAPIs = ['v1', 'v2', 'beta', 'deprecated'];
  const usesDeprecatedAPI = deprecatedAPIs.some(api => text.includes(api));

  if (usesDeprecatedAPI) {
    risks.push({
      category: 'maintenance',
      description: 'Deprecated API Usage',
      severity: 5,
      likelihood: 0.5,
      riskScore: 0,
      evidence: [
        `Uses potentially deprecated API version: ${deprecatedAPIs.filter(api => text.includes(api)).join(', ')}`,
        'May require migration in the future',
      ],
    });
  }

  // Unmaintained library risk
  const unmaintainedLibs = ['request', 'node-uuid', 'moment']; // Known deprecated packages
  const usesUnmaintained = alba.libraries.filter(lib =>
    unmaintainedLibs.some(u => lib.toLowerCase().includes(u))
  );

  if (usesUnmaintained.length > 0) {
    risks.push({
      category: 'maintenance',
      description: 'Unmaintained Dependencies',
      severity: 4,
      likelihood: 0.8,
      riskScore: 0,
      evidence: [
        `Uses unmaintained libraries: ${usesUnmaintained.join(', ')}`,
        'Security vulnerabilities may not be patched',
      ],
    });
  }

  // Complex custom logic
  const hasCustomLogic = text.includes('custom') || text.includes('implement from scratch') || text.includes('build our own');
  const highComplexity = alba.complexity > 7;

  if (hasCustomLogic && highComplexity) {
    risks.push({
      category: 'maintenance',
      description: 'High Maintenance Complexity',
      severity: 3,
      likelihood: 0.6,
      riskScore: 0,
      evidence: [
        'Complex custom implementation',
        `High complexity score: ${alba.complexity}/10`,
        'Will require ongoing maintenance',
      ],
    });
  }

  // Calculate risk scores
  risks.forEach(risk => {
    risk.riskScore = risk.severity * risk.likelihood;
  });

  return risks;
}

// ============================================================
// Mitigation Generation
// ============================================================

function generateMitigations(risks: Risk[]): Mitigation[] {
  const mitigations: Mitigation[] = [];

  risks.forEach(risk => {
    const mitigation = getMitigationForRisk(risk);
    if (mitigation) {
      mitigations.push(mitigation);
    }
  });

  return mitigations;
}

function getMitigationForRisk(risk: Risk): Mitigation | null {
  // Security mitigations
  if (risk.description === 'API Key Exposure Risk') {
    return {
      risk: risk.description,
      recommendation: 'Store API keys in environment variables',
      implementation: 'Use .env file with dotenv package, never commit keys to git, add .env to .gitignore',
      effort: 'low',
    };
  }

  if (risk.description === 'SQL Injection Risk') {
    return {
      risk: risk.description,
      recommendation: 'Use parameterized queries or ORM',
      implementation: 'Use Prisma ORM or parameterized queries with pg/mysql2 libraries',
      effort: 'medium',
    };
  }

  if (risk.description === 'Cross-Site Scripting (XSS) Risk') {
    return {
      risk: risk.description,
      recommendation: 'Sanitize user input before rendering',
      implementation: 'Use DOMPurify for HTML sanitization, escape user input in templates',
      effort: 'low',
    };
  }

  // Reliability mitigations
  if (risk.description === 'Rate Limiting Risk') {
    return {
      risk: risk.description,
      recommendation: 'Implement rate limiting with exponential backoff',
      implementation: 'Use p-throttle or bottleneck library, add exponential backoff on 429 errors',
      effort: 'medium',
    };
  }

  if (risk.description === 'Network Error Handling Risk') {
    return {
      risk: risk.description,
      recommendation: 'Add retry logic and timeouts',
      implementation: 'Use axios-retry or p-retry library, set reasonable timeouts (5-30s)',
      effort: 'low',
    };
  }

  // Cost mitigations
  if (risk.description === 'Uncontrolled API Costs') {
    return {
      risk: risk.description,
      recommendation: 'Implement cost controls and monitoring',
      implementation: 'Add max tokens limit, track usage in DB, set monthly budget alerts',
      effort: 'medium',
    };
  }

  if (risk.description === 'High-Frequency Polling Costs') {
    return {
      risk: risk.description,
      recommendation: 'Use webhooks instead of polling',
      implementation: 'Set up webhook endpoint, register with API provider, process events',
      effort: 'high',
    };
  }

  // Maintenance mitigations
  if (risk.description === 'Deprecated API Usage') {
    return {
      risk: risk.description,
      recommendation: 'Upgrade to latest API version',
      implementation: 'Check API documentation for latest version, test migration path',
      effort: 'medium',
    };
  }

  if (risk.description === 'Unmaintained Dependencies') {
    return {
      risk: risk.description,
      recommendation: 'Replace with maintained alternatives',
      implementation: 'Use node-fetch instead of request, use dayjs instead of moment',
      effort: 'medium',
    };
  }

  return null;
}

// ============================================================
// Report Generation
// ============================================================

function generateRiskReport(
  allRisks: Risk[],
  critical: Risk[],
  high: Risk[],
  medium: Risk[],
  low: Risk[],
  mitigations: Mitigation[],
  totalScore: number,
  passed: boolean,
): string {
  const parts: string[] = [];

  parts.push(`# Risk Analysis Report`);
  parts.push(``);
  parts.push(`**Total Risk Score**: ${totalScore.toFixed(1)}`);
  parts.push(`**Status**: ${passed ? 'PASSED ✅' : 'FAILED ❌'}`);
  parts.push(`**Critical Risks**: ${critical.length}`);
  parts.push(`**High Risks**: ${high.length}`);
  parts.push(`**Medium Risks**: ${medium.length}`);
  parts.push(`**Low Risks**: ${low.length}`);
  parts.push(``);

  // Critical risks
  if (critical.length > 0) {
    parts.push(`## 🔴 Critical Risks (${critical.length})`);
    critical.forEach((risk, idx) => {
      parts.push(``);
      parts.push(`### ${idx + 1}. ${risk.description}`);
      parts.push(`- **Category**: ${risk.category}`);
      parts.push(`- **Severity**: ${risk.severity}/10`);
      parts.push(`- **Likelihood**: ${(risk.likelihood * 100).toFixed(0)}%`);
      parts.push(`- **Risk Score**: ${risk.riskScore.toFixed(1)}`);
      if (risk.evidence.length > 0) {
        parts.push(`- **Evidence**:`);
        risk.evidence.forEach(e => parts.push(`  - ${e}`));
      }
    });
    parts.push(``);
  }

  // High risks
  if (high.length > 0) {
    parts.push(`## 🟠 High Risks (${high.length})`);
    high.forEach((risk, idx) => {
      parts.push(``);
      parts.push(`### ${idx + 1}. ${risk.description}`);
      parts.push(`- **Category**: ${risk.category}`);
      parts.push(`- **Severity**: ${risk.severity}/10`);
      parts.push(`- **Likelihood**: ${(risk.likelihood * 100).toFixed(0)}%`);
      parts.push(`- **Risk Score**: ${risk.riskScore.toFixed(1)}`);
      if (risk.evidence.length > 0) {
        parts.push(`- **Evidence**:`);
        risk.evidence.forEach(e => parts.push(`  - ${e}`));
      }
    });
    parts.push(``);
  }

  // Medium risks
  if (medium.length > 0) {
    parts.push(`## 🟡 Medium Risks (${medium.length})`);
    medium.forEach((risk, idx) => {
      parts.push(`${idx + 1}. **${risk.description}** - Score: ${risk.riskScore.toFixed(1)}`);
    });
    parts.push(``);
  }

  // Low risks
  if (low.length > 0) {
    parts.push(`## 🟢 Low Risks (${low.length})`);
    low.forEach((risk, idx) => {
      parts.push(`${idx + 1}. **${risk.description}** - Score: ${risk.riskScore.toFixed(1)}`);
    });
    parts.push(``);
  }

  // Mitigations
  if (mitigations.length > 0) {
    parts.push(`## 🛡️ Recommended Mitigations (${mitigations.length})`);
    mitigations.forEach((mit, idx) => {
      parts.push(``);
      parts.push(`### ${idx + 1}. ${mit.risk}`);
      parts.push(`- **Recommendation**: ${mit.recommendation}`);
      parts.push(`- **Implementation**: ${mit.implementation}`);
      parts.push(`- **Effort**: ${mit.effort}`);
    });
    parts.push(``);
  }

  return parts.join('\n');
}
