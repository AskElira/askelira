#!/usr/bin/env node

/**
 * AskElira Release Preparation Script
 *
 * Usage:
 *   node scripts/prepare-release.js patch   # 2.0.0 -> 2.0.1
 *   node scripts/prepare-release.js minor   # 2.0.0 -> 2.1.0
 *   node scripts/prepare-release.js major   # 2.0.0 -> 3.0.0
 *   node scripts/prepare-release.js 2.1.0   # explicit version
 *
 * Steps:
 *   1. Validate package.json
 *   2. Check git working directory is clean
 *   3. Run tests
 *   4. Bump version in package.json and bin/cli.js
 *   5. Generate release notes from CHANGELOG.md
 *   6. Create git commit and tag
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const CLI_PATH = path.join(ROOT, 'bin', 'cli.js');
const CHANGELOG_PATH = path.join(ROOT, 'docs', 'CHANGELOG.md');

function main() {
  const bump = process.argv[2];
  if (!bump) {
    console.error('Usage: node scripts/prepare-release.js <patch|minor|major|x.y.z>');
    process.exit(1);
  }

  console.log('AskElira Release Preparation\n');

  // Step 1: Validate package.json
  step('Validating package.json');
  const pkg = validatePackageJson();
  ok(`${pkg.name}@${pkg.version}`);

  // Step 2: Check git status
  step('Checking git status');
  checkGitClean();
  ok('Working directory clean');

  // Step 3: Run tests
  step('Running tests');
  runTests();
  ok('All tests passed');

  // Step 4: Bump version
  step('Bumping version');
  const oldVersion = pkg.version;
  const newVersion = resolveVersion(oldVersion, bump);
  updateVersion(newVersion);
  ok(`${oldVersion} -> ${newVersion}`);

  // Step 5: Generate release notes
  step('Generating release notes');
  const notes = generateReleaseNotes(newVersion);
  const notesPath = path.join(ROOT, 'RELEASE_NOTES.md');
  fs.writeFileSync(notesPath, notes, 'utf-8');
  ok(`Written to RELEASE_NOTES.md (${notes.split('\n').length} lines)`);

  // Step 6: Create git commit and tag
  step('Creating git commit and tag');
  createGitTag(newVersion);
  ok(`Tagged v${newVersion}`);

  console.log('\n--- Release Ready ---\n');
  console.log(`Version:  ${newVersion}`);
  console.log(`Tag:      v${newVersion}`);
  console.log(`Notes:    RELEASE_NOTES.md\n`);
  console.log('Next steps:');
  console.log('  git push && git push --tags');
  console.log('  npm publish');
  console.log('');
}

// ---------------------------------------------------------------------------
// Step implementations
// ---------------------------------------------------------------------------

function validatePackageJson() {
  if (!fs.existsSync(PKG_PATH)) {
    fail('package.json not found');
  }

  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  const required = ['name', 'version', 'description', 'main', 'license'];
  const missing = required.filter((key) => !pkg[key]);

  if (missing.length > 0) {
    fail(`package.json missing fields: ${missing.join(', ')}`);
  }

  if (!pkg.bin || !pkg.bin.askelira) {
    fail('package.json missing bin.askelira');
  }

  return pkg;
}

function checkGitClean() {
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf-8' }).trim();
    if (status) {
      fail(`Uncommitted changes:\n${status}\n\nCommit or stash changes before releasing.`);
    }
  } catch (err) {
    fail(`Git check failed: ${err.message}`);
  }
}

function runTests() {
  try {
    execSync('node test/agents.test.js', { cwd: ROOT, stdio: 'pipe' });
    execSync('node test/memory.test.js', { cwd: ROOT, stdio: 'pipe' });
    execSync('node test/swarm.test.js', { cwd: ROOT, stdio: 'pipe' });
    execSync('node test/utils.test.js', { cwd: ROOT, stdio: 'pipe' });
  } catch (err) {
    const output = err.stdout ? err.stdout.toString() : err.message;
    fail(`Tests failed:\n${output}`);
  }
}

function resolveVersion(current, bump) {
  if (/^\d+\.\d+\.\d+$/.test(bump)) {
    return bump;
  }

  const parts = current.split('.').map(Number);

  switch (bump) {
    case 'patch':
      parts[2]++;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    default:
      fail(`Invalid bump type: "${bump}". Use patch, minor, major, or x.y.z`);
  }

  return parts.join('.');
}

function updateVersion(newVersion) {
  // Update package.json
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  pkg.version = newVersion;
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

  // Update bin/cli.js .version() call
  if (fs.existsSync(CLI_PATH)) {
    let cli = fs.readFileSync(CLI_PATH, 'utf-8');
    cli = cli.replace(/\.version\(['"][\d.]+['"]\)/, `.version('${newVersion}')`);
    fs.writeFileSync(CLI_PATH, cli, 'utf-8');
  }
}

function generateReleaseNotes(version) {
  const lines = [`# Release v${version}\n`];
  const date = new Date().toISOString().split('T')[0];
  lines.push(`Released: ${date}\n`);

  // Extract section from CHANGELOG.md if it exists
  if (fs.existsSync(CHANGELOG_PATH)) {
    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');

    // Try to find the section for this version
    const sectionRegex = new RegExp(
      `## \\[${escapeRegex(version)}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## \\[|$)`
    );
    const match = changelog.match(sectionRegex);

    if (match) {
      lines.push(match[1].trim());
    } else {
      // Fall back to most recent section
      const anySection = changelog.match(/## \[\d+\.\d+\.\d+\][^\n]*\n([\s\S]*?)(?=\n## \[|$)/);
      if (anySection) {
        lines.push('*Changes from latest CHANGELOG entry:*\n');
        lines.push(anySection[1].trim());
      } else {
        lines.push('See docs/CHANGELOG.md for details.');
      }
    }
  } else {
    lines.push('No CHANGELOG.md found. Add release notes manually.');
  }

  lines.push('\n---\n');
  lines.push(`Full changelog: docs/CHANGELOG.md`);
  lines.push(`npm: https://www.npmjs.com/package/askelira/v/${version}`);
  lines.push('');

  return lines.join('\n');
}

function createGitTag(version) {
  try {
    execSync(`git add package.json bin/cli.js`, { cwd: ROOT, stdio: 'pipe' });

    // Check if RELEASE_NOTES.md was created
    const notesPath = path.join(ROOT, 'RELEASE_NOTES.md');
    if (fs.existsSync(notesPath)) {
      execSync(`git add RELEASE_NOTES.md`, { cwd: ROOT, stdio: 'pipe' });
    }

    execSync(`git commit -m "release: v${version}"`, { cwd: ROOT, stdio: 'pipe' });
    execSync(`git tag -a v${version} -m "v${version}"`, { cwd: ROOT, stdio: 'pipe' });
  } catch (err) {
    fail(`Git operations failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function step(message) {
  process.stdout.write(`  ${message}... `);
}

function ok(detail) {
  console.log(`OK (${detail})`);
}

function fail(message) {
  console.error(`FAILED\n\n  ${message}\n`);
  process.exit(1);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
