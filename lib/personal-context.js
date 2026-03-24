"use strict";
/**
 * Personal Context Gathering System
 * Collects user-specific context for personalized research and building
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPersonalContext = getPersonalContext;
exports.getUserConfig = getUserConfig;
exports.getUserPreferences = getUserPreferences;
exports.getUserHistory = getUserHistory;
exports.getUserAPIKeys = getUserAPIKeys;
exports.clearContextCache = clearContextCache;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const CONFIG_DIR = (0, path_1.join)((0, os_1.homedir)(), '.askelira');
const CONFIG_FILE = (0, path_1.join)(CONFIG_DIR, 'config.json');
// In-memory cache
const contextCache = new Map();
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
/**
 * Get complete personal context for a user
 */
async function getPersonalContext(userId) {
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
    const context = {
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
function getUserConfig(userId) {
    try {
        if (!(0, fs_1.existsSync)(CONFIG_FILE)) {
            console.warn(`[PersonalContext] Config file not found: ${CONFIG_FILE}`);
            return {};
        }
        const configData = (0, fs_1.readFileSync)(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(configData);
        console.log(`[PersonalContext] Config loaded: ${Object.keys(config).join(', ')}`);
        return config;
    }
    catch (error) {
        console.error(`[PersonalContext] Failed to load config:`, error.message);
        return {};
    }
}
/**
 * Extract user preferences from config and usage patterns
 */
function getUserPreferences(userId, config) {
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
async function getUserHistory(userId) {
    try {
        // Import Prisma dynamically to avoid circular dependencies
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
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
        await prisma.$disconnect();
        const totalBuilds = goals.length;
        const successfulBuilds = goals.filter((g) => g.status === 'goal_met').length;
        const recentBuilds = goals.slice(0, 5).map((g) => ({
            goalText: g.goalText,
            status: g.status,
            floorCount: g.floors?.length || 0,
            createdAt: g.createdAt.toISOString(),
            successRate: g.floors?.length
                ? g.floors.filter((f) => f.status === 'live').length / g.floors.length
                : undefined,
        }));
        // Extract common patterns from goal texts
        const commonPatterns = extractCommonPatterns(goals.map((g) => g.goalText));
        return {
            totalBuilds,
            successfulBuilds,
            recentBuilds,
            commonPatterns,
        };
    }
    catch (error) {
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
function getUserAPIKeys(userId, config) {
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
function clearContextCache(userId) {
    if (userId) {
        contextCache.delete(userId);
        console.log(`[PersonalContext] Cache cleared for user: ${userId}`);
    }
    else {
        contextCache.clear();
        console.log(`[PersonalContext] Cache cleared for all users`);
    }
}
/**
 * Helper: Detect user's preferred programming language
 */
function detectPreferredLanguage(config) {
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
function detectTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    catch {
        return 'UTC';
    }
}
/**
 * Helper: Detect user's email provider preference
 */
function detectEmailProvider(config) {
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
function extractCommonPatterns(goalTexts) {
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
    const patternCounts = new Map();
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
//# sourceMappingURL=personal-context.js.map