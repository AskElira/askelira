/**
 * AutoResearch - Autonomous Research Engine
 * Based on karpathy/autoresearch concept for autonomous iteration
 * Original: https://github.com/karpathy/autoresearch (ML training experiments)
 *
 * This implementation adapts the autoresearch autonomous iteration approach
 * from ML model training to general topic research:
 * 1. Research topic
 * 2. Evaluate quality
 * 3. Identify gaps
 * 4. Research gaps
 * 5. Synthesize final report
 *
 * The function is named "runOpenResearch" (open-ended research) but uses
 * the autoresearch methodology under the hood.
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { braveSearch as braveWebSearch, tavilySearch, type SearchResult } from './web-search';

export interface OpenResearchConfig {
  llm?: {
    provider: 'anthropic' | 'openai';
    apiKey: string;
    model?: string;
  };
  searchApi?: string; // 'brave', 'tavily', 'duckduckgo'
  searchApiKey?: string;
  iterations?: number; // Number of research iterations (default: 3)
  timeout?: number; // Per iteration timeout in ms (default: 60000)
}

export interface ResearchIteration {
  iteration: number;
  query: string;
  findings: string;
  sources: Array<{ title: string; url: string; snippet?: string }>;
  quality: number; // 0-1 quality score
  duration: number; // ms
}

export interface OpenResearchResult {
  topic: string;
  finalReport: string;
  iterations: ResearchIteration[];
  sources: Array<{ title: string; url: string; snippet?: string }>;
  metadata: {
    totalIterations: number;
    totalDuration: number; // milliseconds
    model: string;
    searchApi: string;
  };
  confidence: number; // 0-1
  success: boolean;
  error?: string;
}

const CACHE_DIR = join(tmpdir(), 'autoresearch-cache');

// Ensure cache directory exists
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Run autonomous research on a topic using AutoResearch-inspired approach
 *
 * Instead of training ML models, this iterates on research quality:
 * 1. Initial research on topic
 * 2. Evaluate quality
 * 3. Identify gaps
 * 4. Research gaps
 * 5. Synthesize final report
 */
