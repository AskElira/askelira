/**
 * OpenClaw Client — LLM Provider Abstraction
 *
 * Supports Anthropic (Claude) and MiniMax (OpenAI-compatible API).
 * Set LLM_PROVIDER=anthropic|minimax to switch.
 *
 * MiniMax endpoint: https://api.minimax.io/v1/text/chatcompletion_v2
 * Anthropic endpoint: https://api.anthropic.com/v1/messages
 */

const DEFAULT_TIMEOUT_MS = parseInt(process.env.ANTHROPIC_TIMEOUT_MS || '120000', 10);
const PROVIDER = process.env.LLM_PROVIDER || 'anthropic';

// ---------------------------------------------------------------------------
// Provider: MiniMax
// ---------------------------------------------------------------------------

async function callMiniMax(params: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY?.replace(/\s+/g, '');
  if (!apiKey) throw new Error('MINIMAX_API_KEY not set');

  const model = params.model || process.env.MINIMAX_MODEL || 'MiniMax-M2.7-highspeed';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxTokens || 4000,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userMessage },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`MiniMax API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    // MiniMax returns { choices: [{ messages: [{ content }] }] }
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callMiniMaxWithTools(params: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  tools?: any[];
}): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY?.replace(/\s+/g, '');
  if (!apiKey) throw new Error('MINIMAX_API_KEY not set');

  const model = params.model || process.env.MINIMAX_MODEL || 'MiniMax-M2.7-highspeed';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const messages = [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userMessage },
    ];

    const body: any = {
      model,
      max_tokens: params.maxTokens || 4000,
      messages,
    };

    if (params.tools && params.tools.length > 0) {
      // MiniMax tools format — map to their tool_use format
      body.tools = params.tools;
    }

    const res = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`MiniMax API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Provider: Anthropic
// ---------------------------------------------------------------------------

async function callAnthropic(params: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = (process.env.ANTHROPIC_API_KEY_V2 || process.env.ANTHROPIC_API_KEY)?.replace(/\s+/g, '');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY or ANTHROPIC_API_KEY_V2 not set');

  const model = params.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
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
        model,
        max_tokens: params.maxTokens || 4000,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.userMessage }],
      }),
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

async function callAnthropicWithTools(params: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  tools?: any[];
}): Promise<string> {
  const apiKey = (process.env.ANTHROPIC_API_KEY_V2 || process.env.ANTHROPIC_API_KEY)?.replace(/\s+/g, '');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY or ANTHROPIC_API_KEY_V2 not set');

  const model = params.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const body: any = {
    model,
    max_tokens: params.maxTokens || 4000,
    system: params.systemPrompt,
    messages: [{ role: 'user', content: params.userMessage }],
  };

  if (params.tools && params.tools.length > 0) {
    body.tools = params.tools;
  }

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

// ---------------------------------------------------------------------------
// Public API — delegates to the active provider
// ---------------------------------------------------------------------------

export async function callClaudeWithSystem(params: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  if (PROVIDER === 'minimax') {
    // MiniMax doesn't know Anthropic model names — omit model to use its default
    return callMiniMax({
      systemPrompt: params.systemPrompt,
      userMessage: params.userMessage,
      maxTokens: params.maxTokens,
    });
  }
  return callAnthropic(params);
}

export async function callClaudeWithTools(params: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  tools?: any[];
}): Promise<string> {
  if (PROVIDER === 'minimax') {
    // MiniMax doesn't know Anthropic model names — omit model to use its default
    return callMiniMaxWithTools({
      systemPrompt: params.systemPrompt,
      userMessage: params.userMessage,
      maxTokens: params.maxTokens,
      tools: params.tools,
    });
  }
  return callAnthropicWithTools(params);
}

export { PROVIDER };
