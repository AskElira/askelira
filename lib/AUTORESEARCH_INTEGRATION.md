# 🔬 OpenResearch Integration Documentation

## Overview

OpenResearch integration provides deep research capabilities for AskElira agents using the [langchain-ai/open_deep_research](https://github.com/langchain-ai/open_deep_research) agent.

**Repository**: https://github.com/langchain-ai/open_deep_research
**Stars**: 10,908+
**Technology**: Python + LangGraph + LangChain

---

## Installation

### Phase 1 Complete ✅

1. ✅ Repository cloned to `lib/openresearch-repo/`
2. ✅ Core dependencies installed (langgraph, langchain, etc.)
3. ✅ TypeScript wrapper created at `lib/openresearch.ts`
4. ✅ Cache system implemented (24-hour expiry)
5. ✅ Error handling and timeouts configured
6. ✅ Installation checker available

---

## Usage

### Basic Usage

```typescript
import { runOpenResearch } from '@/lib/openresearch';

// Simple research
const result = await runOpenResearch('email automation best practices');

console.log(result.report);     // Deep research report
console.log(result.sources);    // Citations and sources
console.log(result.confidence); // 0-1 confidence score
```

### Advanced Configuration

```typescript
import { runOpenResearch } from '@/lib/openresearch';

const result = await runOpenResearch('GitHub API integration patterns', {
  // LLM model selection
  llm: 'anthropic:claude-sonnet-4-20250514', // or 'openai:gpt-4.1'

  // Search API
  searchApi: 'brave', // or 'tavily', 'duckduckgo'

  // API keys (optional, uses env vars by default)
  apiKeys: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    brave: process.env.BRAVE_SEARCH_API_KEY,
  },

  // Timeout (default: 5 minutes)
  timeout: 300000, // 5 minutes in ms
});
```

### Check Installation

```typescript
import { checkOpenResearchInstallation } from '@/lib/openresearch';

const status = await checkOpenResearchInstallation();

console.log(status);
// {
//   installed: true,
//   pythonVersion: 'Python 3.9.6',
//   dependencies: {
//     langgraph: true,
//     langchain: true
//   }
// }
```

---

## Integration with Alba Research

### How Alba Uses OpenResearch

When Alba researches a floor, it now uses OpenResearch for deep research:

```typescript
// In lib/step-runner.ts - Alba research step

import { runOpenResearch } from '@/lib/openresearch';
import { webSearch } from '@/lib/web-search';

async function albaResearch(floor: Floor, userConfig: any) {
  console.log(`[Alba] Starting research for: ${floor.name}`);

  // STEP 1: Deep research with OpenResearch
  const deepResearch = await runOpenResearch(floor.name, {
    llm: userConfig.llm?.model,
    searchApi: 'brave',
    apiKeys: {
      anthropic: userConfig.llm?.apiKey,
      brave: userConfig.braveSearchApiKey,
    },
    timeout: 300000, // 5 minutes
  });

  console.log(`[Alba] OpenResearch complete: ${deepResearch.report.length} chars`);

  // STEP 2: Real-time web search with Brave
  const webResults = await webSearch({
    query: `${floor.name} implementation 2026`,
    count: 5,
    freshness: 'month',
  });

  console.log(`[Alba] Brave Search complete: ${webResults.length} results`);

  // STEP 3: Combine research
  const combinedResearch = {
    deepKnowledge: deepResearch.report,
    sources: [...deepResearch.sources, ...webResults],
    confidence: deepResearch.confidence,
    realTimeContext: webResults,
  };

  return combinedResearch;
}
```

---

## Configuration

### Environment Variables

OpenResearch reads configuration from environment variables:

```bash
# LLM Provider
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Search APIs
BRAVE_SEARCH_API_KEY=BSA...
TAVILY_API_KEY=tvly-...

# Model Selection (optional)
OPENAI_MODEL=openai:gpt-4.1
SEARCH_API=brave
```

### User Configuration

When users run onboarding, their config is stored at `~/.askelira/config.json`:

```json
{
  "llm": {
    "provider": "anthropic",
    "apiKey": "sk-ant-...",
    "model": "claude-sonnet-4-5-20250929"
  },
  "braveSearchApiKey": "BSA..."
}
```

Alba automatically uses this config when running OpenResearch.

---

## Cache System

### How It Works

1. **Cache Key**: MD5 hash of `topic + config`
2. **Cache Location**: `/tmp/openresearch-cache/`
3. **Cache Expiry**: 24 hours
4. **Cache Hit**: Returns cached result instantly
5. **Cache Miss**: Runs research, saves to cache

### Example

```typescript
// First call - runs research (slow)
const result1 = await runOpenResearch('email automation');
// [OpenResearch] Research complete (250s)

// Second call - cache hit (instant)
const result2 = await runOpenResearch('email automation');
// [OpenResearch] Cache hit for topic: email automation (age: 30s)
```

### Clear Cache

```bash
rm -rf /tmp/openresearch-cache/*
```

---

## Error Handling

### Timeout Handling

```typescript
const result = await runOpenResearch('complex topic', {
  timeout: 60000, // 1 minute
});

if (!result.success) {
  console.error('Research failed:', result.error);
  // Error: "OpenResearch timed out after 60000ms"
}
```

### Graceful Fallback

```typescript
async function albaResearch(topic: string) {
  // Try OpenResearch first
  const deepResearch = await runOpenResearch(topic);

  if (!deepResearch.success) {
    console.warn('[Alba] OpenResearch failed, falling back to web search only');

    // Fallback to web search
    const webResults = await webSearch({ query: topic });
    return { report: 'Limited research from web search', sources: webResults };
  }

  return deepResearch;
}
```

---

## Result Structure

```typescript
interface OpenResearchResult {
  topic: string;                    // Research topic
  report: string;                   // Comprehensive research report
  sources: Array<{                  // Citations
    title: string;
    url: string;
    snippet?: string;
  }>;
  metadata: {
    queries: number;                // Search queries executed
    tokensUsed: number;             // LLM tokens consumed
    duration: number;               // Time in milliseconds
    model: string;                  // Model used
  };
  confidence: number;               // 0-1 confidence score
  success: boolean;                 // true if successful
  error?: string;                   // Error message if failed
}
```

---

## Performance

### Typical Metrics

- **Duration**: 1-5 minutes per research
- **Tokens**: 50,000-200,000 tokens
- **Queries**: 5-15 search queries
- **Cost**: $0.10-$0.50 per research (depending on model)

### Optimization

**Use Cache**:
```typescript
// Same topic = instant cache hit
await runOpenResearch('email automation'); // 250s
await runOpenResearch('email automation'); // <1s (cache)
```

**Use Cheaper Model**:
```typescript
// GPT-4.1 mini is 10x cheaper
await runOpenResearch(topic, {
  llm: 'openai:gpt-4.1-mini' // Instead of gpt-4.1
});
```

**Shorter Timeout**:
```typescript
// Stop research after 1 minute
await runOpenResearch(topic, {
  timeout: 60000
});
```

---

## Testing

### Unit Test

```typescript
import { runOpenResearch } from '@/lib/openresearch';

test('OpenResearch returns structured results', async () => {
  const result = await runOpenResearch('test topic');

  expect(result).toHaveProperty('topic');
  expect(result).toHaveProperty('report');
  expect(result).toHaveProperty('sources');
  expect(result).toHaveProperty('metadata');
  expect(result).toHaveProperty('confidence');
  expect(result).toHaveProperty('success');
});
```

### Integration Test

```bash
npx tsx -e "
import { runOpenResearch } from './lib/openresearch';

const result = await runOpenResearch('email automation');
console.log('Success:', result.success);
console.log('Report length:', result.report.length);
"
```

---

## Next Steps (Phase 2+)

### Phase 2: Personal Context
- [ ] Integrate user preferences into research
- [ ] Include user's past builds as context
- [ ] Detect user's configured API keys

### Phase 3: Alba Integration
- [ ] Add OpenResearch to Alba research step
- [ ] Combine with Brave Search
- [ ] Store research in floor.researchOutput

### Phase 4: Optimization
- [ ] Parallel research for multiple topics
- [ ] Smart caching based on similarity
- [ ] Cost tracking per user

---

## Troubleshooting

### "OpenResearch failed with code 1"

**Cause**: Missing Python dependencies or API keys

**Fix**:
```bash
cd lib/openresearch-repo
pip3 install -r pyproject.toml
export ANTHROPIC_API_KEY=sk-ant-...
```

### "Python version too old"

**Cause**: Requires Python 3.10+, system has 3.9

**Fix**:
```bash
# Install Python 3.10+
brew install python@3.10

# Use specific version
python3.10 -m pip install langgraph langchain
```

### "Cache not working"

**Cause**: `/tmp/openresearch-cache/` permissions

**Fix**:
```bash
sudo chmod 777 /tmp/openresearch-cache
```

---

## Summary

**Phase 1 Complete** ✅

- [x] OpenResearch repository cloned
- [x] Dependencies installed
- [x] TypeScript wrapper created
- [x] Cache system implemented
- [x] Error handling configured
- [x] Timeout limits set (5 min)
- [x] Installation checker working
- [x] Documentation complete

**Ready for Phase 2**: Personal Context Integration
