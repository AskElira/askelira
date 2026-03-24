/**
 * Seed script for testing the building state database.
 * Creates a test goal with 4 floors for a Miami Google Maps scraper.
 *
 * Usage:
 *   npx tsx scripts/seed-test-building.ts
 *
 * Requires POSTGRES_URL env var (Vercel Postgres connection string).
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '..', '.env') });

import {
  createGoal,
  createFloor,
} from '../lib/building-manager';

async function seed() {
  console.log('Seeding test building state...\n');

  // 1. Create the goal
  const goal = await createGoal({
    customerId: 'test-user-001',
    goalText:
      'Build a Miami Google Maps scraper that extracts business listings daily and emails a CSV report',
    customerContext: {
      location: 'Miami, FL',
      targetBusinessType: 'restaurants',
      deliveryMethod: 'email',
      frequency: 'daily',
    },
  });

  console.log(`Goal created: ${goal.id}`);
  console.log(`  Text: ${goal.goalText}`);
  console.log(`  Status: ${goal.status}\n`);

  // 2. Create 4 floors
  const floors = [
    {
      floorNumber: 1,
      name: 'Research',
      description:
        'Research Google Maps scraping methods, anti-bot protections, and available APIs. Identify the best approach for extracting Miami business listings.',
      successCondition:
        'A documented research report with recommended scraping approach, API options, and risk assessment.',
    },
    {
      floorNumber: 2,
      name: 'Build Scraper',
      description:
        'Build the Google Maps scraper using the researched approach. Extract business name, address, phone, rating, and hours for Miami restaurants.',
      successCondition:
        'A working scraper script that extracts at least 50 Miami restaurant listings and outputs valid JSON.',
    },
    {
      floorNumber: 3,
      name: 'Daily Cron',
      description:
        'Set up a daily cron job that runs the scraper automatically. Include error handling, retry logic, and logging.',
      successCondition:
        'A cron configuration that triggers the scraper daily at 6 AM EST with error notifications.',
    },
    {
      floorNumber: 4,
      name: 'Email Delivery',
      description:
        'Build an email delivery system that converts scraped data to CSV and sends it to the customer. Include formatting and error handling.',
      successCondition:
        'An email is sent with a properly formatted CSV attachment containing the daily scraping results.',
    },
  ];

  for (const floorDef of floors) {
    const floor = await createFloor({
      goalId: goal.id,
      ...floorDef,
    });
    console.log(
      `  Floor ${floor.floorNumber} (${floor.name}): ${floor.id}`,
    );
  }

  console.log(`\nSeed complete. Goal ID: ${goal.id}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
