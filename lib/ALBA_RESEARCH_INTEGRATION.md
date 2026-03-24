# 🔬 Alba Research Integration Documentation

## Overview

**Phase 3 Complete** ✅

Alba now uses **three research sources** to gather comprehensive intelligence before proposing automation approaches:

1. **OpenResearch** - Autonomous iterative research (adapted from karpathy/autoresearch)
2. **Brave Search** - Real-time web search with fresh results
3. **Personal Context** - User preferences, build history, and patterns

---

## Architecture

### Research Flow

```
runAlbaStep()
    ↓
1. OpenResearch (autonomous iteration)
    - Research topic
    - Evaluate quality
    - Identify gaps
    - Synthesize final report
    ↓
2. Brave Search (real-time web)
    - Search recent best practices
    - Get implementation examples
    - Find current documentation
    ↓
3. Personal Context (user history)
    - Load user preferences
    - Get past build patterns
    - Understand user's tech stack
    ↓
4. Combine Research
    - Merge all sources
    - Generate unified summary
    - Collect all URLs/sources
    ↓
5. Alba LLM Analysis
    - Process combined research
    - Generate approach
    - Recommend libraries
    - Assess risks
    ↓
6. Save to Database
    - Enhanced Alba result
    - Research metadata
    - All sources
```

---

## Code Changes

### File: `lib/step-runner.ts`

#### Imports Added

```typescript
import { runOpenResearch, type OpenResearchResult } from './openresearch';
import { webSearch, type SearchResult } from './web-search';
import { getPersonalContext, type PersonalContext } from './personal-context';
```

#### New Helper Function

```typescript
async function combineResearch(
  floorName: string,
  floorDescription: string | null,
  customerId: string,
  openResearchResult?: OpenResearchResult,
  braveResults?: SearchResult[],
  userContext?: PersonalContext,
): Promise<CombinedResearch>
```

**Purpose**: Merges research from all three sources into a unified summary with all sources collected.

**Returns**:
```typescript
interface CombinedResearch {
  deepResearch: string;           // OpenResearch final report
  webResults: SearchResult[];     // Brave Search results
  personalContext: PersonalContext; // User preferences & history
  combinedSummary: string;        // Formatted markdown summary
  allSources: Array<{             // All URLs from all sources
    title: string;
    url: string;
    snippet?: string;
  }>;
}
```

#### Modified Function: `runAlbaStep()`

**Before** (Phase 2):
- Alba called Claude directly with building context
- No external research
- No user context
- Limited to pattern database only

**After** (Phase 3):
- Step 1: Run OpenResearch (2 iterations, 30s timeout)
- Step 2: Run Brave Search (5 results, 1-month freshness)
- Step 3: Load Personal Context (user preferences + history)
- Step 4: Combine all research sources
- Step 5: Pass combined research to Alba
- Step 6: Save enhanced result with metadata

---

## Enhanced Alba Result

Alba's output now includes research metadata:

```typescript
{
  // Original Alba fields
  approach: string;
  implementation: string;
  libraries: string[];
  risks: string[];
  sources: string[];      // Now includes ALL sources from research
  complexity: number;

  // NEW: Research metadata
  researchMetadata: {
    openResearchConfidence: number;      // 0-1 quality score
    openResearchIterations: number;      // How many iterations
    braveSearchResults: number;          // How many web results
    personalContextUsed: boolean;        // Was user context loaded?
    userPreferences: {
      language: string;                  // User's preferred language
      timezone: string;                  // User's timezone
      emailProvider: string;             // User's email provider
    } | null;
  };
}
```

---

## Example Research Output

### Sample Floor: "GitHub API scraper"

#### OpenResearch Output
```markdown
## Deep Research Findings:

The GitHub API is a RESTful API that provides programmatic access to GitHub
repositories, issues, pull requests, users, and organizations. Key concepts:

- **Authentication**: Personal Access Tokens (PATs), OAuth Apps, GitHub Apps
- **Rate Limiting**: 5,000 requests/hour for authenticated, 60 for unauthenticated
- **Best Practices**: Use conditional requests (ETag), pagination, webhooks for events
- **Libraries**: Octokit (official), PyGithub (Python), simple-git (Node.js)

Common approaches:
1. REST API v3 - Most stable, well-documented
2. GraphQL API v4 - More efficient for complex queries
3. GitHub CLI - For automation scripts

Important considerations:
- Handle rate limiting with exponential backoff
- Cache responses using ETag headers
- Use fine-grained PATs (introduced 2022) for security
```

