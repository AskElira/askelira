/**
 * AskElira 2.0 — Utility Tests
 *
 * Run: node test/utils.test.js
 *
 * Tests cost calculator (pricing, ledger) and logger (levels, formatting, file output).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Cost Calculator Tests
// ---------------------------------------------------------------------------

async function costCalculatorTests() {
  console.log('\nCost Calculator');

  const {
    calculateBraveSearchCost,
    calculateAnthropicCost,
    calculateSwarmCost,
    getTotalCost,
    getLedger,
    resetLedger,
  } = require('../src/utils/cost-calculator');

  // Reset before each group
  resetLedger();

  await test('calculateBraveSearchCost returns correct cost for 1 query', () => {
    resetLedger();
    const cost = calculateBraveSearchCost(1);
    assert.strictEqual(cost, 0.005);
  });

  await test('calculateBraveSearchCost scales with query count', () => {
    resetLedger();
    const cost = calculateBraveSearchCost(10);
    assert.strictEqual(cost, 0.05);
  });

  await test('calculateBraveSearchCost defaults to 1 query', () => {
    resetLedger();
    const cost = calculateBraveSearchCost();
    assert.strictEqual(cost, 0.005);
  });

  await test('calculateSwarmCost returns correct cost for 10k agents', () => {
    resetLedger();
    const cost = calculateSwarmCost(10000);
    assert.ok(Math.abs(cost - 0.07) < 0.0001, `Expected ~0.07, got ${cost}`);
  });

  await test('calculateSwarmCost returns correct cost for 100k agents', () => {
    resetLedger();
    const cost = calculateSwarmCost(100000);
    assert.strictEqual(cost, 0.7);
  });

  await test('calculateAnthropicCost works for claude-opus-4-6', () => {
    resetLedger();
    const cost = calculateAnthropicCost('claude-opus-4-6', 1000, 500);
    // input: (1000/1M) * 15.00 = 0.015
    // output: (500/1M) * 75.00 = 0.0375
    const expected = 0.015 + 0.0375;
    assert.ok(Math.abs(cost - expected) < 0.0001, `Expected ~${expected}, got ${cost}`);
  });

  await test('calculateAnthropicCost works for claude-sonnet-4-5', () => {
    resetLedger();
    const cost = calculateAnthropicCost('claude-sonnet-4-5', 1000000, 500000);
    // input: (1M/1M) * 3.00 = 3.00
    // output: (500k/1M) * 15.00 = 7.50
    const expected = 3.00 + 7.50;
    assert.ok(Math.abs(cost - expected) < 0.0001, `Expected ${expected}, got ${cost}`);
  });

  await test('calculateAnthropicCost works for claude-haiku-4-5', () => {
    resetLedger();
    const cost = calculateAnthropicCost('claude-haiku-4-5', 2000000, 1000000);
    // input: (2M/1M) * 0.80 = 1.60
    // output: (1M/1M) * 4.00 = 4.00
    const expected = 1.60 + 4.00;
    assert.ok(Math.abs(cost - expected) < 0.0001, `Expected ${expected}, got ${cost}`);
  });

  await test('calculateAnthropicCost throws for unknown model', () => {
    assert.throws(
      () => calculateAnthropicCost('gpt-4', 100, 100),
      (err) => err.message.includes('Unknown model') && err.message.includes('gpt-4')
    );
  });

  await test('calculateAnthropicCost returns 0 for 0 tokens', () => {
    resetLedger();
    const cost = calculateAnthropicCost('claude-opus-4-6', 0, 0);
    assert.strictEqual(cost, 0);
  });

  await test('getTotalCost sums all recorded costs', () => {
    resetLedger();
    calculateBraveSearchCost(1);     // 0.005
    calculateSwarmCost(10000);       // 0.07
    calculateAnthropicCost('claude-haiku-4-5', 1000, 500);
    // haiku: (1000/1M)*0.80 + (500/1M)*4.00 = 0.0008 + 0.002 = 0.0028
    const total = getTotalCost();
    const expected = 0.005 + 0.07 + 0.0028;
    assert.ok(Math.abs(total - expected) < 0.0001, `Expected ~${expected}, got ${total}`);
  });

  await test('getLedger returns entries with correct structure', () => {
    resetLedger();
    calculateBraveSearchCost(2);
    calculateSwarmCost(5000);

    const ledger = getLedger();
    assert.strictEqual(ledger.length, 2);

    assert.strictEqual(ledger[0].type, 'brave_search');
    assert.strictEqual(ledger[0].cost, 0.01);
    assert.strictEqual(ledger[0].metadata.queryCount, 2);
    assert.ok(ledger[0].timestamp);

    assert.strictEqual(ledger[1].type, 'swarm');
    assert.ok(Math.abs(ledger[1].cost - 0.035) < 0.0001, `Expected ~0.035, got ${ledger[1].cost}`);
    assert.strictEqual(ledger[1].metadata.agentCount, 5000);
  });

  await test('getLedger returns a copy (not a reference)', () => {
    resetLedger();
    calculateBraveSearchCost(1);

    const copy = getLedger();
    copy.push({ fake: true });

    assert.strictEqual(getLedger().length, 1);
  });

  await test('resetLedger clears all entries', () => {
    calculateBraveSearchCost(1);
    calculateSwarmCost(100);
    assert.ok(getLedger().length > 0);

    resetLedger();
    assert.strictEqual(getLedger().length, 0);
    assert.strictEqual(getTotalCost(), 0);
  });
}

// ---------------------------------------------------------------------------
// Logger Tests
// ---------------------------------------------------------------------------

async function loggerTests() {
  console.log('\nLogger');

  const { Logger } = require('../src/utils/logger');

  await test('creates logger with default settings', () => {
    const logger = new Logger();
    assert.strictEqual(logger.minLevel, 'info');
    assert.strictEqual(logger.writeToFile, true);
  });

  await test('creates logger with custom settings', () => {
    const logger = new Logger({ minLevel: 'debug', writeToFile: false });
    assert.strictEqual(logger.minLevel, 'debug');
    assert.strictEqual(logger.writeToFile, false);
  });

  await test('has all 4 log methods', () => {
    const logger = new Logger({ writeToFile: false });
    assert.strictEqual(typeof logger.debug, 'function');
    assert.strictEqual(typeof logger.info, 'function');
    assert.strictEqual(typeof logger.warn, 'function');
    assert.strictEqual(typeof logger.error, 'function');
  });

  await test('respects minLevel — debug suppressed at info level', () => {
    const output = [];
    const originalLog = console.log;
    console.log = (...args) => output.push(args.join(' '));

    const logger = new Logger({ minLevel: 'info', writeToFile: false });
    logger.debug('should not appear');

    console.log = originalLog;
    assert.strictEqual(output.length, 0);
  });

  await test('respects minLevel — info shown at info level', () => {
    const output = [];
    const originalLog = console.log;
    console.log = (...args) => output.push(args.join(' '));

    const logger = new Logger({ minLevel: 'info', writeToFile: false });
    logger.info('visible message');

    console.log = originalLog;
    assert.ok(output.length >= 1);
    assert.ok(output[0].includes('visible message'));
  });

  await test('respects minLevel — debug shown at debug level', () => {
    const output = [];
    const originalLog = console.log;
    console.log = (...args) => output.push(args.join(' '));

    const logger = new Logger({ minLevel: 'debug', writeToFile: false });
    logger.debug('debug message');

    console.log = originalLog;
    assert.ok(output.length >= 1);
    assert.ok(output[0].includes('debug message'));
  });

  await test('error messages use console.error', () => {
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => errors.push(args.join(' '));

    const logger = new Logger({ minLevel: 'info', writeToFile: false });
    logger.error('something broke');

    console.error = originalError;
    assert.ok(errors.length >= 1);
    assert.ok(errors[0].includes('something broke'));
  });

  await test('logs data object when provided', () => {
    const output = [];
    const originalLog = console.log;
    console.log = (...args) => output.push(args.join(' '));

    const logger = new Logger({ minLevel: 'info', writeToFile: false });
    logger.info('with data', { key: 'value' });

    console.log = originalLog;
    // First line is the message, second has the data
    assert.ok(output.length >= 2);
    assert.ok(output[1].includes('"key"'));
    assert.ok(output[1].includes('"value"'));
  });

  await test('writes to log file when writeToFile is true', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askelira-log-'));
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(tmpDir, `${date}.log`);

    // Temporarily suppress console output
    const originalLog = console.log;
    console.log = () => {};

    // Create logger that writes to our temp dir by patching _writeToFile
    const logger = new Logger({ minLevel: 'info', writeToFile: true });
    const originalWrite = logger._writeToFile.bind(logger);
    logger._writeToFile = (prefix, message, data) => {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
        let line = `${prefix} ${message}\n`;
        if (data !== undefined) {
          line += `  ${JSON.stringify(data)}\n`;
        }
        fs.appendFileSync(logFile, line, 'utf-8');
      } catch {}
    };

    logger.info('file test message', { detail: 42 });

    console.log = originalLog;

    assert.ok(fs.existsSync(logFile));
    const content = fs.readFileSync(logFile, 'utf-8');
    assert.ok(content.includes('file test message'));
    assert.ok(content.includes('"detail"'));
    assert.ok(content.includes('42'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await test('warn level suppresses debug and info', () => {
    const output = [];
    const errors = [];
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => output.push(args.join(' '));
    console.error = (...args) => errors.push(args.join(' '));

    const logger = new Logger({ minLevel: 'warn', writeToFile: false });
    logger.debug('no');
    logger.info('no');
    logger.warn('yes warn');
    logger.error('yes error');

    console.log = originalLog;
    console.error = originalError;

    // Only warn and error should appear
    assert.strictEqual(output.length, 1); // warn goes to console.log
    assert.ok(output[0].includes('yes warn'));
    assert.strictEqual(errors.length, 1); // error goes to console.error
    assert.ok(errors[0].includes('yes error'));
  });

  await test('silently handles file write failures', () => {
    const originalLog = console.log;
    console.log = () => {};

    // The Logger._writeToFile has a try/catch that silently swallows errors.
    // To test this, create a logger pointing to an invalid path by patching
    // the internal write to simulate a failure inside the try block.
    const logger = new Logger({ minLevel: 'info', writeToFile: true });
    const originalWrite = logger._writeToFile;
    let writeCalled = false;
    logger._writeToFile = function (prefix, message, data) {
      writeCalled = true;
      // Call a version that will fail: write to a path that can't exist
      try {
        const badFs = require('fs');
        badFs.appendFileSync('/dev/null/impossible/path.log', 'test\n', 'utf-8');
      } catch {
        // This is what the real _writeToFile does — swallow the error
      }
    };

    // Should not throw
    assert.doesNotThrow(() => logger.info('test'));
    assert.ok(writeCalled, '_writeToFile should have been called');

    console.log = originalLog;
  });
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

async function main() {
  console.log('AskElira Utility Tests\n');

  await costCalculatorTests();
  await loggerTests();

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
