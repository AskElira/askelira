/**
 * Personal Context Gathering System
 * Collects user-specific context for personalized research and building
 */

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/**
 * User's onboarding configuration
 */
export interface UserConfig {
  llm?: {
    provider: 'anthropic' | 'openai' | 'ollama';
    model: string;
    apiKey?: string; // Not included in context for privacy
    baseUrl?: string;
  };
  agentmail?: {
    apiKey?: string; // Not included in context for privacy
    fromEmail: string;
    fromName?: string;
  };
  braveSearchApiKey?: string; // Not included in context for privacy
  setupDate?: string;
}

/**
 * User preferences extracted from config and usage
 */
export interface UserPreferences {
  language: string; // Programming language preference
  timezone: string;
  emailProvider: string; // 'agentmail', 'sendgrid', 'smtp'
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
  commonPatterns: string[]; // e.g., ['email automation', 'web scraping', 'scheduling']
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

const CONFIG_DIR = join(homedir(), '.askelira');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// In-memory cache
const contextCache = new Map<string, { context: PersonalContext; timestamp: number }>();
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get complete personal context for a user
 */
export async function getPersonalContext(userId: string): Promise<PersonalContext> {
  // Check cache first
  const cached = contextCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
    console.log(`[PersonalContext] Cache hit for user: ${userId}`);
    return { ...cached.context, metadata: { ...cached.context.metadata, cached: true } };
  }

  console.log(`[PersonalContext] Gathering context for user: ${userId}`);

  // Gather all context components
  const config = getUserConfig(userId);
  const preferences = getUserPreferences(userId, config);
  const history = await getUserHistory(userId);
  const apiKeys = getUserAPIKeys(userId, config);

  const context: PersonalContext = {
    userId,
    preferences,
    history,
    apiKeys,
    metadata: {
      timestamp: Date.now(),
      configPath: CONFIG_FILE,
      cached: false,
    },
  };

  // Cache the context
  contextCache.set(userId, { context, timestamp: Date.now() });

  return context;
}

/**
 * Load user's onboarding config from ~/.askelira/config.json
 */
export function getUserConfig(userId: string): UserConfig {
  try {
    if (!existsSync(CONFIG_FILE)) {
      console.warn(`[PersonalContext] Config file not found: ${CONFIG_FILE}`);
      return {};
    }

    const configData = readFileSync(CONFIG_FILE, 'utf-8');
    const config: UserConfig = JSON.parse(configData);

    console.log(`[PersonalContext] Config loaded: ${Object.keys(config).join(', ')}`);
    return config;
  } catch (error: any) {
    console.error(`[PersonalContext] Failed to load config:`, error.message);
    return {};
  }
}

/**
 * Extract user preferences from config and usage patterns
 */
export function getUserPreferences(userId: string, config: UserConfig): UserPreferences {
  return {
    language: detectPreferredLanguage(config),
    timezone: detectTimezone(),
    emailProvider: detectEmailProvider(config),
    llmProvider: config.llm?.provider || 'unknown',
    hasWebSearch: !!config.braveSearchApiKey,
  };
}

/**
 * Fetch user's build history from database
 */
// [AUTO-ADDED] BUG-1-04: Singleton PrismaClient to prevent connection pool exhaustion.
// Creating a new PrismaClient per call causes connection churn on Neon Postgres.
let _prismaInstance: any = null;
function getPrismaClient(): any {
  if (!_prismaInstance) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const prismaModule = require('@prisma/client');
      if (prismaModule?.PrismaClient) {
        _prismaInstance = new prismaModule.PrismaClient();
      }
    } catch {
      // Prisma not available in this context
    }
  }
  return _prismaInstance;
}

export async function getUserHistory(userId: string): Promise<UserHistory> {
  try {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error('Prisma not available in this context');
    }

    // Fetch user's goals
    const goals = await prisma.goal.findMany({
      where: {
        customerId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        floors: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const totalBuilds = goals.length;
    const successfulBuilds = goals.filter((g: any) => g.status === 'goal_met').length;

    const recentBuilds = goals.slice(0, 5).map((g: any) => ({
      goalText: g.goalText,
      status: g.status,
      floorCount: g.floors?.length || 0,
      createdAt: g.createdAt.toISOString(),
      successRate: g.floors?.length
        ? g.floors.filter((f: any) => f.status === 'live').length / g.floors.length
        : undefined,
    }));

    // Extract common patterns from goal texts
    const commonPatterns = extractCommonPatterns(goals.map((g: any) => g.goalText));

    return {
      totalBuilds,
      successfulBuilds,
      recentBuilds,
      commonPatterns,
    };
  } catch (error: any) {
    console.error(`[PersonalContext] Failed to fetch history:`, error.message);

    // Return empty history if database fails
    return {
      totalBuilds: 0,
      successfulBuilds: 0,
      recentBuilds: [],
      commonPatterns: [],
    };
  }
}

/**
 * Detect which API keys the user has configured
 */
export function getUserAPIKeys(userId: string, config: UserConfig): UserAPIKeys {
  return {
    hasAgentMail: !!config.agentmail?.apiKey,
    hasBraveSearch: !!config.braveSearchApiKey,
    hasAnthropicKey: !!config.llm?.apiKey && config.llm.provider === 'anthropic',
    hasOpenAIKey: !!config.llm?.apiKey && config.llm.provider === 'openai',
    hasSendGrid: !!process.env.SENDGRID_API_KEY,
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
  };
}

/**
 * Clear context cache for a user
 */
export function clearContextCache(userId?: string): void {
  if (userId) {
    contextCache.delete(userId);
    console.log(`[PersonalContext] Cache cleared for user: ${userId}`);
  } else {
    contextCache.clear();
    console.log(`[PersonalContext] Cache cleared for all users`);
  }
}

/**
 * Helper: Detect user's preferred programming language
 */
function detectPreferredLanguage(config: UserConfig): string {
  // Default to Python if AgentMail is configured (email automations)
  if (config.agentmail) {
    return 'python';
  }

  // Could be enhanced to check past builds
  return 'python'; // Default
}

/**
 * Helper: Detect user's timezone
 */
function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Helper: Detect user's email provider preference
 */
function detectEmailProvider(config: UserConfig): string {
  if (config.agentmail) {
    return 'agentmail';
  }
  if (process.env.SENDGRID_API_KEY) {
    return 'sendgrid';
  }
  if (process.env.SMTP_SERVER) {
    return 'smtp';
  }
  return 'none';
}

/**
 * Helper: Extract common patterns from goal texts
 */
function extractCommonPatterns(goalTexts: string[]): string[] {
  const keywords = [
    'email',
    'automation',
    'scrape',
    'scraping',
    'api',
    'schedule',
    'daily',
    'github',
    'database',
    'monitoring',
    'notification',
    'alert',
  ];

  const patternCounts = new Map<string, number>();

  goalTexts.forEach((text) => {
    const lowerText = text.toLowerCase();
    keywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        patternCounts.set(keyword, (patternCounts.get(keyword) || 0) + 1);
      }
    });
  });

  // Return top 3 patterns
  return Array.from(patternCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);
}
