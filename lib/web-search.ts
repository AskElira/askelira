/**
 * Web Search Integration for AskElira Agents
 * Provides real-time web research capabilities to Alba, OpenClaw, and Phase 0
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
}

export interface WebSearchOptions {
  query: string;
  count?: number; // Number of results (default: 5)
  freshness?: 'day' | 'week' | 'month' | 'year'; // Recency filter
  provider?: 'brave' | 'tavily' | 'perplexity' | 'auto'; // Explicit provider selection (default: 'auto')
}

/**
 * Brave Search API integration
 * Get your API key from: https://brave.com/search/api/
 */
export async function braveSearch(options: WebSearchOptions): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    console.warn('[WebSearch] BRAVE_SEARCH_API_KEY not set - skipping web search');
    return [];
  }

  const { query, count = 5, freshness } = options;

  try {
    const params = new URLSearchParams({
      q: query,
      count: count.toString(),
    });

    if (freshness) {
      params.append('freshness', freshness);
    }

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      // [AUTO-ADDED] BUG-1-08: Log response body to diagnose expired keys / rate limits.
      const errBody = await response.text().catch(() => '');
      console.error(`[WebSearch] Brave API error (${response.status}): ${errBody.slice(0, 300)}`);
      return [];
    }

    const data = await response.json() as any;

    if (!data.web?.results) {
      // [AUTO-ADDED] BUG-1-08: Log when 200 OK has no web.results (rate limit / error payload).
      if (data.query || data.mixed) {
        console.warn('[WebSearch] Brave API returned 200 but no web.results. Keys in response:', Object.keys(data).join(', '));
      }
      return [];
    }

    return data.web.results.map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.description || '',
    }));
  } catch (error) {
    console.error('[WebSearch] Search failed:', error);
    return [];
  }
}

/**
 * Perplexity API integration (alternative to Brave)
 * Get your API key from: https://www.perplexity.ai/settings/api
 */
export async function perplexitySearch(options: WebSearchOptions): Promise<SearchResult[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.warn('[WebSearch] PERPLEXITY_API_KEY not set - skipping web search');
    return [];
  }

  const { query } = options;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        return_citations: true,
        return_related_questions: false,
      }),
    });

    if (!response.ok) {
      console.error('[WebSearch] Perplexity API error:', response.status);
      return [];
    }

    const data = await response.json() as any;

    if (!data.citations || !Array.isArray(data.citations)) {
      return [];
    }

    return data.citations.map((url: string, index: number) => ({
      title: `Source ${index + 1}`,
      url,
      snippet: data.choices?.[0]?.message?.content || '',
    }));
  } catch (error) {
    console.error('[WebSearch] Search failed:', error);
    return [];
  }
}

/**
 * Tavily Search API integration
 * Get your API key from: https://tavily.com
 */
export async function tavilySearch(options: WebSearchOptions): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn('[WebSearch] TAVILY_API_KEY not set - skipping Tavily search');
    return [];
  }

  const { query, count = 5, freshness } = options;

  try {
    const body: Record<string, unknown> = {
      api_key: apiKey,
      query,
      max_results: count,
      include_answer: false,
      include_raw_content: false,
    };

    // Map freshness to Tavily's days parameter
    if (freshness) {
      const freshnessMap: Record<string, number> = {
        day: 1,
        week: 7,
        month: 30,
        year: 365,
      };
      body.days = freshnessMap[freshness] || 30;
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('[WebSearch] Tavily API error:', response.status);
      return [];
    }

    const data = await response.json() as any;

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.content || '',
      relevanceScore: result.score,
    }));
  } catch (error) {
    console.error('[WebSearch] Tavily search failed:', error);
    return [];
  }
}

// ============================================================
// Feature 11: Deduplication by URL
// ============================================================

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const normalized = r.url.replace(/\/+$/, '').toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

// ============================================================
// Feature 12: Relevance scoring by keyword overlap
// ============================================================

