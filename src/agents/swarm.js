/**
 * AskElira 2.1 Swarm Agent Implementation
 *
 * This module implements the Alba, David, Vex, and Elira agents for the swarm debate flow.
 * Each agent calls Claude API directly to analyze automation building questions.
 *
 * Usage:
 *   const { Swarm } = require('./swarm');
 *   const swarm = new Swarm({ agents: 10000 });
 *   const research = await swarm.alba.research("Build email automation");
 */

// Token pricing (as of March 2026)
const PRICING = {
  'claude-sonnet-4-5-20250929': {
    input: 0.000003,  // $3 per million input tokens
    output: 0.000015, // $15 per million output tokens
  },
  'claude-opus-4-5': {
    input: 0.000015,  // $15 per million input tokens
    output: 0.000075, // $75 per million output tokens
  },
};

/**
 * Calculate cost from token usage
 */
function calculateCost(usage, model) {
  const pricing = PRICING[model] || PRICING['claude-sonnet-4-5-20250929'];
  const inputCost = (usage.input_tokens || 0) * pricing.input;
  const outputCost = (usage.output_tokens || 0) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Call Claude API with retry logic (uses fetch, no SDK dependency)
 */
async function callClaude(systemPrompt, userMessage, model = 'claude-sonnet-4-5-20250929', maxTokens = 4096) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set in environment');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Swarm] Claude API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const cost = calculateCost(data.usage, model);

    return { text, cost, usage: data.usage };
  } catch (error) {
    console.error('[Swarm] Claude API error:', error.message);
    throw error;
  }
}

/**
 * Parse JSON from Claude response (handles markdown fences)
 */
