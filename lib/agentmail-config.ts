/**
 * AgentMail Configuration
 * Default email provider for AskElira automations
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.askelira');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface AgentMailConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  webhookUrl?: string;
}

/**
 * Get AgentMail configuration from config file
 */
export function getAgentMailConfig(): AgentMailConfig | null {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return null;
    }

    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    return config.agentmail || null;
  } catch {
    return null;
  }
}

/**
 * Save AgentMail configuration to config file
 */
export function saveAgentMailConfig(agentMailConfig: AgentMailConfig): void {
  try {
    const { mkdirSync } = require('fs');

    // Create .askelira directory if needed
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Load existing config
    let config: any = {};
    if (existsSync(CONFIG_FILE)) {
      config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    }

    // Update agentmail section
    config.agentmail = agentMailConfig;

    // Write back
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    // Also set environment variables for current session
    process.env.AGENTMAIL_API_KEY = agentMailConfig.apiKey;
    process.env.AGENTMAIL_FROM_EMAIL = agentMailConfig.fromEmail;
    if (agentMailConfig.fromName) {
      process.env.AGENTMAIL_FROM_NAME = agentMailConfig.fromName;
    }
  } catch (error: any) {
    throw new Error(`Failed to save AgentMail config: ${error.message}`);
  }
}

/**
 * Check if AgentMail is configured
 */
export function isAgentMailConfigured(): boolean {
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
export function getAgentMailCredentials(): AgentMailConfig | null {
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
export function generateAgentMailEnv(config: AgentMailConfig): string {
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
export function getDefaultEmailProvider(): string {
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
export function getEmailProviderInstructions(): string {
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
