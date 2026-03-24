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
    count?: number;
    freshness?: 'day' | 'week' | 'month' | 'year';
}
/**
 * Brave Search API integration
 * Get your API key from: https://brave.com/search/api/
 */
export declare function braveSearch(options: WebSearchOptions): Promise<SearchResult[]>;
/**
 * Perplexity API integration (alternative to Brave)
 * Get your API key from: https://www.perplexity.ai/settings/api
 */
export declare function perplexitySearch(options: WebSearchOptions): Promise<SearchResult[]>;
/**
 * Generic web search that tries available providers in order
 */
export declare function webSearch(options: WebSearchOptions): Promise<SearchResult[]>;
/**
 * Specialized search for package verification
 */
export declare function searchPackageInfo(packageName: string): Promise<{
    npmWeeklyDownloads?: string;
    githubStars?: string;
    latestVersion?: string;
    lastUpdated?: string;
    knownVulnerabilities?: string[];
}>;
/**
 * Search for API documentation and examples
 */
export declare function searchAPIDocumentation(apiName: string): Promise<SearchResult[]>;
/**
 * Check if a service/API is still active
 */
export declare function checkServiceStatus(serviceName: string): Promise<{
    active: boolean;
    deprecated: boolean;
    alternativesFound: string[];
}>;
