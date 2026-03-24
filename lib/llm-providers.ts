/**
 * Multi-LLM Provider Support for AskElira
 * Supports: Claude (Anthropic), OpenAI, Local models (Ollama)
 */

export type LLMProvider = 'anthropic' | 'openai' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string; // Not needed for Ollama
  model: string;
  baseUrl?: string; // For Ollama or custom endpoints
}

export interface LLMResponse {
  text: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  cost?: number;
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(config: LLMConfig, systemPrompt: string, userMessage: string, maxTokens: number): Promise<LLMResponse> {
  if (!config.apiKey) {
    throw new Error('Anthropic API key required');
  }

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({ apiKey: config.apiKey });

  const response = await anthropic.messages.create({
    model: config.model || 'claude-sonnet-4-5-20250929',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  // Claude Sonnet 4.5 pricing (as of March 2026)
  const inputCost = inputTokens * 0.000003; // $3 per million
  const outputCost = outputTokens * 0.000015; // $15 per million

  return {
    text,
    usage: { inputTokens, outputTokens },
    cost: inputCost + outputCost,
  };
}

/**
 * Call OpenAI API (GPT-4, GPT-4o, etc.)
 */
async function callOpenAI(config: LLMConfig, systemPrompt: string, userMessage: string, maxTokens: number): Promise<LLMResponse> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key required');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json() as any;

  const text = data.choices?.[0]?.message?.content || '';
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;

  // GPT-4o pricing (as of March 2026)
  const inputCost = inputTokens * 0.0000025; // $2.50 per million
  const outputCost = outputTokens * 0.00001; // $10 per million

  return {
    text,
    usage: { inputTokens, outputTokens },
    cost: inputCost + outputCost,
  };
}

/**
 * Call Ollama (local models)
 */
async function callOllama(config: LLMConfig, systemPrompt: string, userMessage: string, maxTokens: number): Promise<LLMResponse> {
  const baseUrl = config.baseUrl || 'http://localhost:11434';

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model || 'llama3',
      prompt: `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = await response.json() as any;

  return {
    text: data.response || '',
    usage: {
      inputTokens: 0, // Ollama doesn't report this
      outputTokens: 0,
    },
    cost: 0, // Free (local)
  };
}

/**
 * Universal LLM call function - works with any provider
 */
export async function callLLM(
  config: LLMConfig,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 4096
): Promise<LLMResponse> {
  switch (config.provider) {
    case 'anthropic':
      return await callAnthropic(config, systemPrompt, userMessage, maxTokens);
    case 'openai':
      return await callOpenAI(config, systemPrompt, userMessage, maxTokens);
    case 'ollama':
      return await callOllama(config, systemPrompt, userMessage, maxTokens);
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

/**
 * Get default LLM config from environment
 */
export function getDefaultLLMConfig(): LLMConfig {
  // Check for Anthropic (Claude)
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-sonnet-4-5-20250929',
    };
  }

  // Check for OpenAI
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o',
    };
  }

  // Default to Ollama (local, no API key needed)
  return {
    provider: 'ollama',
    model: 'llama3',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  };
}

/**
 * Test if a provider is available and working
 */
export async function testLLMProvider(config: LLMConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await callLLM(
      config,
      'You are a helpful assistant.',
      'Say "OK" if you can hear me.',
      50
    );

    if (response.text && response.text.length > 0) {
      return { success: true };
    }

    return { success: false, error: 'Empty response from provider' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider: LLMProvider): string[] {
  switch (provider) {
    case 'anthropic':
      return [
        'claude-sonnet-4-5-20250929',
        'claude-opus-4-5',
        'claude-haiku-4-5-20251001',
      ];
    case 'openai':
      return [
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
      ];
    case 'ollama':
      return [
        'llama3',
        'llama3:70b',
        'mistral',
        'mixtral',
        'codellama',
      ];
    default:
      return [];
  }
}