#### Brave Search Results
```markdown
## Web Search Results:

1. **GitHub REST API Documentation**
   Official guide for GitHub's REST API with authentication, endpoints, and examples
   Source: https://docs.github.com/en/rest

2. **Octokit.js - GitHub API Client**
   Official JavaScript/TypeScript client for GitHub API with built-in auth and retries
   Source: https://github.com/octokit/octokit.js

3. **Best Practices for GitHub API in 2026**
   Updated guide covering fine-grained tokens, webhook security, and rate limit optimization
   Source: https://github.blog/...
```

#### Personal Context
```markdown
## User Context:

- Preferred Language: python
- Timezone: America/Los_Angeles
- Email Provider: agentmail
- LLM Provider: anthropic
- Past Success Patterns: api, automation, scraping
```

---

## Progress Logging

Alba now logs detailed progress:

```
[Alba] Running OpenResearch for: GitHub API scraper
[Alba] OpenResearch complete (confidence: 87.3%)
[Alba] Running Brave Search for: GitHub API scraper
[Alba] Brave Search complete (5 results)
[Alba] Loading personal context for customer: user@example.com
[Alba] Personal context loaded (12 past builds, 3 patterns)
[Alba] Combining research from all sources...
[Alba] Generating research report with Claude...
```

---

## Error Handling

All research sources use **best-effort** approach:

- If OpenResearch fails → Log warning, continue with other sources
- If Brave Search fails → Log warning, continue with other sources
- If Personal Context fails → Log warning, use defaults

Alba will **always run** even if all research sources fail (falls back to building context only).

---

## Configuration

### Required Environment Variables

```bash
# For OpenResearch (required)
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...

# For Brave Search (optional)
BRAVE_SEARCH_API_KEY=BSA...

# For Personal Context (loaded from ~/.askelira/config.json)
# No env vars needed - uses Prisma database
```

### Performance

**Timing breakdown** (example):
- OpenResearch: ~60-90s (2 iterations x 30-45s)
- Brave Search: ~2-5s
- Personal Context: ~200ms (first call) / <1ms (cached)
- Combine Research: <100ms
- Alba Claude call: ~10-20s

**Total**: ~70-115s (vs ~10-20s without research)

**Trade-off**: 4-6x slower BUT much higher quality research with real-time web data and user personalization.

---

## Testing

### Manual Test

```bash
# Run Alba research test
npx tsx /tmp/test_alba_research.ts
```

### Expected Output

```
🧪 Testing Alba Research Integration (Phase 3)

Testing Alba with floor: "GitHub API scraper"
This will test:
  1. OpenResearch (autonomous iteration)
  2. Brave Search (real-time web search)
  3. Personal Context (user preferences)
  4. Combined research synthesis

Starting Alba research step...

[Alba] Running OpenResearch for: GitHub API scraper
[Alba] OpenResearch complete (confidence: 85.2%)
[Alba] Running Brave Search for: GitHub API scraper
[Alba] Brave Search complete (5 results)
[Alba] Loading personal context for customer: test@example.com
[Alba] Personal context loaded (0 past builds, 0 patterns)
[Alba] Combining research from all sources...
[Alba] Generating research report with Claude...

✅ Alba Research Complete!
✅ Phase 3: Alba Research Integration - PASSED
```

---

## Integration Points

### With Phase 1 (OpenResearch)

Alba calls `runOpenResearch()` with:
- `topic`: Floor name
- `iterations`: 2 (quick but thorough)
- `timeout`: 30000ms per iteration

### With Phase 2 (Personal Context)

Alba calls `getPersonalContext()` with:
- `userId`: Customer ID from goal
- Uses 1-hour cache to avoid DB queries on every floor

### With Brave Search

Alba calls `webSearch()` with:
- `query`: Floor name + description + "automation implementation best practices"
- `count`: 5 results
- `freshness`: 'month' (recent results only)

---

## Next Phase

**Phase 4: Pattern Matching Validation System**

Now that Alba has comprehensive research, we'll add pattern matching validation to:
1. Detect automation category (email, scraping, API, etc.)
2. Match against proven patterns from database
3. Validate approach against known successful implementations
4. Score pattern confidence

---

## Summary

**Phase 3 Complete** ✅

- [x] Imported OpenResearch, Brave Search, Personal Context
- [x] Modified `runAlbaStep()` to run all three research sources
- [x] Implemented `combineResearch()` helper function
- [x] Enhanced Alba result with research metadata
- [x] Added detailed progress logging
- [x] Saved combined research to database
- [x] Created test script
- [x] Documentation complete

**Ready for Phase 4**: Pattern Matching Validation System
