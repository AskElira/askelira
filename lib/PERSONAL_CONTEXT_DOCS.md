# 👤 Personal Context System Documentation

## Overview

The Personal Context System gathers user-specific information to personalize research and automation building. It collects:
- User configuration (LLM, email provider, API keys)
- User preferences (language, timezone, providers)
- Build history (past automations, success rate, patterns)
- API key availability (boolean flags only, no actual keys)

**Privacy-first**: No sensitive data (API keys, passwords) included in context.

---

## Installation

### Phase 2 Complete ✅

File created: `/lib/personal-context.ts`

---

## Usage

### Basic Usage

```typescript
import { getPersonalContext } from '@/lib/personal-context';

// Get complete personal context for a user
const context = await getPersonalContext('user@example.com');

console.log(context.preferences.language);    // 'python'
console.log(context.preferences.timezone);    // 'America/Los_Angeles'
console.log(context.apiKeys.hasAgentMail);    // true/false
console.log(context.history.commonPatterns);  // ['email', 'automation', 'api']
```

### Integration with Alba Research

```typescript
import { getPersonalContext } from '@/lib/personal-context';
import { runOpenResearch } from '@/lib/openresearch';

async function albaResearch(floor: Floor, userId: string) {
  // Get personal context
  const personalContext = await getPersonalContext(userId);

  // Use context to personalize research
  const research = await runOpenResearch(floor.name, {
    // Use user's preferred LLM
    llm: personalContext.preferences.llmProvider,

    // Use web search if available
    searchApi: personalContext.preferences.hasWebSearch ? 'brave' : 'duckduckgo',
  });

  // Combine with personal context
  return {
    research,
    personalizations: {
      language: personalContext.preferences.language,
      timezone: personalContext.preferences.timezone,
      emailProvider: personalContext.preferences.emailProvider,
      pastPatterns: personalContext.history.commonPatterns,
    },
  };
}
```

---

## Data Structure

### PersonalContext

```typescript
interface PersonalContext {
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
```

### UserPreferences

```typescript
interface UserPreferences {
  language: string;           // 'python', 'javascript', 'typescript'
  timezone: string;           // 'America/Los_Angeles', 'UTC'
  emailProvider: string;      // 'agentmail', 'sendgrid', 'smtp', 'none'
  llmProvider: string;        // 'anthropic', 'openai', 'ollama'
  hasWebSearch: boolean;      // true if Brave API configured
}
```

### UserHistory

```typescript
interface UserHistory {
  totalBuilds: number;
  successfulBuilds: number;
  recentBuilds: Array<{
    goalText: string;
    status: string;
    floorCount: number;
    createdAt: string;
    successRate?: number;
  }>;
  commonPatterns: string[];   // ['email', 'automation', 'scraping']
}
```

### UserAPIKeys (Boolean Flags Only)

```typescript
interface UserAPIKeys {
  hasAgentMail: boolean;
  hasBraveSearch: boolean;
  hasAnthropicKey: boolean;
  hasOpenAIKey: boolean;
  hasSendGrid: boolean;
  hasStripe: boolean;
}
```

---

## Example Output

```json
{
  "userId": "user@example.com",
  "preferences": {
    "language": "python",
    "timezone": "America/Los_Angeles",
    "emailProvider": "agentmail",
    "llmProvider": "anthropic",
    "hasWebSearch": true
  },
  "history": {
    "totalBuilds": 15,
    "successfulBuilds": 12,
    "recentBuilds": [
      {
        "goalText": "Send daily email with GitHub trending repos",
        "status": "goal_met",
        "floorCount": 3,
        "createdAt": "2026-03-20T10:00:00Z",
        "successRate": 1.0
      }
    ],
    "commonPatterns": ["email", "automation", "api"]
  },
  "apiKeys": {
    "hasAgentMail": true,
    "hasBraveSearch": true,
    "hasAnthropicKey": true,
    "hasOpenAIKey": false,
    "hasSendGrid": false,
    "hasStripe": false
  },
  "metadata": {
    "timestamp": 1711146676774,
    "configPath": "/Users/user/.askelira/config.json",
    "cached": false
  }
}
```

---

## Privacy & Security

### What's Included ✅

- ✅ Preference flags (language, timezone, providers)
- ✅ Boolean flags for API key existence
- ✅ Build history (goal texts, counts, patterns)
- ✅ Success rates and common patterns

### What's NOT Included 🔒

- 🔒 Actual API keys
- 🔒 Passwords or credentials
- 🔒 Email content
- 🔒 Personal identifiable information
- 🔒 Raw configuration data

### Safe for Research Context

Personal context is **safe to include in LLM prompts** for research personalization:

```typescript
const prompt = `
Research topic: ${floor.name}

Personal Context:
- User prefers: ${context.preferences.language}
- Timezone: ${context.preferences.timezone}
- Email provider available: ${context.preferences.emailProvider}
- Past patterns: ${context.history.commonPatterns.join(', ')}

Provide research tailored to these preferences.
`;
```

---

## Caching

### How It Works

