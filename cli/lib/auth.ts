// ============================================================
// AskElira CLI — Auth / Config Store
// ============================================================
// Uses 'conf' to persist credentials at ~/.askelira/config.json

import Conf from 'conf';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.askelira');

const config = new Conf({
  projectName: 'askelira',
  cwd: CONFIG_DIR,
  configName: 'config',
  defaults: {
    apiKey: '',
    email: '',
    customerId: '',
    baseUrl: 'https://askelira-bundled-npm.vercel.app',
  },
});

/**
 * Get the stored API key.
 */
export function getApiKey(): string {
  return config.get('apiKey') as string;
}

/**
 * Get the LLM (Anthropic) API key from config.
 * Reads from config key 'llm.apiKey', falling back to ANTHROPIC_API_KEY env var.
 * This is distinct from getApiKey() which returns the AskElira platform key.
 */
export function getLLMApiKey(): string {
  const configKey = config.get('llm.apiKey') as string | undefined;
  if (configKey && configKey.length > 0) {
    return configKey;
  }
  return process.env.ANTHROPIC_API_KEY || '';
}

/**
 * Get the stored customer ID.
 */
export function getCustomerId(): string {
  return config.get('customerId') as string;
}

/**
 * Get the stored email.
 */
export function getEmail(): string {
  return config.get('email') as string;
}

/**
 * Get the base URL for the AskElira API.
 * Defaults to https://askelira-bundled-npm.vercel.app
 */
export function getBaseUrl(): string {
  return (config.get('baseUrl') as string) || 'https://askelira-bundled-npm.vercel.app';
}

/**
 * Set a config value.
 */
export function set(key: string, value: string): void {
  config.set(key, value);
}

/**
 * Set multiple config values at once.
 */
export function setAll(values: Record<string, string>): void {
  for (const [key, value] of Object.entries(values)) {
    config.set(key, value);
  }
}

/**
 * Check if the user is authenticated (has an API key and customer ID).
 */
export function isAuthenticated(): boolean {
  const key = getApiKey();
  const id = getCustomerId();
  return Boolean(key && key.length > 0 && id && id.length > 0);
}

/**
 * Clear all stored credentials.
 */
export function logout(): void {
  config.set('apiKey', '');
  config.set('email', '');
  config.set('customerId', '');
}

/**
 * Get the full path to the config file.
 */
export function getConfigPath(): string {
  return config.path;
}

// ============================================================
// Gateway config
// ============================================================

/**
 * Get the OpenClaw gateway WebSocket URL.
 */
export function getGatewayUrl(): string {
  const configVal = config.get('gateway.url') as string | undefined;
  if (configVal && configVal.length > 0) return configVal;
  return process.env.OPENCLAW_GATEWAY_URL || '';
}

/**
 * Get the OpenClaw gateway auth token.
 */
export function getGatewayToken(): string {
  const configVal = config.get('gateway.token') as string | undefined;
  if (configVal && configVal.length > 0) return configVal;
  return process.env.OPENCLAW_GATEWAY_TOKEN || '';
}

/**
 * Get the agent routing mode.
 */
export function getGatewayMode(): 'gateway' | 'direct' | 'gateway-only' {
  const configVal = config.get('gateway.mode') as string | undefined;
  if (configVal === 'direct' || configVal === 'gateway-only' || configVal === 'gateway') {
    return configVal;
  }
  const envVal = process.env.AGENT_ROUTING_MODE;
  if (envVal === 'direct' || envVal === 'gateway-only' || envVal === 'gateway') {
    return envVal;
  }
  return 'gateway';
}

// ============================================================
// Search config
// ============================================================

/**
 * Get the configured search provider.
 */
export function getSearchProvider(): 'brave' | 'tavily' | 'perplexity' | 'auto' {
  const configVal = config.get('search.provider') as string | undefined;
  if (configVal === 'brave' || configVal === 'tavily' || configVal === 'perplexity' || configVal === 'auto') {
    return configVal;
  }
  const envVal = process.env.SEARCH_PROVIDER;
  if (envVal === 'brave' || envVal === 'tavily' || envVal === 'perplexity' || envVal === 'auto') {
    return envVal;
  }
  return 'auto';
}

/**
 * Get the API key for a specific search provider.
 */
export function getSearchApiKey(provider: 'brave' | 'tavily'): string {
  if (provider === 'tavily') {
    const configVal = config.get('search.tavilyApiKey') as string | undefined;
    if (configVal && configVal.length > 0) return configVal;
    return process.env.TAVILY_API_KEY || '';
  }
  if (provider === 'brave') {
    const configVal = config.get('search.braveApiKey') as string | undefined;
    if (configVal && configVal.length > 0) return configVal;
    return process.env.BRAVE_SEARCH_API_KEY || '';
  }
  return '';
}
