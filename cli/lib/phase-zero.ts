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

import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

interface PhaseZeroResult {
  approved: boolean;
  refinedGoal: string;
  legalRisks: string[];
  technicalFeasibility: 'high' | 'medium' | 'low';
  estimatedCost: string;
  suggestedDataSources: string[];
  successCriteria: string;
  conversationSummary: string;
}

interface UserConfig {
  agentmail?: {
    apiKey?: string;
    fromEmail: string;
    fromName?: string;
  };
  braveSearchApiKey?: string;
  llm?: {
    provider: string;
    model: string;
  };
}

function buildPhaseZeroSystemPrompt(context?: UserConfig): string {
  let contextInfo = '';

  if (context) {
    const hasAgentMail = !!context.agentmail?.apiKey;
    const hasBraveSearch = !!context.braveSearchApiKey;
    const llmProvider = context.llm?.provider || 'unknown';

    contextInfo = `\n**USER CONTEXT (Use this to avoid asking about things we already know):**
- Email Provider: ${hasAgentMail ? '✅ AgentMail configured (fromEmail: ' + context.agentmail!.fromEmail + ')' : 'Not configured'}
- LLM Provider: ${llmProvider}
- Web Search: ${hasBraveSearch ? '✅ Brave Search available' : 'Not configured'}

**IMPORTANT:** The user already has these services configured. Don't ask "what email service?" or "what API?" - USE what they have! Only ask if their request needs something they DON'T have configured.
`;
  }

  return `You are Elira, AskElira's business planning consultant.
${contextInfo}
Your role is to have a thoughtful conversation with the user about their automation goal BEFORE any technical work begins. Your goal is to:

1. **Understand the real business need** - What problem are they solving?
2. **Identify risks early** - Legal issues (ToS violations, GDPR, CAN-SPAM), ethical concerns, technical blockers
3. **Suggest alternatives** - If their approach has problems, propose legitimate solutions
4. **Set realistic expectations** - Cost estimates, success criteria, timelines
5. **Refine the goal** - Work with them to create an achievable, ethical automation

**Key Principles:**
- Be friendly and conversational, not robotic
- Ask clarifying questions ONLY about unknowns (not things in USER CONTEXT)
- Explain WHY something might be problematic (educate, don't just reject)
- Offer creative alternatives when blocking risky approaches
- Be honest about costs and complexity
- Use examples to illustrate points
- **FASTER IS BETTER** - If you have enough context, proceed directly to the final JSON

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
}

export async function runPhaseZero(
  initialGoal: string,
  apiKey: string,
  userId?: string,
): Promise<PhaseZeroResult> {
  const anthropic = new Anthropic({ apiKey });

  // Load user config to make Elira smarter (fewer questions, lower API costs)
  let userConfig: UserConfig | undefined;
  try {
    const configPath = join(homedir(), '.askelira', 'config.json');
    if (existsSync(configPath)) {
      console.log(chalk.gray('Loading your configuration...'));
      const configData = readFileSync(configPath, 'utf-8');
      userConfig = JSON.parse(configData) as UserConfig;

      // Debug: Log what we detected
      console.log(chalk.gray(`[DEBUG] Config keys: ${Object.keys(userConfig).join(', ')}`));
      console.log(chalk.gray(`[DEBUG] AgentMail object: ${JSON.stringify(userConfig.agentmail)}`));

      const hasAgentMail = !!(userConfig as any).agentmail?.apiKey;
      console.log(chalk.gray(`[DEBUG] Has AgentMail: ${hasAgentMail}`));
      if (hasAgentMail) {
        console.log(chalk.gray(`[DEBUG] AgentMail fromEmail: ${(userConfig as any).agentmail.fromEmail}`));
      }

      console.log(chalk.green('✓ Context loaded\n'));
    }
  } catch (err) {
    // Continue without context if it fails
    console.log(chalk.yellow('⚠️  Could not load user config, proceeding with basic validation\n'));
    console.error(chalk.red(`[DEBUG] Error: ${err}`));
  }

  console.log(chalk.cyan('\n┌─────────────────────────────────────────────┐'));
  console.log(chalk.cyan('│  Phase 0: Business Plan (Elira)             │'));
  console.log(chalk.cyan('│  Let\'s validate your automation idea...     │'));
  console.log(chalk.cyan('└─────────────────────────────────────────────┘\n'));

  // Build smarter initial message with context
  let initialMessage = `I want to build this automation: "${initialGoal}"`;

  if (userConfig) {
    const configuredServices: string[] = [];

    if (userConfig.agentmail?.apiKey) configuredServices.push('AgentMail for email');
    if (userConfig.braveSearchApiKey) configuredServices.push('Brave Search for web research');
    if (userConfig.llm?.provider === 'anthropic') configuredServices.push('Anthropic Claude');
    if (userConfig.llm?.provider === 'openai') configuredServices.push('OpenAI');

    if (configuredServices.length > 0) {
      initialMessage += `\n\nMy configured services: ${configuredServices.join(', ')}`;
    }
  }

  const conversationHistory: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: initialMessage,
    },
  ];

  let turnCount = 0;
  const MAX_TURNS = 10;

  while (turnCount < MAX_TURNS) {
    turnCount++;

    // Show thinking indicator
    let dotCount = 0;
    const thinkingText = chalk.gray('Elira is thinking');
    process.stdout.write(thinkingText);

    const thinkingInterval = setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      const dots = '.'.repeat(dotCount);
      const spaces = ' '.repeat(3 - dotCount);
      process.stdout.write(`\r${thinkingText}${dots}${spaces}`);
    }, 500);

    // Call Claude with context-aware system prompt
    let response;
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: buildPhaseZeroSystemPrompt(userConfig),
        messages: conversationHistory,
      });
    } catch (apiErr: any) {
      clearInterval(thinkingInterval);
      process.stdout.write('\r' + ' '.repeat(30) + '\r'); // Clear thinking line
      // Better error details
      const errDetails = apiErr.error || apiErr.message || JSON.stringify(apiErr);
      throw new Error(`Anthropic API error: ${JSON.stringify(errDetails, null, 2)}`);
    }

    // Clear thinking indicator
    clearInterval(thinkingInterval);
    process.stdout.write('\r' + ' '.repeat(30) + '\r'); // Clear line

    const assistantMessage = response.content[0];
    if (assistantMessage.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const text = assistantMessage.text;

    // Check if Elira returned the final JSON
    if (text.includes('"approved"') && text.includes('"refinedGoal"')) {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]) as PhaseZeroResult;

          // Display final summary
          console.log(chalk.green('\n✓ Business plan complete!\n'));
          if (result.approved) {
            console.log(chalk.bold('Refined Goal:'), result.refinedGoal);
            console.log(chalk.bold('\nSuccess Criteria:'), result.successCriteria);
            console.log(chalk.bold('Feasibility:'), result.technicalFeasibility);
            console.log(chalk.bold('Estimated Cost:'), result.estimatedCost);
            if (result.legalRisks.length > 0) {
              console.log(chalk.yellow('\nLegal Considerations:'));
              result.legalRisks.forEach(risk => console.log(chalk.yellow(`  - ${risk}`)));
            }
            console.log(chalk.bold('\nData Sources:'));
            result.suggestedDataSources.forEach(source => console.log(`  - ${source}`));
          } else {
            console.log(chalk.red('Goal cannot proceed:'), result.conversationSummary);
          }

          return result;
        }
      } catch (err) {
        // Not valid JSON yet, continue conversation
      }
    }

    // Display Elira's message
    console.log(chalk.cyan('Elira:'), text);
    console.log();

    // Add to history
    conversationHistory.push({
      role: 'assistant',
      content: text,
    });

    // Get user input
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const userInput = await new Promise<string>((resolve) => {
      rl.question(chalk.bold('You: '), (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    console.log();

    // Check for exit commands
    if (userInput.toLowerCase() === 'cancel' || userInput.toLowerCase() === 'quit' || userInput.toLowerCase() === 'exit') {
      console.log(chalk.yellow('\n✗ Phase 0 cancelled by user\n'));
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
  console.log(chalk.red('\n✗ Conversation limit reached\n'));
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
export function quickValidation(goal: string): string[] {
  const warnings: string[] = [];
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
