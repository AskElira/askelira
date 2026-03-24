/**
 * Multi-LLM Provider Support for AskElira
 * Supports: Claude (Anthropic), OpenAI, Local models (Ollama)
 */
export type LLMProvider = 'anthropic' | 'openai' | 'ollama';
export interface LLMConfig {
    provider: LLMProvider;
    apiKey?: string;
    model: string;
    baseUrl?: string;
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
 * Universal LLM call function - works with any provider
 */
export declare function callLLM(config: LLMConfig, systemPrompt: string, userMessage: string, maxTokens?: number): Promise<LLMResponse>;
/**
 * Get default LLM config from environment
 */
export declare function getDefaultLLMConfig(): LLMConfig;
/**
 * Test if a provider is available and working
 */
export declare function testLLMProvider(config: LLMConfig): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Get available models for a provider
 */
export declare function getAvailableModels(provider: LLMProvider): string[];
