#!/usr/bin/env node

/**
 * AskElira Version Bump
 *
 * Usage:
 *   node scripts/version-bump.js patch   # 2.0.0 -> 2.0.1
 *   node scripts/version-bump.js minor   # 2.0.0 -> 2.1.0
 *   node scripts/version-bump.js major   # 2.0.0 -> 3.0.0
 *
 * Updates version in:
 *   - package.json
 *   - bin/cli.js (.version() call)
 *
 * Then creates a git commit and tag.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const CLI_PATH = path.join(ROOT, 'bin', 'cli.js');

function bumpPatch(version) {
  const parts = version.split('.').map(Number);
  parts[2]++;
  return parts.join('.');
}

function bumpMinor(version) {
  const parts = version.split('.').map(Number);
  parts[1]++;
  parts[2] = 0;
  return parts.join('.');
}

function bumpMajor(version) {
  const parts = version.split('.').map(Number);
  parts[0]++;
  parts[1] = 0;
  parts[2] = 0;
  return parts.join('.');
}

function readVersion() {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  return pkg.version;
}

function writeVersion(newVersion) {
  const filesTouched = [];

  // package.json
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  pkg.version = newVersion;
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  filesTouched.push('package.json');

  // bin/cli.js
  if (fs.existsSync(CLI_PATH)) {
    let cli = fs.readFileSync(CLI_PATH, 'utf-8');
    const updated = cli.replace(/\.version\(['"][\d.]+['"]\)/, `.version('${newVersion}')`);
    if (updated !== cli) {
      fs.writeFileSync(CLI_PATH, updated, 'utf-8');
      filesTouched.push('bin/cli.js');
    }
  }

  return filesTouched;
}

function gitCommitAndTag(version, files) {
  const fileArgs = files.join(' ');
  execSync(`git add ${fileArgs}`, { cwd: ROOT, stdio: 'pipe' });
  execSync(`git commit -m "chore: bump version to ${version}"`, { cwd: ROOT, stdio: 'pipe' });
  execSync(`git tag -a v${version} -m "v${version}"`, { cwd: ROOT, stdio: 'pipe' });
}

function main() {
  const type = process.argv[2];

  if (!type || !['patch', 'minor', 'major'].includes(type)) {
    console.error('Usage: node scripts/version-bump.js [patch|minor|major]');
    process.exit(1);
  }

  const oldVersion = readVersion();

  let newVersion;
  switch (type) {
    case 'patch': newVersion = bumpPatch(oldVersion); break;
    case 'minor': newVersion = bumpMinor(oldVersion); break;
    case 'major': newVersion = bumpMajor(oldVersion); break;
  }

  console.log(`Bumping ${type}: ${oldVersion} -> ${newVersion}\n`);

  const files = writeVersion(newVersion);
  files.forEach((f) => console.log(`  Updated ${f}`));

  try {
    gitCommitAndTag(newVersion, files);
    console.log(`\n  Committed and tagged v${newVersion}`);
    console.log(`\n  Next: git push && git push --tags`);
  } catch (err) {
    console.error(`\n  Git failed: ${err.message}`);
    console.log(`  Files updated but not committed. Run manually:`);
    console.log(`    git add ${files.join(' ')}`);
    console.log(`    git commit -m "chore: bump version to ${newVersion}"`);
    console.log(`    git tag -a v${newVersion} -m "v${newVersion}"`);
  }
}

main();