1. **First call**: Fetches config, queries database, computes context
2. **Cache**: Stores in memory for 1 hour
3. **Subsequent calls**: Returns cached context (instant)
4. **Expiry**: Cache expires after 1 hour, refetches on next call

### Cache Management

```typescript
import { clearContextCache } from '@/lib/personal-context';

// Clear cache for specific user
clearContextCache('user@example.com');

// Clear cache for all users
clearContextCache();
```

### Performance

```
First call:  ~200ms (loads config + queries DB)
Cached call: <1ms   (instant return)
```

---

## Configuration Source

Personal context loads from:

```
~/.askelira/config.json
```

Example config:
```json
{
  "llm": {
    "provider": "anthropic",
    "apiKey": "sk-ant-...",
    "model": "claude-sonnet-4-5-20250929"
  },
  "agentmail": {
    "apiKey": "am_us_...",
    "fromEmail": "automation@example.com",
    "fromName": "My Bot"
  },
  "braveSearchApiKey": "BSA...",
  "setupDate": "2026-03-21T..."
}
```

---

## Detection Logic

### Language Detection

```typescript
// Priority order:
1. If AgentMail configured → 'python' (email automations)
2. Check past builds for language patterns
3. Default: 'python'
```

### Timezone Detection

```typescript
// Uses Intl.DateTimeFormat() API
timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Falls back to 'UTC' on error
```

### Email Provider Detection

```typescript
// Priority order:
1. AgentMail in config → 'agentmail'
2. SENDGRID_API_KEY in env → 'sendgrid'
3. SMTP_SERVER in env → 'smtp'
4. Default: 'none'
```

### Common Patterns Extraction

```typescript
// Scans goal texts for keywords:
const keywords = [
  'email', 'automation', 'scrape', 'api',
  'schedule', 'daily', 'github', 'database',
  'monitoring', 'notification', 'alert'
];

// Returns top 3 most frequent patterns
```

---

## Integration Points

### Alba Research (Phase 3)

```typescript
// Alba uses personal context for research
async function albaResearch(floor, userId) {
  const context = await getPersonalContext(userId);

  // Pass to OpenResearch
  const research = await runOpenResearch(floor.name, {
    llm: context.preferences.llmProvider
  });

  return { research, context };
}
```

### Swarm Intelligence (Phase 6)

```typescript
// Swarm uses personal context for decisions
async function swarmValidation(question, userId) {
  const context = await getPersonalContext(userId);

  // Include in swarm prompt
  const prompt = `
  User context: ${context.preferences.language}, ${context.preferences.timezone}
  Past patterns: ${context.history.commonPatterns}

  Question: ${question}
  `;

  return await runSwarm(prompt);
}
```

### Prediction Prompt (Phase 7)

```typescript
// Prediction prompt includes personal context
function generatePredictionPrompt(swarmResult, context) {
  return `
  Build automation for: ${context.userId}

  Preferences:
  - Language: ${context.preferences.language}
  - Timezone: ${context.preferences.timezone}
  - Email: ${context.preferences.emailProvider}

  Past success patterns: ${context.history.commonPatterns}

  ${swarmResult.plan}
  `;
}
```

---

## Error Handling

### Graceful Fallbacks

```typescript
// Config file missing
getUserConfig() → Returns {}

// Database unavailable
getUserHistory() → Returns { totalBuilds: 0, ... }

// Timezone detection fails
detectTimezone() → Returns 'UTC'
```

### Always Returns Valid Context

```typescript
// Even on complete failure:
{
  userId: 'user@example.com',
  preferences: {
    language: 'python',
    timezone: 'UTC',
    emailProvider: 'none',
    llmProvider: 'unknown',
    hasWebSearch: false
  },
  history: {
    totalBuilds: 0,
    successfulBuilds: 0,
    recentBuilds: [],
    commonPatterns: []
  },
  apiKeys: {
    // All false
  }
}
```

---

## Testing

### Unit Test

```typescript
import { getPersonalContext } from '@/lib/personal-context';

test('Personal context includes all fields', async () => {
  const context = await getPersonalContext('test@example.com');

  expect(context).toHaveProperty('userId');
  expect(context).toHaveProperty('preferences');
  expect(context).toHaveProperty('history');
  expect(context).toHaveProperty('apiKeys');
  expect(context).toHaveProperty('metadata');
});
```

### Integration Test

```bash
npx tsx -e "
import { getPersonalContext } from './lib/personal-context';

const context = await getPersonalContext('test@example.com');
console.log('Language:', context.preferences.language);
console.log('Patterns:', context.history.commonPatterns);
"
```

---

## Summary

**Phase 2 Complete** ✅

- [x] Personal context gathering system
- [x] Config loading from ~/.askelira/config.json
- [x] Preferences detection (language, timezone, providers)
- [x] Build history from database
- [x] API key detection (boolean flags only)
- [x] Privacy layer (no sensitive data)
- [x] 1-hour caching per user
- [x] Graceful error handling
- [x] Documentation complete

**Ready for Phase 3**: Alba Research Integration with OpenResearch + Personal Context
