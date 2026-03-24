/**
 * Pattern Manager — Phase 8 of AskElira 2.1
 *
 * All DB operations for the automation_patterns table.
 * Uses sql tagged template from @vercel/postgres (matching existing codebase pattern).
 */

import { sql } from '@vercel/postgres';
import type { ScrapedPattern } from './daily-scraper';

// ============================================================
// Interfaces
// ============================================================

export interface AutomationPattern {
  id: string;
  category: string;
  patternDescription: string;
  sourceUrl: string | null;
  implementationNotes: string | null;
  confidence: number;
  complexity: number | null;
  lastSeen: Date;
  useCount: number;
  successCount: number;
  failureCount: number;
  source: 'scraper' | 'customer_build' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryStats {
  category: string;
  totalPatterns: number;
  avgConfidence: number;
  provenPatterns: number;
}

// ============================================================
// Row mapper
// ============================================================

function mapPatternRow(row: Record<string, unknown>): AutomationPattern {
  return {
    id: row.id as string,
    category: row.category as string,
    patternDescription: row.pattern_description as string,
    sourceUrl: (row.source_url as string) ?? null,
    implementationNotes: (row.implementation_notes as string) ?? null,
    confidence: row.confidence as number,
    complexity: (row.complexity as number) ?? null,
    lastSeen: new Date(row.last_seen as string),
    useCount: (row.use_count as number) ?? 0,
    successCount: (row.success_count as number) ?? 0,
    failureCount: (row.failure_count as number) ?? 0,
    source: row.source as AutomationPattern['source'],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// ============================================================
// CRUD Operations
// ============================================================

/**
 * Upsert a scraped pattern by category + source_url.
 * On conflict: mean reversion on confidence, update last_seen and use_count.
 */
export async function upsertPattern(pattern: ScrapedPattern): Promise<void> {
  const { category, patternDescription, sourceUrl, implementationNotes, confidence } = pattern;

  // Use partial unique index on (category, source_url) WHERE source_url IS NOT NULL
  // If sourceUrl is null, always insert. Otherwise, upsert with mean reversion on confidence.
  if (!sourceUrl) {
    await sql`
      INSERT INTO automation_patterns (
        category, pattern_description, source_url,
        implementation_notes, confidence, last_seen, source
      )
      VALUES (
        ${category},
        ${patternDescription},
        ${null},
        ${implementationNotes},
        ${confidence},
        NOW(),
        'scraper'
      )
    `;
  } else {
    await sql`
      INSERT INTO automation_patterns (
        category, pattern_description, source_url,
        implementation_notes, confidence, last_seen, source
      )
      VALUES (
        ${category},
        ${patternDescription},
        ${sourceUrl},
        ${implementationNotes},
        ${confidence},
        NOW(),
        'scraper'
      )
      ON CONFLICT (category, source_url) WHERE source_url IS NOT NULL
      DO UPDATE SET
        pattern_description = ${patternDescription},
        implementation_notes = ${implementationNotes},
        confidence = (automation_patterns.confidence + ${confidence}) / 2.0,
        last_seen = NOW(),
        use_count = automation_patterns.use_count + 1,
        updated_at = NOW()
    `;
  }
}

/**
 * Get top patterns for a category, ordered by confidence DESC.
 * Only returns patterns seen within the last 14 days.
 */
export async function getTopPatterns(
  category: string,
  limit: number = 3,
  minConfidence: number = 0.6,
): Promise<AutomationPattern[]> {
  const { rows } = await sql`
    SELECT * FROM automation_patterns
    WHERE category = ${category}
      AND confidence >= ${minConfidence}
      AND last_seen >= NOW() - INTERVAL '14 days'
    ORDER BY confidence DESC
    LIMIT ${limit}
  `;

  return rows.map(mapPatternRow);
}

/**
 * Record a pattern success: confidence += 0.05 (max 0.95), success_count++
 */
export async function recordPatternSuccess(patternId: string): Promise<void> {
  await sql`
    UPDATE automation_patterns
    SET
      confidence = LEAST(0.95, confidence + 0.05),
      success_count = success_count + 1,
      updated_at = NOW()
    WHERE id = ${patternId}
  `;
}

/**
 * Record a pattern failure: confidence -= 0.10 (min 0.1), failure_count++
 */
export async function recordPatternFailure(patternId: string): Promise<void> {
  await sql`
    UPDATE automation_patterns
    SET
      confidence = GREATEST(0.1, confidence - 0.10),
      failure_count = failure_count + 1,
      updated_at = NOW()
    WHERE id = ${patternId}
  `;
}

/**
 * Save a pattern discovered during a customer build.
 * Source = 'customer_build', starting confidence = 0.65.
 */
export async function saveCustomerBuildPattern(params: {
  category: string;
  patternDescription: string;
  sourceUrl?: string;
  implementationNotes: string;
}): Promise<void> {
  await sql`
    INSERT INTO automation_patterns (
      category, pattern_description, source_url,
      implementation_notes, confidence, source, last_seen
    )
    VALUES (
      ${params.category},
      ${params.patternDescription},
      ${params.sourceUrl ?? null},
      ${params.implementationNotes},
      0.65,
      'customer_build',
      NOW()
    )
  `;
}

/**
 * Get aggregate stats for a category.
 */
export async function getCategoryStats(category: string): Promise<CategoryStats> {
  const { rows } = await sql`
    SELECT
      ${category} AS category,
      COUNT(*)::int AS total_patterns,
      COALESCE(AVG(confidence), 0)::float AS avg_confidence,
      COUNT(*) FILTER (WHERE confidence >= 0.7 AND success_count > 0)::int AS proven_patterns
    FROM automation_patterns
    WHERE category = ${category}
  `;

  const row = rows[0];
  return {
    category: row.category as string,
    totalPatterns: (row.total_patterns as number) ?? 0,
    avgConfidence: Math.round(((row.avg_confidence as number) ?? 0) * 100) / 100,
    provenPatterns: (row.proven_patterns as number) ?? 0,
  };
}

/**
 * Get all patterns for a category (no filters).
 */
export async function getPatternsByCategory(
  category: string,
  limit: number = 20,
): Promise<AutomationPattern[]> {
  const { rows } = await sql`
    SELECT * FROM automation_patterns
    WHERE category = ${category}
    ORDER BY confidence DESC
    LIMIT ${limit}
  `;

  return rows.map(mapPatternRow);
}

/**
 * Get stats for all categories that have patterns.
 */
export async function getAllCategoryStats(): Promise<CategoryStats[]> {
  const { rows } = await sql`
    SELECT
      category,
      COUNT(*)::int AS total_patterns,
      COALESCE(AVG(confidence), 0)::float AS avg_confidence,
      COUNT(*) FILTER (WHERE confidence >= 0.7 AND success_count > 0)::int AS proven_patterns
    FROM automation_patterns
    GROUP BY category
    ORDER BY avg_confidence DESC
  `;

  return rows.map((row) => ({
    category: row.category as string,
    totalPatterns: (row.total_patterns as number) ?? 0,
    avgConfidence: Math.round(((row.avg_confidence as number) ?? 0) * 100) / 100,
    provenPatterns: (row.proven_patterns as number) ?? 0,
  }));
}

// ============================================================
// Category Detection — keyword matching ONLY, no API calls
// ============================================================

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'lead-generation': ['lead', 'leads', 'prospect', 'prospecting', 'outreach', 'cold email', 'linkedin'],
  'email-automation': ['email', 'inbox', 'newsletter', 'mailchimp', 'sendgrid', 'smtp', 'email sequence'],
  'scheduling': ['schedule', 'calendar', 'appointment', 'booking', 'calendly', 'meeting'],
  'data-collection': ['scrape', 'scraping', 'data collection', 'web scraping', 'crawl', 'extract data'],
  'file-processing': ['file', 'pdf', 'csv', 'excel', 'document', 'spreadsheet', 'parse file'],
  'notifications': ['notification', 'alert', 'slack', 'discord', 'sms', 'push notification', 'webhook'],
  'crm': ['crm', 'salesforce', 'hubspot', 'customer relationship', 'pipeline', 'deal tracking'],
  'ecommerce': ['ecommerce', 'shopify', 'woocommerce', 'product', 'inventory', 'order', 'cart'],
  'social-media': ['social media', 'twitter', 'instagram', 'facebook', 'post scheduling', 'social'],
  'reporting': ['report', 'dashboard', 'analytics', 'metrics', 'kpi', 'visualization'],
  'customer-support': ['support', 'ticket', 'helpdesk', 'zendesk', 'chatbot', 'faq'],
  'payment-processing': ['payment', 'stripe', 'invoice', 'billing', 'subscription', 'checkout'],
  'data-sync': ['sync', 'integration', 'api', 'zapier', 'webhook', 'data transfer'],
  'ai-processing': ['ai', 'machine learning', 'nlp', 'sentiment', 'classification', 'gpt', 'claude'],
  'infrastructure': ['deploy', 'ci/cd', 'docker', 'monitoring', 'server', 'devops', 'infrastructure'],
};

/**
 * Detect automation category from floor metadata using keyword matching.
 * Returns null if no confident match.
 */
export function detectCategory(
  floorName: string,
  description: string,
  successCondition: string,
): string | null {
  const text = `${floorName} ${description} ${successCondition}`.toLowerCase();

  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += keyword.split(' ').length; // Multi-word keywords score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Require at least 1 keyword match
  return bestScore >= 1 ? bestCategory : null;
}