export async function runOpenResearch(
  topic: string,
  config: OpenResearchConfig = {}
): Promise<OpenResearchResult> {
  const startTime = Date.now();

  try {
    // Check cache first
    const cacheKey = getCacheKey(topic);
    const cached = loadFromCache(cacheKey);
    if (cached) {
      console.log(`[AutoResearch] Cache hit: ${topic}`);
      return cached;
    }

    console.log(`[AutoResearch] Starting research: ${topic}`);

    // Set defaults
    const llmProvider = config.llm?.provider || 'anthropic';
    const llmKey = config.llm?.apiKey || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    const llmModel = config.llm?.model || (llmProvider === 'anthropic' ? 'claude-sonnet-4-5-20250929' : 'gpt-4.1');
    const searchApi = config.searchApi || 'duckduckgo';
    const searchKey = config.searchApiKey || process.env.BRAVE_SEARCH_API_KEY;
    const iterations = config.iterations || 3;
    const timeout = config.timeout || 60000;

    if (!llmKey) {
      throw new Error('No LLM API key provided');
    }

    // Run autonomous research iterations
    const iterationResults: ResearchIteration[] = [];
    let currentReport = '';

    for (let i = 0; i < iterations; i++) {
      console.log(`[AutoResearch] Iteration ${i + 1}/${iterations}`);

      const iterationStart = Date.now();

      // Determine research query for this iteration
      const query = i === 0
        ? topic
        : await generateNextQuery(topic, currentReport, llmProvider, llmKey, llmModel);

      console.log(`[AutoResearch] Query: ${query}`);

      // Perform research
      const findings = await performResearch(query, searchApi, searchKey, llmProvider, llmKey, llmModel, timeout);

      // Evaluate quality
      const quality = await evaluateQuality(findings, topic, llmProvider, llmKey, llmModel);

      console.log(`[AutoResearch] Quality: ${quality.toFixed(2)}`);

      const iterationDuration = Date.now() - iterationStart;

      iterationResults.push({
        iteration: i + 1,
        query,
        findings: findings.text,
        sources: findings.sources,
        quality,
        duration: iterationDuration,
      });

      // Update current report
      currentReport = findings.text;

      // If quality is very high (>0.9), we can stop early
      if (quality > 0.9 && i >= 1) {
        console.log(`[AutoResearch] High quality reached, stopping early`);
        break;
      }
    }

    // Synthesize final report from all iterations
    const finalReport = await synthesizeFinalReport(topic, iterationResults, llmProvider, llmKey, llmModel);

    // Collect all sources
    const allSources = iterationResults.flatMap(it => it.sources);
    const uniqueSources = Array.from(
      new Map(allSources.map(s => [s.url, s])).values()
    );

    const totalDuration = Date.now() - startTime;
    const avgQuality = iterationResults.reduce((sum, it) => sum + it.quality, 0) / iterationResults.length;

    const result: OpenResearchResult = {
      topic,
      finalReport,
      iterations: iterationResults,
      sources: uniqueSources,
      metadata: {
        totalIterations: iterationResults.length,
        totalDuration,
        model: llmModel,
        searchApi,
      },
      confidence: avgQuality,
      success: true,
    };

    // Cache the result
    saveToCache(cacheKey, result);

    return result;
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;

    return {
      topic,
      finalReport: '',
      iterations: [],
      sources: [],
      metadata: {
        totalIterations: 0,
        totalDuration,
        model: config.llm?.model || 'unknown',
        searchApi: config.searchApi || 'unknown',
      },
      confidence: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate next research query based on current findings
 */
async function generateNextQuery(
  originalTopic: string,
  currentReport: string,
  provider: string,
  apiKey: string,
  model: string
): Promise<string> {
  const prompt = `Original topic: ${originalTopic}

Current research findings:
${currentReport.substring(0, 1000)}...

Identify the most important gap or question that needs more research. Return ONLY the search query, no explanation.`;

  const response = await callLLM(prompt, provider, apiKey, model, 100);
  return response.trim();
}

/**
 * Perform research using LLM + web search.
 * When a search API is configured (tavily, brave), fetches real web results
 * and feeds them to the LLM for synthesis. Falls back to LLM-only research
 * if no search API is available.
 */
async function performResearch(
  query: string,
  searchApi: string,
  searchKey: string | undefined,
  llmProvider: string,
  llmKey: string,
  llmModel: string,
  timeout: number
): Promise<{ text: string; sources: Array<{ title: string; url: string; snippet?: string }> }> {
  // Attempt web search based on configured provider
  let webResults: SearchResult[] = [];

  try {
    if (searchApi === 'tavily' && (searchKey || process.env.TAVILY_API_KEY)) {
      webResults = await tavilySearch({ query, count: 5, freshness: 'month' });
    } else if (searchApi === 'brave' && (searchKey || process.env.BRAVE_SEARCH_API_KEY)) {
      webResults = await braveWebSearch({ query, count: 5, freshness: 'month' });
    } else if (searchApi === 'duckduckgo') {
      // DuckDuckGo has no API -- try Tavily or Brave as fallback
      if (process.env.TAVILY_API_KEY) {
        webResults = await tavilySearch({ query, count: 5, freshness: 'month' });
      } else if (process.env.BRAVE_SEARCH_API_KEY) {
        webResults = await braveWebSearch({ query, count: 5, freshness: 'month' });
      }
    }
  } catch (err) {
    console.warn(`[AutoResearch] Web search failed:`, err instanceof Error ? err.message : String(err));
  }

  // Feature 18: Query expansion if zero results
  if (webResults.length === 0) {
    const expandedQueries = [
      query.replace(/["']/g, ''), // remove quotes
      query.split(' ').slice(0, 4).join(' ') + ' guide tutorial', // broaden terms
    ];
    for (const altQuery of expandedQueries) {
      console.log(`[AutoResearch] Expanding query: "${altQuery}"`);
      try {
        if (process.env.TAVILY_API_KEY) {
          webResults = await tavilySearch({ query: altQuery, count: 5, freshness: 'month' });
        } else if (process.env.BRAVE_SEARCH_API_KEY) {
          webResults = await braveWebSearch({ query: altQuery, count: 5, freshness: 'month' });
        }
        if (webResults.length > 0) {
          console.log(`[AutoResearch] Query expansion succeeded with ${webResults.length} results`);
          break;
        }
      } catch {
        // continue to next expansion
      }
    }
  }

  // Build sources from real results
  const sources: Array<{ title: string; url: string; snippet?: string }> = webResults.map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.snippet,
  }));

  // Build research prompt — include web search context if available
  let prompt: string;

  if (webResults.length > 0) {
    const searchContext = webResults
      .map((r, i) => `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    ${r.snippet}`)
      .join('\n\n');

    prompt = `Research the following topic using the web search results provided as context:

TOPIC: ${query}

WEB SEARCH RESULTS:
${searchContext}

Using these search results as your primary source of information, provide detailed findings including:
- Key concepts and definitions
- Current best practices from the sources
- Common approaches and solutions mentioned
- Important considerations
- Recent developments (as of 2026)

Cite specific sources when possible. Be specific and technical.`;
  } else {
    prompt = `Research the following topic comprehensively:

${query}

Provide detailed findings including:
- Key concepts and definitions
- Current best practices
- Common approaches and solutions
- Important considerations
- Recent developments (as of 2026)

Be specific and technical.`;

    // Add a fallback source when no web search is available
    if (sources.length === 0) {
      sources.push({
        title: `Research on: ${query}`,
        url: `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
      });
    }
  }

  const text = await callLLM(prompt, llmProvider, llmKey, llmModel, 2000);

  return { text, sources };
}

/**
 * Evaluate research quality (0-1 score)
 */
async function evaluateQuality(
  findings: { text: string },
  originalTopic: string,
  provider: string,
  apiKey: string,
  model: string
): Promise<number> {
  const prompt = `Rate the quality of this research on "${originalTopic}" from 0.0 to 1.0.

Research:
${findings.text.substring(0, 500)}...

Consider:
- Completeness (covers key aspects?)
- Specificity (concrete details vs vague?)
- Accuracy (likely correct as of 2026?)
- Usefulness (actionable information?)

Return ONLY a number between 0.0 and 1.0.`;

  const response = await callLLM(prompt, provider, apiKey, model, 10);
  const score = parseFloat(response.trim());

  return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
}

/**
 * Synthesize final report from all iterations
 */
async function synthesizeFinalReport(
  topic: string,
  iterations: ResearchIteration[],
  provider: string,
  apiKey: string,
  model: string
): Promise<string> {
  const allFindings = iterations.map(it => it.findings).join('\n\n---\n\n');

  const prompt = `Synthesize a comprehensive final research report on: ${topic}

Based on ${iterations.length} research iterations:

${allFindings}

Create a well-structured, detailed report that:
- Synthesizes all findings
- Removes redundancy
- Organizes logically
- Highlights key insights
- Provides actionable recommendations`;

  return await callLLM(prompt, provider, apiKey, model, 4000);
}

/**
 * Call LLM (Anthropic or OpenAI)
 */
// [AUTO-ADDED] BUG-1-05: Cache Anthropic SDK client to reuse HTTP connections
// across multiple callLLM invocations within the same research run.
let _anthropicClient: any = null;
let _anthropicClientKey: string = '';

async function callLLM(
  prompt: string,
  provider: string,
  apiKey: string,
  model: string,
  maxTokens: number
): Promise<string> {
  if (provider === 'anthropic') {
    // Reuse client if apiKey hasn't changed
    if (!_anthropicClient || _anthropicClientKey !== apiKey) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      _anthropicClient = new Anthropic({ apiKey });
      _anthropicClientKey = apiKey;
    }

    const response = await _anthropicClient.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } else {
    // OpenAI (using Next.js global fetch)
    // [AUTO-ADDED] BUG-1-05: Add 60s timeout to OpenAI fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Cache helpers
 */
function getCacheKey(topic: string): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(topic).digest('hex') + '.json';
}

function loadFromCache(cacheKey: string): OpenResearchResult | null {
  try {
    const cachePath = join(CACHE_DIR, cacheKey);
    if (!existsSync(cachePath)) return null;

    const cached = JSON.parse(readFileSync(cachePath, 'utf-8'));
    const age = Date.now() - cached.timestamp;

    // 24 hour expiry
    if (age > 24 * 60 * 60 * 1000) return null;

    return cached.result;
  } catch {
    return null;
  }
}

function saveToCache(cacheKey: string, result: OpenResearchResult): void {
  try {
    const cachePath = join(CACHE_DIR, cacheKey);
    writeFileSync(cachePath, JSON.stringify({ timestamp: Date.now(), result }, null, 2));
  } catch (error) {
    console.error('[AutoResearch] Cache save failed:', error);
  }
}

/**
 * Check if AutoResearch is properly configured
 */
export async function checkOpenResearchInstallation(): Promise<{
  installed: boolean;
  hasAnthropicKey: boolean;
  hasOpenAIKey: boolean;
  hasBraveKey: boolean;
  hasTavilyKey: boolean;
}> {
  return {
    installed: true,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasBraveKey: !!process.env.BRAVE_SEARCH_API_KEY,
    hasTavilyKey: !!process.env.TAVILY_API_KEY,
  };
}
