// ============================================================
// AskElira CLI — Update Checker
// ============================================================
// Background check against npm registry. Cached for 1 hour.
// Never throws or blocks the main command.

import https from 'https';
import path from 'path';
import fs from 'fs';
import os from 'os';
import chalk from 'chalk';

const PACKAGE_NAME = 'askelira';
const CACHE_DIR = path.join(os.homedir(), '.askelira');
const CACHE_FILE = path.join(CACHE_DIR, 'update-check.json');
const CACHE_TTL_MS = 3600000; // 1 hour

interface CacheData {
  latestVersion: string;
  checkedAt: number;
}

/**
 * Get the current CLI version from package.json.
 */
function getCurrentVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Read cached check result.
 */
function readCache(): CacheData | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    const data = JSON.parse(raw) as CacheData;
    if (Date.now() - data.checkedAt < CACHE_TTL_MS) {
      return data;
    }
    return null; // expired
  } catch {
    return null;
  }
}

/**
 * Write check result to cache.
 */
function writeCache(data: CacheData): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
  } catch {
    // Ignore write errors
  }
}

/**
 * Fetch latest version from npm registry.
 */
function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 5000);

    try {
      const req = https.get(
        `https://registry.npmjs.org/${PACKAGE_NAME}/latest`,
        { headers: { Accept: 'application/json' } },
        (res) => {
          let data = '';
          res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
          res.on('end', () => {
            clearTimeout(timeout);
            try {
              const parsed = JSON.parse(data);
              resolve(parsed.version || null);
            } catch {
              resolve(null);
            }
          });
        },
      );

      req.on('error', () => {
        clearTimeout(timeout);
        resolve(null);
      });
    } catch {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}

/**
 * Compare two semver strings. Returns:
 *  -1 if a < b, 0 if equal, 1 if a > b
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va < vb) return -1;
    if (va > vb) return 1;
  }
  return 0;
}

/**
 * Check for updates and print a notice if newer version is available.
 * This function NEVER throws and NEVER blocks. It's designed to be called
 * at the end of a command.
 */
export async function checkForUpdates(): Promise<void> {
  try {
    const current = getCurrentVersion();

    // Check cache first
    const cached = readCache();
    if (cached) {
      if (compareSemver(current, cached.latestVersion) < 0) {
        printUpdateNotice(current, cached.latestVersion);
      }
      return;
    }

    // Fetch from npm (non-blocking)
    const latest = await fetchLatestVersion();
    if (!latest) return;

    // Cache the result
    writeCache({ latestVersion: latest, checkedAt: Date.now() });

    // Compare
    if (compareSemver(current, latest) < 0) {
      printUpdateNotice(current, latest);
    }
  } catch {
    // Never throw
  }
}

/**
 * Print the update notice box.
 */
function printUpdateNotice(current: string, latest: string): void {
  console.log('');
  console.log(
    chalk.yellow('  +-------------------------------------------------+'),
  );
  console.log(
    chalk.yellow('  |') +
    chalk.white(`  Update available: ${current} -> ${chalk.green(latest)}`) +
    ' '.repeat(Math.max(0, 26 - current.length - latest.length)) +
    chalk.yellow('|'),
  );
  console.log(
    chalk.yellow('  |') +
    chalk.white(`  Run: ${chalk.cyan('npm install -g askelira')}`) +
    ' '.repeat(22) +
    chalk.yellow('|'),
  );
  console.log(
    chalk.yellow('  +-------------------------------------------------+'),
  );
  console.log('');
}
