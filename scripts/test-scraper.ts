/**
 * Test script for the daily scraper — Phase 8
 *
 * Usage: npm run scraper:test
 * Or:    npx tsx scripts/test-scraper.ts
 *
 * Tests the scraper against one category and prints results.
 * Requires BRAVE_SEARCH_API_KEY and ANTHROPIC_API_KEY in .env.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '..', '.env') });

import { scrapeCategory } from '../lib/daily-scraper';
import { detectCategory } from '../lib/pattern-manager';
import { SCRAPER_CATEGORIES } from '../lib/scraper-categories';

async function main() {
  console.log('=== AskElira Daily Scraper Test ===\n');

  // Test 1: Category detection
  console.log('--- Test: detectCategory ---');
  const testCases = [
    { name: 'Email Drip Setup', desc: 'Set up automated email drip campaign', sc: 'Emails are sent on schedule' },
    { name: 'Scrape Competitors', desc: 'Scrape competitor pricing data', sc: 'Pricing data CSV is generated daily' },
    { name: 'Deploy API', desc: 'Deploy REST API to production', sc: 'API responds with 200 status' },
    { name: 'Generic Thing', desc: 'Do something random', sc: 'It works' },
  ];

  for (const tc of testCases) {
    const cat = detectCategory(tc.name, tc.desc, tc.sc);
    console.log(`  "${tc.name}" -> ${cat ?? '(no match)'}`);
  }

  // Test 2: Scrape one category
  const testCategory = process.argv[2] || 'email-automation';
  console.log(`\n--- Test: scrapeCategory("${testCategory}") ---`);
  console.log('(This makes real API calls and may take 30-60 seconds...)\n');

  const startTime = Date.now();
  const patterns = await scrapeCategory(testCategory);
  const elapsed = Date.now() - startTime;

  console.log(`Found ${patterns.length} patterns in ${elapsed}ms:\n`);

  for (const p of patterns) {
    console.log(`  [${Math.round(p.confidence * 100)}%] ${p.patternDescription}`);
    console.log(`    Notes: ${p.implementationNotes.slice(0, 120)}...`);
    console.log(`    Source: ${p.sourceUrl}`);
    console.log('');
  }

  // Test 3: Category list
  console.log(`--- Scraper Categories: ${SCRAPER_CATEGORIES.length} total ---`);
  const domains = ['Lead Gen', 'Email', 'Scheduling', 'Data', 'File', 'Notifications', 'CRM', 'E-commerce', 'Infrastructure', 'AI'];
  for (let i = 0; i < domains.length; i++) {
    const slice = SCRAPER_CATEGORIES.slice(i * 5, (i + 1) * 5);
    console.log(`  ${domains[i]}: ${slice.join(', ')}`);
  }

  console.log('\n=== Test complete ===');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
