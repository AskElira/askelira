"use strict";
/**
 * AgentMail Configuration
 * Default email provider for AskElira automations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentMailConfig = getAgentMailConfig;
exports.saveAgentMailConfig = saveAgentMailConfig;
exports.isAgentMailConfigured = isAgentMailConfigured;
exports.getAgentMailCredentials = getAgentMailCredentials;
exports.generateAgentMailEnv = generateAgentMailEnv;
exports.getDefaultEmailProvider = getDefaultEmailProvider;
exports.getEmailProviderInstructions = getEmailProviderInstructions;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const CONFIG_DIR = (0, path_1.join)((0, os_1.homedir)(), '.askelira');
const CONFIG_FILE = (0, path_1.join)(CONFIG_DIR, 'config.json');
/**
 * Get AgentMail configuration from config file
 */
function getAgentMailConfig() {
    try {
        if (!(0, fs_1.existsSync)(CONFIG_FILE)) {
            return null;
        }
        const config = JSON.parse((0, fs_1.readFileSync)(CONFIG_FILE, 'utf-8'));
        return config.agentmail || null;
    }
    catch {
        return null;
    }
}
/**
 * Save AgentMail configuration to config file
 */
function saveAgentMailConfig(agentMailConfig) {
    try {
        const { mkdirSync } = require('fs');
        // Create .askelira directory if needed
        if (!(0, fs_1.existsSync)(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true });
        }
        // Load existing config
        let config = {};
        if ((0, fs_1.existsSync)(CONFIG_FILE)) {
            config = JSON.parse((0, fs_1.readFileSync)(CONFIG_FILE, 'utf-8'));
        }
        // Update agentmail section
        config.agentmail = agentMailConfig;
        // Write back
        (0, fs_1.writeFileSync)(CONFIG_FILE, JSON.stringify(config, null, 2));
        // Also set environment variables for current session
        process.env.AGENTMAIL_API_KEY = agentMailConfig.apiKey;
        process.env.AGENTMAIL_FROM_EMAIL = agentMailConfig.fromEmail;
        if (agentMailConfig.fromName) {
            process.env.AGENTMAIL_FROM_NAME = agentMailConfig.fromName;
        }
    }
    catch (error) {
        throw new Error(`Failed to save AgentMail config: ${error.message}`);
    }
}
/**
 * Check if AgentMail is configured
 */
function isAgentMailConfigured() {
    // Check environment variables first
    if (process.env.AGENTMAIL_API_KEY && process.env.AGENTMAIL_FROM_EMAIL) {
        return true;
    }
    // Check config file
    const config = getAgentMailConfig();
    return config !== null && !!config.apiKey && !!config.fromEmail;
}
/**
 * Get AgentMail credentials (from env or config file)
 */
function getAgentMailCredentials() {
    // Env vars take precedence
    if (process.env.AGENTMAIL_API_KEY && process.env.AGENTMAIL_FROM_EMAIL) {
        return {
            apiKey: process.env.AGENTMAIL_API_KEY,
            fromEmail: process.env.AGENTMAIL_FROM_EMAIL,
            fromName: process.env.AGENTMAIL_FROM_NAME,
            webhookUrl: process.env.AGENTMAIL_WEBHOOK_URL,
        };
    }
    // Fall back to config file
    return getAgentMailConfig();
}
/**
 * Generate .env entries for AgentMail
 */
function generateAgentMailEnv(config) {
    const lines = [
        '# AgentMail Configuration',
        `AGENTMAIL_API_KEY=${config.apiKey}`,
        `AGENTMAIL_FROM_EMAIL=${config.fromEmail}`,
    ];
    if (config.fromName) {
        lines.push(`AGENTMAIL_FROM_NAME=${config.fromName}`);
    }
    if (config.webhookUrl) {
        lines.push(`AGENTMAIL_WEBHOOK_URL=${config.webhookUrl}`);
    }
    return lines.join('\n');
}
/**
 * Get default email provider name for Alba/Elira recommendations
 */
function getDefaultEmailProvider() {
    if (isAgentMailConfigured()) {
        return 'AgentMail';
    }
    // Fallback options
    if (process.env.SENDGRID_API_KEY) {
        return 'SendGrid';
    }
    if (process.env.SMTP_SERVER) {
        return 'SMTP';
    }
    return 'AgentMail'; // Default to AgentMail even if not configured
}
/**
 * Email provider instructions for Alba/Elira
 */
function getEmailProviderInstructions() {
    const provider = getDefaultEmailProvider();
    if (provider === 'AgentMail') {
        return `Use AgentMail as the email provider. Import the agentmail library and use:

\`\`\`python
import os
from agentmail import AgentMail

# Initialize AgentMail
mailer = AgentMail(
    api_key=os.getenv('AGENTMAIL_API_KEY'),
    from_email=os.getenv('AGENTMAIL_FROM_EMAIL'),
    from_name=os.getenv('AGENTMAIL_FROM_NAME', 'AskElira')
)

# Send email
mailer.send(
    to='recipient@example.com',
    subject='Subject',
    body='Email body text',
    html='<p>HTML version</p>'  # Optional
)
\`\`\`

Required dependencies: agentmail
Required env vars: AGENTMAIL_API_KEY, AGENTMAIL_FROM_EMAIL, AGENTMAIL_FROM_NAME (optional)`;
    }
    if (provider === 'SendGrid') {
        return `Use SendGrid as the email provider. Import the sendgrid library and use the SendGrid API v3.`;
    }
    return `Use SMTP for email sending. Use smtplib and email.mime modules.`;
}
//# sourceMappingURL=agentmail-config.js.map