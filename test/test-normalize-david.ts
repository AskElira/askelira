/**
 * Unit tests for normalizeDavidResult
 *
 * Run: npx tsx test/test-normalize-david.ts
 */

import { normalizeDavidResult, serializeDavidResult } from '../lib/shared-types';

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

// ── Test: New files[] format ──────────────────────────────────

console.log('\n1. New files[] format:');
{
  const input = {
    files: [
      { name: 'index.js', content: 'console.log("hello");' },
      { name: 'utils.js', content: 'module.exports = {};' },
    ],
    language: 'javascript',
    entryPoint: 'index.js',
    dependencies: ['express'],
    selfAuditReport: 'All good.',
    handoffNotes: 'Done.',
  };

  const result = normalizeDavidResult(input);
  assert(result.files.length === 2, 'has 2 files');
  assert(result.files[0].name === 'index.js', 'first file is index.js');
  assert(result.entryPoint === 'index.js', 'entryPoint is index.js');
  assert(result.language === 'javascript', 'language is javascript');
  assert(result.dependencies.length === 1, 'has 1 dependency');
  assert(result.dependencies[0] === 'express', 'dependency is express');
  assert(result.selfAuditReport === 'All good.', 'selfAuditReport preserved');
}

// ── Test: Old buildOutput string format ───────────────────────

console.log('\n2. Old buildOutput string format:');
{
  const input = {
    buildOutput: 'console.log("hello world");',
    language: 'javascript',
    entryPoint: 'main.js',
    dependencies: [],
    selfAuditReport: 'Simple script.',
    handoffNotes: 'Ready.',
  };

  const result = normalizeDavidResult(input);
  assert(result.files.length === 1, 'has 1 file');
  assert(result.files[0].name === 'main.js', 'file name from entryPoint');
  assert(result.files[0].content === 'console.log("hello world");', 'content matches buildOutput');
  assert(result.entryPoint === 'main.js', 'entryPoint preserved');
  assert(result.buildOutput === 'console.log("hello world");', 'buildOutput backward compat');
}

// ── Test: Raw code string ─────────────────────────────────────

console.log('\n3. Raw code string (not JSON):');
{
  const result = normalizeDavidResult('print("hello")');
  assert(result.files.length === 1, 'has 1 file');
  assert(result.files[0].name === 'main.js', 'defaults to main.js');
  assert(result.files[0].content === 'print("hello")', 'content is raw string');
}

// ── Test: Double-serialized JSON string ───────────────────────

console.log('\n4. Double-serialized JSON string:');
{
  const inner = {
    files: [{ name: 'app.py', content: 'print("hi")' }],
    language: 'python',
    entryPoint: 'app.py',
    dependencies: [],
    selfAuditReport: 'Works.',
    handoffNotes: 'Go.',
  };
  const doubleStr = JSON.stringify(JSON.stringify(inner));
  // Remove outer quotes since it's a JS string, not JSON-in-JSON
  const result = normalizeDavidResult(JSON.stringify(inner));
  assert(result.files.length === 1, 'has 1 file');
  assert(result.files[0].name === 'app.py', 'file name is app.py');
  assert(result.language === 'python', 'language is python');
}

// ── Test: null / undefined / empty ────────────────────────────

console.log('\n5. null / undefined / empty:');
{
  const nullResult = normalizeDavidResult(null);
  assert(nullResult.files.length === 0, 'null -> empty files');

  const undefinedResult = normalizeDavidResult(undefined);
  assert(undefinedResult.files.length === 0, 'undefined -> empty files');

  const emptyResult = normalizeDavidResult('');
  assert(emptyResult.files.length === 0, 'empty string -> empty files');

  const emptyObjResult = normalizeDavidResult({});
  assert(emptyObjResult.files.length === 0, 'empty object -> empty files');
}

// ── Test: serializeDavidResult round-trip ──────────────────────

console.log('\n6. serializeDavidResult round-trip:');
{
  const original = normalizeDavidResult({
    files: [
      { name: 'index.js', content: 'const x = 1;' },
      { name: 'helper.js', content: 'module.exports = {};' },
    ],
    language: 'javascript',
    entryPoint: 'index.js',
    dependencies: ['lodash'],
    selfAuditReport: 'OK',
    handoffNotes: 'Done',
    syntaxValid: true,
  });

  const serialized = serializeDavidResult(original);
  const reparsed = normalizeDavidResult(JSON.parse(serialized));

  assert(reparsed.files.length === 2, 'round-trip preserves 2 files');
  assert(reparsed.entryPoint === 'index.js', 'round-trip preserves entryPoint');
  assert(reparsed.syntaxValid === true, 'round-trip preserves syntaxValid');
  assert(reparsed.dependencies[0] === 'lodash', 'round-trip preserves dependencies');

  // Also has buildOutput for backward compat
  const raw = JSON.parse(serialized);
  assert(typeof raw.buildOutput === 'string', 'serialized has buildOutput string for compat');
}

// ── Test: Old format from DB (JSON.stringify of old DavidResult) ──

console.log('\n7. Old DB format (JSON.stringify of old DavidResult):');
{
  const oldDbValue = JSON.stringify({
    buildOutput: 'const http = require("http");\nhttp.createServer().listen(3000);',
    language: 'javascript',
    entryPoint: 'server.js',
    dependencies: ['http'],
    selfAuditReport: 'Simple HTTP server.',
    handoffNotes: 'Runs on port 3000.',
  });

  // This is what the DB stores: a JSON string
  const result = normalizeDavidResult(JSON.parse(oldDbValue));
  assert(result.files.length === 1, 'has 1 file');
  assert(result.files[0].name === 'server.js', 'file name from entryPoint');
  assert(result.files[0].content.includes('http.createServer'), 'content has server code');
  assert(result.language === 'javascript', 'language preserved');
}

// ── Summary ───────────────────────────────────────────────────

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