function parseJSON(text, agentName) {
  let cleaned = text.trim();

  // Strip markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/, '');
    cleaned = cleaned.replace(/\n?```\s*$/, '');
    cleaned = cleaned.trim();
  }

  // Try to find JSON object
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;

  if (firstBrace >= 0 && firstBracket >= 0) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace >= 0) {
    startIdx = firstBrace;
  } else if (firstBracket >= 0) {
    startIdx = firstBracket;
  }

  if (startIdx > 0) {
    cleaned = cleaned.slice(startIdx);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`[${agentName}] Failed to parse JSON:`, cleaned.slice(0, 500));
    throw new Error(`${agentName} returned invalid JSON`);
  }
}

/**
 * Main Swarm class
 */
class Swarm {
  constructor({ agents = 10000 }) {
    this.agentCount = agents;
  }

  /**
   * Alba - Research Agent
   * Researches technical approaches for automation building
   */
  alba = {
    research: async (question) => {
      const systemPrompt = `You are Alba, AskElira's research agent for automation building.

Your role: Research HOW to build the requested automation. Focus on:
1. What APIs, libraries, or services are available
2. What technical approaches exist
3. What has worked for others building similar automations
4. What are the key challenges and risks
5. Legal, ethical, and ToS considerations

Return ONLY valid JSON matching this schema:
{
  "summary": "2-3 sentence overview of findings",
  "sources": [
    {
      "title": "Source title",
      "url": "https://...",
      "keyPoints": ["point 1", "point 2"]
    }
  ],
  "marketDemand": "high|medium|low",
  "technicalFeasibility": "easy|medium|hard",
  "existingSolutions": ["solution 1", "solution 2"],
  "challenges": ["challenge 1", "challenge 2"],
  "confidence": 85
}`;

      const userMessage = `Research how to build this automation:\n\n"${question}"\n\nProvide technical approach, available tools, and implementation guidance.`;

      console.log('[Alba] Researching automation approaches...');
      const { text, cost } = await callClaude(systemPrompt, userMessage, 'claude-sonnet-4-5-20250929', 4096);

      const result = parseJSON(text, 'Alba');
      result.cost = cost;

      return result;
    }
  };

  /**
   * David - Swarm Debate Agent
   * Simulates debate on whether/how to build the automation
   */
  david = {
    swarm: async (question, research) => {
      const systemPrompt = `You are David, AskElira's debate orchestrator for automation building.

Your role: Simulate a ${this.agentCount}-agent debate on whether and HOW to build this automation.

Debate structure:
- Half argue FOR building it (reasons to proceed, best approaches)
- Half argue AGAINST or flag concerns (risks, challenges, alternatives)
- Consider the research findings
- Reach consensus on the best technical approach

Return ONLY valid JSON matching this schema:
{
  "decision": "go|no-go|conditional|insufficient_data",
  "confidence": 75,
  "argumentsFor": [
    "Strong argument supporting this approach",
    "Another supporting argument"
  ],
  "argumentsAgainst": [
    "Valid concern or risk",
    "Another concern"
  ],
  "clusters": [
    {
      "approach": "Description of approach",
      "support": 6500,
      "concerns": ["concern 1", "concern 2"]
    }
  ],
  "consensus": "Brief description of consensus approach",
  "consensusStrength": 85,
  "votes": {
    "for": 7500,
    "against": 2500,
    "total": 10000
  },
  "reasoning": "2-3 sentences explaining the consensus"
}`;

      const userMessage = `Question: "${question}"

Research Context:
${JSON.stringify(research, null, 2)}

Run the ${this.agentCount}-agent debate and return the consensus.`;

      console.log('[David] Running swarm debate simulation...');
      const { text, cost } = await callClaude(systemPrompt, userMessage, 'claude-sonnet-4-5-20250929', 8192);

      const result = parseJSON(text, 'David');
      result.cost = cost;
      result.agentCount = this.agentCount;
      result.duration = 0; // Set by caller

      return result;
    }
  };

  /**
   * Vex - Quality Auditor
   * Audits the debate result for quality and validity
   */
  vex = {
    audit: async (question, swarmResult) => {
      const systemPrompt = `You are Vex, AskElira's quality auditor for automation building.

Your role: Audit the debate result for quality, validity, and logical soundness.

Check for:
- Are the technical approaches sound?
- Is the confidence level justified?
- Any logical fallacies in the reasoning?
- Missing critical considerations (security, scalability, cost)?
- Unrealistic assumptions?
- Legal or ethical issues?

Return ONLY valid JSON matching this schema:
{
  "passed": true,
  "notes": [
    "Quality observation 1",
    "Observation 2"
  ],
  "challenges": [
    "Challenge or risk to flag",
    "Another challenge"
  ],
  "issues": [
    "Issue that needs addressing (or empty if none)"
  ],
  "confidenceAdjustment": 0,
  "recommendedConfidence": 75
}`;

      const userMessage = `Question: "${question}"

Swarm Debate Result:
${JSON.stringify(swarmResult, null, 2)}

Audit this result thoroughly.`;

      console.log('[Vex] Auditing debate result...');
      const { text, cost } = await callClaude(systemPrompt, userMessage, 'claude-sonnet-4-5-20250929', 4096);

      const result = parseJSON(text, 'Vex');
      result.cost = cost;

      return result;
    }
  };

  /**
   * Elira - Synthesis Agent
   * Makes final decision and creates actionable plan
   */
  elira = {
    synthesize: async (question, { research, swarmResult, audit }) => {
      const systemPrompt = `You are Elira, AskElira's synthesis agent for automation building.

Your role: Synthesize all inputs into a final decision with actionable recommendations.

Consider:
- Research findings (feasibility, existing solutions)
- Debate outcome (consensus, voting distribution)
- Audit feedback (quality issues, challenges)

Determine:
- Final decision (go/no-go/conditional)
- Adjusted confidence based on audit
- Clear recommendation for the user
- Whether this is buildable via code generation
- Specific next steps if proceeding

Return ONLY valid JSON matching this schema:
{
  "decision": "go|no-go|conditional",
  "confidence": 75,
  "reasoning": "2-3 sentences explaining the final decision",
  "argumentsFor": ["key reason 1", "key reason 2"],
  "argumentsAgainst": ["key concern 1", "key concern 2"],
  "auditPassed": true,
  "auditIssues": ["issue 1 if any"],
  "recommendation": "Clear actionable recommendation",
  "votes": {
    "for": 7500,
    "against": 2500,
    "total": 10000
  },
  "buildable": true,
  "buildPlan": {
    "description": "What will be built",
    "approach": "Technical approach to use",
    "components": ["component 1", "component 2"],
    "estimatedComplexity": "low|medium|high",
    "estimatedTime": "2-4 hours"
  }
}`;

      const userMessage = `Question: "${question}"

Research:
${JSON.stringify(research, null, 2)}

Debate:
${JSON.stringify(swarmResult, null, 2)}

Audit:
${JSON.stringify(audit, null, 2)}

Synthesize final decision.`;

      console.log('[Elira] Synthesizing final decision...');
      const { text, cost } = await callClaude(systemPrompt, userMessage, 'claude-opus-4-5', 8192);

      const result = parseJSON(text, 'Elira');
      result.cost = cost;

      return result;
    }
  };

  /**
   * Run full debate pipeline
   */
  async debate(question) {
    const startTime = Date.now();

    console.log(`[Swarm] Starting ${this.agentCount}-agent debate on: "${question}"`);

    // Alba research
    const research = await this.alba.research(question);
    console.log(`[Swarm] Research complete (${research.confidence}% confidence)`);

    // David swarm debate
    const swarmResult = await this.david.swarm(question, research);
    swarmResult.duration = Date.now() - startTime;
    console.log(`[Swarm] Debate complete (${swarmResult.decision}, ${swarmResult.confidence}% confidence)`);

    // Vex audit
    const audit = await this.vex.audit(question, swarmResult);
    console.log(`[Swarm] Audit complete (${audit.passed ? 'PASSED' : 'FAILED'})`);

    // Elira synthesis
    const synthesis = await this.elira.synthesize(question, { research, swarmResult, audit });
    console.log(`[Swarm] Synthesis complete (${synthesis.decision}, ${synthesis.confidence}% confidence)`);

    const totalCost = (research.cost || 0) + (swarmResult.cost || 0) + (audit.cost || 0) + (synthesis.cost || 0);
    const totalDuration = Date.now() - startTime;

    console.log(`[Swarm] Pipeline complete in ${totalDuration}ms, cost: $${totalCost.toFixed(4)}`);

    return {
      question,
      research,
      debate: swarmResult,
      audit,
      synthesis,
      totalCost,
      duration: totalDuration,
    };
  }
}

module.exports = { Swarm };
