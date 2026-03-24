// Quick test of Phase 0 API call
const Anthropic = require('@anthropic-ai/sdk');

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY not set');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });

const PHASE_ZERO_SYSTEM_PROMPT = `You are OpenClaw, AskElira's business planning consultant.

Your role is to have a thoughtful conversation with the user about their automation goal BEFORE any technical work begins.

Ask one clarifying question about their goal.`;

async function test() {
  try {
    console.log('Testing Anthropic API call...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: PHASE_ZERO_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: 'I want to build this automation: "find hair salons and email them about our products"',
        },
      ],
    });

    console.log('Success!');
    console.log('Response:', response.content[0].text);
  } catch (err) {
    console.error('Error:', err.status, JSON.stringify(err.error || err.message));
  }
}

test();
