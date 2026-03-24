/**
 * Steven Delta — Installment 5: Open Source Polish
 * Tests for SD-041 through SD-050
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  FAIL: ${name}`);
    console.error(`        ${msg}`);
    failed++;
  }
}

console.log('\n=== Steven Delta Installment 5: Open Source Polish ===\n');

// SD-041: Issue templates
test('SD-041: bug report template exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, '.github/ISSUE_TEMPLATE/bug_report.md')),
    'Bug report template should exist',
  );
  const src = fs.readFileSync(path.join(ROOT, '.github/ISSUE_TEMPLATE/bug_report.md'), 'utf-8');
  assert.ok(src.includes('Steps to Reproduce'), 'Should have reproduction steps');
});

test('SD-041: feature request template exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, '.github/ISSUE_TEMPLATE/feature_request.md')),
    'Feature request template should exist',
  );
  const src = fs.readFileSync(path.join(ROOT, '.github/ISSUE_TEMPLATE/feature_request.md'), 'utf-8');
  assert.ok(src.includes('Use Case'), 'Should have use case section');
});

// SD-042: PR template
test('SD-042: PR template exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, '.github/PULL_REQUEST_TEMPLATE.md')),
    'PR template should exist',
  );
  const src = fs.readFileSync(path.join(ROOT, '.github/PULL_REQUEST_TEMPLATE.md'), 'utf-8');
  assert.ok(src.includes('Checklist'), 'Should have checklist');
  assert.ok(src.includes('Description'), 'Should have description section');
});

// SD-043: GitHub Actions CI
test('SD-043: CI workflow has test, lint, and security jobs', () => {
  const src = fs.readFileSync(path.join(ROOT, '.github/workflows/test.yml'), 'utf-8');
  assert.ok(src.includes('test:'), 'Should have test job');
  assert.ok(src.includes('lint:'), 'Should have lint job');
  assert.ok(src.includes('security:'), 'Should have security job');
  assert.ok(src.includes('scan-secrets'), 'Should run secrets scan');
});

test('SD-043: CI runs on push and PR', () => {
  const src = fs.readFileSync(path.join(ROOT, '.github/workflows/test.yml'), 'utf-8');
  assert.ok(src.includes('push:'), 'Should trigger on push');
  assert.ok(src.includes('pull_request:'), 'Should trigger on PR');
});

// SD-044: Code of Conduct
test('SD-044: CODE_OF_CONDUCT.md exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'CODE_OF_CONDUCT.md')),
    'Code of Conduct should exist',
  );
  const src = fs.readFileSync(path.join(ROOT, 'CODE_OF_CONDUCT.md'), 'utf-8');
  assert.ok(src.includes('Contributor Covenant'), 'Should reference Contributor Covenant');
  assert.ok(src.includes('conduct@askelira.com'), 'Should have contact email');
});

// SD-045: Security policy
test('SD-045: SECURITY.md covers 2.1', () => {
  const src = fs.readFileSync(path.join(ROOT, 'SECURITY.md'), 'utf-8');
  assert.ok(src.includes('2.1.x'), 'Should cover version 2.1.x');
  assert.ok(src.includes('security@askelira.com'), 'Should have security email');
  assert.ok(src.includes('content-validator'), 'Should mention input validation');
  assert.ok(src.includes('rate-limiter'), 'Should mention rate limiting');
});

// SD-046: License file
test('SD-046: LICENSE exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'LICENSE')),
    'LICENSE file should exist',
  );
  const src = fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf-8');
  assert.ok(src.includes('Alvin Kerremans'), 'Should credit author');
});

// SD-047: CODEOWNERS
test('SD-047: CODEOWNERS exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, '.github/CODEOWNERS')),
    'CODEOWNERS should exist',
  );
  const src = fs.readFileSync(path.join(ROOT, '.github/CODEOWNERS'), 'utf-8');
  assert.ok(src.includes('@alvinkerremans'), 'Should have owner');
  assert.ok(src.includes('lib/step-runner.ts'), 'Should cover core files');
});

// SD-048: Dependabot
test('SD-048: dependabot.yml exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, '.github/dependabot.yml')),
    'Dependabot config should exist',
  );
  const src = fs.readFileSync(path.join(ROOT, '.github/dependabot.yml'), 'utf-8');
  assert.ok(src.includes('npm'), 'Should monitor npm');
  assert.ok(src.includes('github-actions'), 'Should monitor GitHub Actions');
  assert.ok(src.includes('weekly'), 'Should check weekly');
});

// SD-049: README badges
test('SD-049: README has badges', () => {
  const src = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
  assert.ok(src.includes('badge.svg') || src.includes('img.shields.io'), 'Should have badges');
  assert.ok(src.includes('Tests'), 'Should have tests badge');
  assert.ok(src.includes('npm'), 'Should have npm badge');
});

// SD-050: Final test suite
test('SD-050: all 5 installment test files exist', () => {
  for (let i = 1; i <= 5; i++) {
    assert.ok(
      fs.existsSync(path.join(ROOT, `test/test-steven-delta-installment-${i}.ts`)),
      `Installment ${i} test should exist`,
    );
  }
});

test('SD-050: test directory has new SD test files', () => {
  const testFiles = fs.readdirSync(path.join(ROOT, 'test')).filter(f => f.startsWith('test-'));
  const sdTests = testFiles.filter(f => f.includes('steven-delta') || f.includes('pipeline') || f.includes('load') || f.includes('notify') || f.includes('gateway') || f.includes('search') || f.includes('auth-middleware') || f.includes('rate-limiter') || f.includes('input-validation') || f.includes('migrations') || f.includes('cli-e2e'));
  assert.ok(sdTests.length >= 15, `Should have at least 15 SD test files, found ${sdTests.length}`);
});

console.log(`\n  Results: ${passed} passed, ${failed} failed (${passed + failed} total)\n`);
process.exit(failed > 0 ? 1 : 0);
