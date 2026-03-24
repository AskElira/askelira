/**
 * Integration test: Multi-file build flow
 *
 * Tests the normalization -> syntax validation -> serialization pipeline.
 * Does NOT require database or API access.
 *
 * Run: npx tsx test/test-multifile-build.ts
 */

import { normalizeDavidResult, serializeDavidResult } from '../lib/shared-types';
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
  // ── Test 1: David returns files[] -> normalize -> validate -> serialize ──

  console.log('\n1. Full pipeline: files[] -> normalize -> validate -> serialize');
  {
    const davidResponse = {
      files: [
        { name: 'index.js', content: 'const express = require("express");\nconst app = express();\napp.get("/", (req, res) => res.send("Hello"));\napp.listen(3000);' },
        { name: 'routes.js', content: 'module.exports = { health: (req, res) => res.json({ ok: true }) };' },
      ],
      language: 'javascript',
      entryPoint: 'index.js',
      dependencies: ['express'],
      selfAuditReport: 'Express server with routes.',
      handoffNotes: 'Run with node index.js',
    };

    // Step 1: Normalize
    const normalized = normalizeDavidResult(davidResponse);
    assert(normalized.files.length === 2, 'normalized has 2 files');
    assert(normalized.entryPoint === 'index.js', 'entryPoint correct');

    // Step 2: Validate syntax
    const syntaxResult = await validateSyntax(normalized.files);
    assert(syntaxResult.valid === true, 'syntax valid');
    assert(syntaxResult.checkedFiles.length === 2, '2 files checked');

    // Step 3: Set syntaxValid and serialize
    normalized.syntaxValid = syntaxResult.valid;
    const serialized = serializeDavidResult(normalized);
    const reparsed = JSON.parse(serialized);

    assert(reparsed.syntaxValid === true, 'syntaxValid stored');
    assert(Array.isArray(reparsed.files), 'files array in serialized');
    assert(reparsed.files.length === 2, '2 files in serialized');
    assert(typeof reparsed.buildOutput === 'string', 'buildOutput string for compat');
  }

  // ── Test 2: David returns bad syntax -> validation catches it ──

  console.log('\n2. Bad syntax detected by validator');
  {
    const davidResponse = {
      files: [
        { name: 'broken.js', content: 'const x = {\nconsole.log("oops");' },
      ],
      language: 'javascript',
      entryPoint: 'broken.js',
      dependencies: [],
      selfAuditReport: 'Looks good.',
      handoffNotes: 'Ready.',
    };

    const normalized = normalizeDavidResult(davidResponse);
    const syntaxResult = await validateSyntax(normalized.files);

    assert(syntaxResult.valid === false, 'syntax invalid');
    assert(syntaxResult.errors.length > 0, 'has errors');
    assert(syntaxResult.errors[0].includes('broken.js'), 'error mentions broken.js');
  }

  // ── Test 3: Mixed Python + JS files ──

  console.log('\n3. Mixed language files');
  {
    const davidResponse = {
      files: [
        { name: 'main.py', content: 'import json\nprint(json.dumps({"hello": "world"}))' },
        { name: 'config.js', content: 'module.exports = { port: 3000 };' },
      ],
      language: 'python',
      entryPoint: 'main.py',
      dependencies: [],
      selfAuditReport: 'Multi-lang test.',
      handoffNotes: 'Run main.py',
    };

    const normalized = normalizeDavidResult(davidResponse);
    const syntaxResult = await validateSyntax(normalized.files);

    assert(syntaxResult.valid === true, 'mixed files pass syntax');
    assert(syntaxResult.checkedFiles.length === 2, 'both files checked');
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