function scoreResults(results: SearchResult[], query: string): SearchResult[] {
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  return results
    .map((r) => {
      const text = `${r.title} ${r.snippet}`.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (text.includes(word)) score++;
      }
      return { ...r, relevanceScore: queryWords.size > 0 ? score / queryWords.size : 0 };
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
}

// ============================================================
// Feature 17: Stale result detection
// ============================================================

function flagStaleResults(results: SearchResult[]): SearchResult[] {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  return results.map((r) => {
    const dateMatch = r.snippet.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    if (dateMatch) {
      const date = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
      if (date.getTime() < ninetyDaysAgo) {
        console.warn(`[WebSearch] Stale result detected (${dateMatch[0]}): ${r.url}`);
        return { ...r, stale: true } as SearchResult & { stale: boolean };
      }
    }
    return r;
  });
}

// ============================================================
// Feature 19: In-memory search result cache (1hr TTL)
// ============================================================

const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCachedResults(query: string): SearchResult[] | null {
  const entry = searchCache.get(query.toLowerCase().trim());
  if (!entry) return null;
  if (Date.now() - entry.timestamp > SEARCH_CACHE_TTL_MS) {
    searchCache.delete(query.toLowerCase().trim());
    return null;
  }
  return entry.results;
}

function setCachedResults(query: string, results: SearchResult[]): void {
  searchCache.set(query.toLowerCase().trim(), { results, timestamp: Date.now() });
}

/**
 * Generic web search that tries available providers in order.
 * When provider is 'auto' (default), tries Brave -> Tavily -> Perplexity based on available keys.
 *
 * Features 11-14, 17, 19: Deduplication, scoring, fallback chain logging, stale detection, caching.
 */
export async function webSearch(options: WebSearchOptions): Promise<SearchResult[]> {
  // Feature 19: Check cache first
  const cached = getCachedResults(options.query);
  if (cached) {
    console.log(`[WebSearch] Cache hit for: "${options.query.slice(0, 60)}..." (${cached.length} results)`);
    return cached;
  }

  const provider = options.provider || process.env.SEARCH_PROVIDER || 'auto';
  let results: SearchResult[] = [];
  let usedProvider = 'none';

  // Explicit provider selection
  if (provider === 'brave') {
    console.log(`[WebSearch] Trying Brave (explicit)`); // Feature 14
    results = await braveSearch(options);
    usedProvider = 'brave';
  } else if (provider === 'tavily') {
    console.log(`[WebSearch] Trying Tavily (explicit)`); // Feature 14
    results = await tavilySearch(options);
    usedProvider = 'tavily';
  } else if (provider === 'perplexity') {
    console.log(`[WebSearch] Trying Perplexity (explicit)`); // Feature 14
    results = await perplexitySearch(options);
    usedProvider = 'perplexity';
  } else {
    // Auto mode: try providers in order based on available keys
    if (process.env.BRAVE_SEARCH_API_KEY) {
      console.log(`[WebSearch] Trying Brave (auto)`); // Feature 14
      results = await braveSearch(options);
      usedProvider = 'brave';
      console.log(`[WebSearch] Brave returned ${results.length} results`); // Feature 14
    }

    if (results.length === 0 && process.env.TAVILY_API_KEY) {
      console.log(`[WebSearch] Trying Tavily (${usedProvider === 'brave' ? 'fallback' : 'auto'})`); // Feature 14
      results = await tavilySearch(options);
      usedProvider = 'tavily';
      console.log(`[WebSearch] Tavily returned ${results.length} results`); // Feature 14
    }

    if (results.length === 0 && process.env.PERPLEXITY_API_KEY) {
      console.log(`[WebSearch] Trying Perplexity (fallback)`); // Feature 14
      results = await perplexitySearch(options);
      usedProvider = 'perplexity';
    }
  }

  // Feature 13: Minimum result enforcement — if < 3, try supplement
  if (results.length > 0 && results.length < 3 && usedProvider === 'tavily' && process.env.BRAVE_SEARCH_API_KEY) {
    console.log(`[WebSearch] Only ${results.length} results from Tavily, supplementing with Brave`);
    const supplementResults = await braveSearch(options);
    results = [...results, ...supplementResults];
  } else if (results.length > 0 && results.length < 3 && usedProvider === 'brave' && process.env.TAVILY_API_KEY) {
    console.log(`[WebSearch] Only ${results.length} results from Brave, supplementing with Tavily`);
    const supplementResults = await tavilySearch(options);
    results = [...results, ...supplementResults];
  }

  if (results.length === 0) {
    console.warn('[WebSearch] No search API configured or no results - agents running offline');
    return [];
  }

  // Feature 11: Deduplication
  results = deduplicateResults(results);

  // Feature 12: Relevance scoring
  results = scoreResults(results, options.query);

  // Feature 17: Stale result detection
  results = flagStaleResults(results);

  // Feature 14: Final log
  console.log(`[WebSearch] Final: ${results.length} results via ${usedProvider}`);

  // Feature 19: Cache results
  setCachedResults(options.query, results);

  return results;
}

/**
 * Specialized search for package verification
 */
export async function searchPackageInfo(packageName: string, provider?: WebSearchOptions['provider']): Promise<{
  npmWeeklyDownloads?: string;
  githubStars?: string;
  latestVersion?: string;
  lastUpdated?: string;
  knownVulnerabilities?: string[];
}> {
  const queries = [
    `${packageName} npm downloads statistics 2026`,
    `${packageName} security vulnerabilities CVE`,
    `${packageName} github stars maintenance`,
  ];

  const allResults: SearchResult[] = [];

  for (const query of queries) {
    const results = await webSearch({ query, count: 3, freshness: 'month', provider });
    allResults.push(...results);
  }

  // Parse results to extract structured data
  const info: any = {};

  allResults.forEach((result) => {
    const text = `${result.title} ${result.snippet}`.toLowerCase();

    // Extract download numbers
    const downloadMatch = text.match(/(\d+[\d,]*)\s*(million|k|thousand)?\s*downloads?\s*(?:per\s*)?(week|month)/i);
    if (downloadMatch && !info.npmWeeklyDownloads) {
      info.npmWeeklyDownloads = downloadMatch[0];
    }

    // Extract GitHub stars
    const starsMatch = text.match(/(\d+[\d,]*)\s*stars?/i);
    if (starsMatch && !info.githubStars) {
      info.githubStars = starsMatch[0];
    }

    // Check for vulnerabilities
    if (text.includes('vulnerability') || text.includes('cve-')) {
      if (!info.knownVulnerabilities) {
        info.knownVulnerabilities = [];
      }
      const cveMatch = text.match(/cve-\d{4}-\d+/gi);
      if (cveMatch) {
        info.knownVulnerabilities.push(...cveMatch);
      }
    }

    // Last updated
    if (text.includes('updated') || text.includes('maintained')) {
      const dateMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i);
      if (dateMatch && !info.lastUpdated) {
        info.lastUpdated = dateMatch[0];
      }
    }
  });

  return info;
}
