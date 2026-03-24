/**
 * Syntax Validator — Validates code files before passing to Vex Gate 2.
 *
 * Writes files to a temp directory, runs language-specific syntax checks:
 *   - JavaScript (.js, .mjs): node --check
 *   - Python (.py): python3 -m py_compile
 *   - TypeScript (.ts): tsc --noEmit (if available), else skip
 *
 * Always cleans up the temp directory, even on error.
 */

import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import type { DavidFile } from './shared-types';

export interface SyntaxValidationResult {
  valid: boolean;
  errors: string[];
  checkedFiles: string[];
}

/**
 * Validate syntax of all code files.
 * Returns { valid, errors[], checkedFiles[] }.
 */
export async function validateSyntax(
  files: DavidFile[],
): Promise<SyntaxValidationResult> {
  if (files.length === 0) {
    return { valid: true, errors: [], checkedFiles: [] };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askelira-syntax-'));
  const errors: string[] = [];
  const checkedFiles: string[] = [];

  try {
    // Write all files to temp directory
    for (const file of files) {
      const filePath = path.join(tmpDir, file.name);
      const dirName = path.dirname(filePath);
      fs.mkdirSync(dirName, { recursive: true });
      fs.writeFileSync(filePath, file.content, 'utf-8');
    }

    // Check each file based on extension
    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      const filePath = path.join(tmpDir, file.name);

      if (ext === '.js' || ext === '.mjs') {
        const result = checkWithNode(filePath);
        checkedFiles.push(file.name);
        if (!result.valid) {
          errors.push(`${file.name}: ${result.error}`);
        }
      } else if (ext === '.py') {
        const result = checkWithPython(filePath);
        checkedFiles.push(file.name);
        if (!result.valid) {
          errors.push(`${file.name}: ${result.error}`);
        }
      } else if (ext === '.ts' || ext === '.tsx') {
        const result = checkWithTsc(filePath);
        checkedFiles.push(file.name);
        if (!result.valid && result.error) {
          errors.push(`${file.name}: ${result.error}`);
        }
      }
      // Other extensions: skip syntax check (no checker available)
    }
  } finally {
    // Always clean up temp directory
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    checkedFiles,
  };
}

// [BUG-5-04] Use execFileSync instead of execSync to prevent command injection.
// David-generated file.name values are written to tmpDir and then passed to shell
// commands. A malicious file.name like `"; rm -rf / #.js` would cause RCE with
// execSync (string interpolation into shell), but execFileSync passes arguments
// as an array, bypassing shell interpretation entirely.
function checkWithNode(filePath: string): { valid: boolean; error?: string } {
  try {
    execFileSync('node', ['--check', filePath], {
      stdio: 'pipe',
      timeout: 10000,
    });
    return { valid: true };
  } catch (err: any) {
    // Check if node is not available
    if (err.code === 'ENOENT') {
      console.warn('[SyntaxValidator] node not found on PATH — skipping JS syntax check');
      return { valid: true };
    }
    const stderr = err.stderr?.toString() || err.message || 'Unknown syntax error';
    // Extract the relevant error line
    const errorLine = stderr.split('\n').find((line: string) => line.includes('SyntaxError') || line.includes('Error')) || stderr.split('\n')[0];
    return { valid: false, error: errorLine.trim() };
  }
}

function checkWithPython(filePath: string): { valid: boolean; error?: string } {
  try {
    // [BUG-5-04] execFileSync prevents command injection via filePath
    execFileSync('python3', ['-m', 'py_compile', filePath], {
      stdio: 'pipe',
      timeout: 10000,
    });
    return { valid: true };
  } catch (err: any) {
    // Check if python3 is not available
    if (err.code === 'ENOENT') {
      console.warn('[SyntaxValidator] python3 not found on PATH — skipping Python syntax check');
      return { valid: true };
    }
    const stderr = err.stderr?.toString() || err.message || 'Unknown syntax error';
    const errorLine = stderr.split('\n').find((line: string) => line.includes('SyntaxError') || line.includes('Error')) || stderr.split('\n')[0];
    return { valid: false, error: errorLine.trim() };
  }
}

function checkWithTsc(filePath: string): { valid: boolean; error?: string } {
  try {
    // [BUG-5-04] execFileSync prevents command injection via filePath
    execFileSync('tsc', ['--version'], { stdio: 'pipe', timeout: 5000 });
  } catch {
    // tsc not available — skip TypeScript check (not a hard requirement)
    console.warn('[SyntaxValidator] tsc not found — skipping TypeScript syntax check');
    return { valid: true };
  }

  try {
    execFileSync('tsc', ['--noEmit', '--allowJs', '--esModuleInterop', '--skipLibCheck', filePath], {
      stdio: 'pipe',
      timeout: 15000,
    });
    return { valid: true };
  } catch (err: any) {
    const stderr = err.stderr?.toString() || err.message || 'Unknown TypeScript error';
    const errorLine = stderr.split('\n').find((line: string) => line.includes('error TS')) || stderr.split('\n')[0];
    return { valid: false, error: errorLine.trim() };
  }
}
