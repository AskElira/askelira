"use strict";
/**
 * Phase 0: Business Plan
 *
 * Interactive OpenClaw conversation to validate and refine the goal
 * BEFORE proceeding to Elira's floor planning (Floor Zero).
 *
 * Purpose:
 * - Identify legal/ethical issues early
 * - Refine goal for feasibility
 * - Set realistic success criteria
 * - Get user buy-in before expensive building process
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPhaseZero = runPhaseZero;
exports.quickValidation = quickValidation;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const chalk_1 = __importDefault(require("chalk"));
const PHASE_ZERO_SYSTEM_PROMPT = `You are OpenClaw, AskElira's business planning consultant.

Your role is to have a thoughtful conversation with the user about their automation goal BEFORE any technical work begins. Your goal is to:

1. **Understand the real business need** - What problem are they solving?
2. **Identify risks early** - Legal issues (ToS violations, GDPR, CAN-SPAM), ethical concerns, technical blockers
3. **Suggest alternatives** - If their approach has problems, propose legitimate solutions
4. **Set realistic expectations** - Cost estimates, success criteria, timelines
5. **Refine the goal** - Work with them to create an achievable, ethical automation

**Key Principles:**
- Be friendly and conversational, not robotic
- Ask clarifying questions (one at a time)
- Explain WHY something might be problematic (educate, don't just reject)
- Offer creative alternatives when blocking risky approaches
- Be honest about costs and complexity
- Use examples to illustrate points

**Red Flags to Watch For:**
- Web scraping of sites that prohibit it (Google Maps, LinkedIn, Twitter, etc.)
- Cold emailing without consent (B2B spam, GDPR violations)
- Unrealistic data completeness requirements (>90% often requires expensive APIs)
- Automated actions that violate platform ToS (auto-follow, auto-like, etc.)
- Missing authentication/API keys for critical services
- Vague success criteria ("make it work", "get leads")

**Your Conversation Flow:**
1. Acknowledge their goal
2. Ask 1-2 clarifying questions
3. Identify any risks/concerns
4. If risks exist: Explain the issue + suggest alternatives
5. If no risks: Validate feasibility + set expectations
6. Refine the goal together
7. Summarize the finalized plan
8. Ask for approval to proceed

**Output Format:**
When the conversation is complete and the user approves, output ONLY this JSON:
{
  "approved": true,
  "refinedGoal": "Final goal description (1-2 sentences)",
  "legalRisks": ["risk1", "risk2"],
  "technicalFeasibility": "high|medium|low",
  "estimatedCost": "$X-Y per month for APIs/services",
  "suggestedDataSources": ["source1", "source2"],
  "successCriteria": "Clear, measurable success criteria",
  "conversationSummary": "2-3 sentence summary of what we discussed and agreed upon"
}

If the user rejects or the goal is fundamentally unachievable:
{
  "approved": false,
  "refinedGoal": "",
  "legalRisks": [...],
  "technicalFeasibility": "low",
  "estimatedCost": "",
  "suggestedDataSources": [],
  "successCriteria": "",
  "conversationSummary": "Why this goal cannot proceed"
}`;
async function runPhaseZero(initialGoal, apiKey) {
    const anthropic = new sdk_1.default({ apiKey });
    console.log(chalk_1.default.cyan('\n┌─────────────────────────────────────────────┐'));
    console.log(chalk_1.default.cyan('│  Phase 0: Business Plan                     │'));
    console.log(chalk_1.default.cyan('│  Let\'s validate your automation idea...     │'));
    console.log(chalk_1.default.cyan('└─────────────────────────────────────────────┘\n'));
    const conversationHistory = [
        {
            role: 'user',
            content: `I want to build this automation: "${initialGoal}"`,
        },
    ];
    let turnCount = 0;
    const MAX_TURNS = 10;
    while (turnCount < MAX_TURNS) {
        turnCount++;
        // Call Claude
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 2048,
            system: PHASE_ZERO_SYSTEM_PROMPT,
            messages: conversationHistory,
        });
        const assistantMessage = response.content[0];
        if (assistantMessage.type !== 'text') {
            throw new Error('Unexpected response type from Claude');
        }
        const text = assistantMessage.text;
        // Check if OpenClaw returned the final JSON
        if (text.includes('"approved"') && text.includes('"refinedGoal"')) {
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    // Display final summary
                    console.log(chalk_1.default.green('\n✓ Business plan complete!\n'));
                    if (result.approved) {
                        console.log(chalk_1.default.bold('Refined Goal:'), result.refinedGoal);
                        console.log(chalk_1.default.bold('\nSuccess Criteria:'), result.successCriteria);
                        console.log(chalk_1.default.bold('Feasibility:'), result.technicalFeasibility);
                        console.log(chalk_1.default.bold('Estimated Cost:'), result.estimatedCost);
                        if (result.legalRisks.length > 0) {
                            console.log(chalk_1.default.yellow('\nLegal Considerations:'));
                            result.legalRisks.forEach(risk => console.log(chalk_1.default.yellow(`  - ${risk}`)));
                        }
                        console.log(chalk_1.default.bold('\nData Sources:'));
                        result.suggestedDataSources.forEach(source => console.log(`  - ${source}`));
                    }
                    else {
                        console.log(chalk_1.default.red('Goal cannot proceed:'), result.conversationSummary);
                    }
                    return result;
                }
            }
            catch (err) {
                // Not valid JSON yet, continue conversation
            }
        }
        // Display OpenClaw's message
        console.log(chalk_1.default.cyan('OpenClaw:'), text);
        console.log();
        // Add to history
        conversationHistory.push({
            role: 'assistant',
            content: text,
        });
        // Get user input
        const readline = await Promise.resolve().then(() => __importStar(require('readline')));
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const userInput = await new Promise((resolve) => {
            rl.question(chalk_1.default.bold('You: '), (answer) => {
                rl.close();
                resolve(answer);
            });
        });
        console.log();
        // Check for exit commands
        if (userInput.toLowerCase() === 'cancel' || userInput.toLowerCase() === 'quit' || userInput.toLowerCase() === 'exit') {
            console.log(chalk_1.default.yellow('\n✗ Phase 0 cancelled by user\n'));
            return {
                approved: false,
                refinedGoal: '',
                legalRisks: [],
                technicalFeasibility: 'low',
                estimatedCost: '',
                suggestedDataSources: [],
                successCriteria: '',
                conversationSummary: 'User cancelled the conversation',
            };
        }
        // Add user response to history
        conversationHistory.push({
            role: 'user',
            content: userInput,
        });
    }
    // Max turns reached without approval
    console.log(chalk_1.default.red('\n✗ Conversation limit reached\n'));
    return {
        approved: false,
        refinedGoal: '',
        legalRisks: ['Conversation did not reach conclusion'],
        technicalFeasibility: 'low',
        estimatedCost: '',
        suggestedDataSources: [],
        successCriteria: '',
        conversationSummary: 'Maximum conversation turns reached without finalizing a plan',
    };
}
/**
 * Quick validation check for obvious red flags
 * Returns warnings to display to user before starting Phase 0
 */
function quickValidation(goal) {
    const warnings = [];
    const lowerGoal = goal.toLowerCase();
    // Scraping red flags
    if (lowerGoal.includes('scrap')) {
        if (lowerGoal.includes('google maps') || lowerGoal.includes('linkedin') || lowerGoal.includes('twitter') || lowerGoal.includes('instagram')) {
            warnings.push('⚠️  Goal involves scraping a platform that typically prohibits it');
        }
    }
    // Email red flags
    if (lowerGoal.includes('cold email') || lowerGoal.includes('cold mail')) {
        warnings.push('⚠️  Cold emailing requires GDPR/CAN-SPAM compliance');
    }
    // Unrealistic data completeness
    if (lowerGoal.match(/\d{2,}%/) && parseInt(lowerGoal.match(/(\d{2,})%/)?.[1] || '0') > 85) {
        warnings.push('⚠️  High data completeness (>85%) often requires expensive APIs');
    }
    // Automation of manual platform actions
    if (lowerGoal.includes('auto-follow') || lowerGoal.includes('auto-like') || lowerGoal.includes('auto-comment')) {
        warnings.push('⚠️  Automated social media actions typically violate platform ToS');
    }
    return warnings;
}
//# sourceMappingURL=phase-zero.js.map