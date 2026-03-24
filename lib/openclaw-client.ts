/**
 * OpenClaw Client -- Direct Anthropic API Functions
 *
 * These functions call the Anthropic API directly.
 * For gateway-routed calls, use agent-router.ts instead.
 *
 * The old gateway HTTP stubs (invokeGatewayTool, spawnSubagent) have been
 * replaced by the WebSocket-based gateway-client.ts.
 */

// [AUTO-ADDED] BUG-1-03: Default timeout for Anthropic API calls.
// Prevents hung fetches from blocking the heartbeat/building loop indefinitely.
// Configurable via ANTHROPIC_TIMEOUT_MS env var (default 120s).
const DEFAULT_TIMEOUT_MS = parseInt(process.env.ANTHROPIC_TIMEOUT_MS || '120000', 10);

/**
 * Call Claude API with system prompt and user message
 */
export async function callClaudeWithSystem(params: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/\s+/g, '');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: params.model || 'claude-sonnet-4-5-20250929',
        max_tokens: params.maxTokens || 4000,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.userMessage }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      const model = params.model || 'claude-sonnet-4-5-20250929';
      const systemLen = params.systemPrompt?.length ?? 0;
      const msgLen = params.userMessage?.length ?? 0;
      console.error(`[callClaudeWithSystem] API error ${res.status} | model=${model} systemLen=${systemLen} msgLen=${msgLen}`);
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    return data.content?.[0]?.text || '';
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call Claude API with system prompt, user message, and tool support
 */
export async function callClaudeWithTools(params: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  tools?: any[];
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/\s+/g, '');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const body: any = {
    model: params.model || 'claude-sonnet-4-5-20250929',
    max_tokens: params.maxTokens || 4000,
    system: params.systemPrompt,
    messages: [{ role: 'user', content: params.userMessage }],
  };

  if (params.tools && params.tools.length > 0) {
    body.tools = params.tools;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    return data.content?.[0]?.text || '';
  } finally {
    clearTimeout(timeoutId);
  }
}
