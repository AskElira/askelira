/**
 * AgentMail Configuration
 * Default email provider for AskElira automations
 */
export interface AgentMailConfig {
    apiKey: string;
    fromEmail: string;
    fromName?: string;
    webhookUrl?: string;
}
/**
 * Get AgentMail configuration from config file
 */
export declare function getAgentMailConfig(): AgentMailConfig | null;
/**
 * Save AgentMail configuration to config file
 */
export declare function saveAgentMailConfig(agentMailConfig: AgentMailConfig): void;
/**
 * Check if AgentMail is configured
 */
export declare function isAgentMailConfigured(): boolean;
/**
 * Get AgentMail credentials (from env or config file)
 */
export declare function getAgentMailCredentials(): AgentMailConfig | null;
/**
 * Generate .env entries for AgentMail
 */
export declare function generateAgentMailEnv(config: AgentMailConfig): string;
/**
 * Get default email provider name for Alba/Elira recommendations
 */
export declare function getDefaultEmailProvider(): string;
/**
 * Email provider instructions for Alba/Elira
 */
export declare function getEmailProviderInstructions(): string;
