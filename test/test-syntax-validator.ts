/**
 * Unit tests for validateSyntax
 *
 * Run: npx tsx test/test-syntax-validator.ts
 */

import { validateSyntax } from '../lib/syntax-validator';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  // ── Test 1: Valid JavaScript ──────────────────────────────────

  console.log('\n1. Valid JavaScript:');
  {
    const result = await validateSyntax([
      { name: 'index.js', content: 'const x = 1;\nconsole.log(x);' },
    ]);
    assert(result.valid === true, 'valid JS passes');
    assert(result.errors.length === 0, 'no errors');
    assert(result.checkedFiles.includes('index.js'), 'index.js was checked');
  }

  // ── Test 2: Invalid JavaScript ─────────────────────────────────

  console.log('\n2. Invalid JavaScript:');
  {
    const result = await validateSyntax([
      { name: 'bad.js', content: 'const x = {\nconsole.log(x);' },
    ]);
    assert(result.valid === false, 'invalid JS fails');
    assert(result.errors.length > 0, 'has errors');
    assert(result.errors[0].includes('bad.js'), 'error mentions filename');
  }

  // ── Test 3: Valid Python ──────────────────────────────────────

  console.log('\n3. Valid Python:');
  {
    const result = await validateSyntax([
      { name: 'main.py', content: 'def hello():\n    print("hello")\n\nhello()' },
    ]);
    assert(result.valid === true, 'valid Python passes');
    assert(result.checkedFiles.includes('main.py'), 'main.py was checked');
  }

  // ── Test 4: Invalid Python ─────────────────────────────────────

  console.log('\n4. Invalid Python:');
  {
    const result = await validateSyntax([
      { name: 'bad.py', content: 'def hello(\n  print("hello")' },
    ]);
    assert(result.valid === false, 'invalid Python fails');
    assert(result.errors.length > 0, 'has errors');
    assert(result.errors[0].includes('bad.py'), 'error mentions filename');
  }

  // ── Test 5: Empty array ─────────────────────────────────────────

  console.log('\n5. Empty file array:');
  {
    const result = await validateSyntax([]);
    assert(result.valid === true, 'empty array is valid');
    assert(result.checkedFiles.length === 0, 'no files checked');
  }

  // ── Test 6: Unknown language ────────────────────────────────────

  console.log('\n6. Unknown language (.txt):');
  {
    const result = await validateSyntax([
      { name: 'readme.txt', content: 'This is just text.' },
    ]);
    assert(result.valid === true, 'unknown extension passes (skipped)');
    assert(result.checkedFiles.length === 0, 'no files actually checked');
  }

  // ── Test 7: Multiple files (mix of valid and invalid) ───────────

  console.log('\n7. Multiple files (one bad):');
  {
    const result = await validateSyntax([
      { name: 'good.js', content: 'const a = 1;' },
      { name: 'bad.js', content: 'const b = {' },
    ]);
    assert(result.valid === false, 'overall invalid');
    assert(result.checkedFiles.length === 2, '2 files checked');
    assert(result.errors.length === 1, '1 error');
    assert(result.errors[0].includes('bad.js'), 'error is from bad.js');
  }

  // ── Test 8: Cleanup verification ──────────────────────────────

  console.log('\n8. Cleanup (temp dir should not exist after run):');
  {
    // We can verify by running validation and checking no temp dirs leaked
    const fs = await import('fs');
    const os = await import('os');
    const tmpDir = os.tmpdir();
    const before = fs.readdirSync(tmpDir).filter(d => d.startsWith('askelira-syntax-'));

    await validateSyntax([
      { name: 'test.js', content: 'const x = 1;' },
    ]);

    const after = fs.readdirSync(tmpDir).filter(d => d.startsWith('askelira-syntax-'));
    assert(after.length <= before.length, 'no temp dirs leaked');
  }

  // ── Summary ───────────────────────────────────────────────────

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
