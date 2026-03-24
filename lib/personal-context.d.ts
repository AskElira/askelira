/**
 * Personal Context Gathering System
 * Collects user-specific context for personalized research and building
 */
/**
 * User's onboarding configuration
 */
export interface UserConfig {
    llm?: {
        provider: 'anthropic' | 'openai' | 'ollama';
        model: string;
        apiKey?: string;
        baseUrl?: string;
    };
    agentmail?: {
        apiKey?: string;
        fromEmail: string;
        fromName?: string;
    };
    braveSearchApiKey?: string;
    setupDate?: string;
}
/**
 * User preferences extracted from config and usage
 */
export interface UserPreferences {
    language: string;
    timezone: string;
    emailProvider: string;
    llmProvider: string;
    hasWebSearch: boolean;
}
/**
 * User's build history
 */
export interface UserHistory {
    totalBuilds: number;
    successfulBuilds: number;
    recentBuilds: Array<{
        goalText: string;
        status: string;
        floorCount: number;
        createdAt: string;
        successRate?: number;
    }>;
    commonPatterns: string[];
}
/**
 * API keys the user has configured (boolean flags only, no actual keys)
 */
export interface UserAPIKeys {
    hasAgentMail: boolean;
    hasBraveSearch: boolean;
    hasAnthropicKey: boolean;
    hasOpenAIKey: boolean;
    hasSendGrid: boolean;
    hasStripe: boolean;
}
/**
 * Complete personal context for a user
 */
export interface PersonalContext {
    userId: string;
    preferences: UserPreferences;
    history: UserHistory;
    apiKeys: UserAPIKeys;
    metadata: {
        timestamp: number;
        configPath: string;
        cached: boolean;
    };
}
/**
 * Get complete personal context for a user
 */
export declare function getPersonalContext(userId: string): Promise<PersonalContext>;
/**
 * Load user's onboarding config from ~/.askelira/config.json
 */
export declare function getUserConfig(userId: string): UserConfig;
/**
 * Extract user preferences from config and usage patterns
 */
export declare function getUserPreferences(userId: string, config: UserConfig): UserPreferences;
/**
 * Fetch user's build history from database
 */
export declare function getUserHistory(userId: string): Promise<UserHistory>;
/**
 * Detect which API keys the user has configured
 */
export declare function getUserAPIKeys(userId: string, config: UserConfig): UserAPIKeys;
/**
 * Clear context cache for a user
 */
export declare function clearContextCache(userId?: string): void;
