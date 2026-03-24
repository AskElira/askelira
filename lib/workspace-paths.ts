/**
 * Workspace Paths — Phase 3 (CLI Phase 3)
 *
 * Isolated customer workspace directory management.
 * Each customer gets their own sandbox under WORKSPACES_ROOT.
 */

import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { existsSync } from 'fs';

// ============================================================
// Root directory
// ============================================================

const DEFAULT_ROOT = path.join(os.homedir(), 'askelira', 'workspaces');

/**
 * Get the workspaces root directory.
 * Uses WORKSPACES_PATH env var if set, otherwise ~/askelira/workspaces.
 */
export function getWorkspacesRoot(): string {
  return process.env.WORKSPACES_PATH || DEFAULT_ROOT;
}

// ============================================================
// Path helpers
// ============================================================

/**
 * Sanitize a customer ID to be filesystem-safe.
 * Only allows alphanumeric, hyphens, underscores, and dots.
 * Prevents path traversal attacks.
 */
function sanitizeId(customerId: string): string {
  // Strip any path separators and dangerous characters
  const sanitized = customerId
    .replace(/[/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9\-_.@]/g, '_')
    .slice(0, 128);

  if (!sanitized || sanitized === '.' || sanitized === '..') {
    throw new Error(`Invalid customer ID: "${customerId}"`);
  }

  return sanitized;
}

/**
 * Get the workspace directory path for a customer.
 * Returns an absolute path; does NOT create the directory.
 */
export function getWorkspacePath(customerId: string): string {
  const safeId = sanitizeId(customerId);
  const workspacePath = path.resolve(getWorkspacesRoot(), safeId);

  // Double-check the resolved path is inside the root (prevent traversal)
  const root = path.resolve(getWorkspacesRoot());
  if (!workspacePath.startsWith(root + path.sep) && workspacePath !== root) {
    throw new Error(`Path traversal detected for customer: "${customerId}"`);
  }

  return workspacePath;
}

/**
 * Verify that a resolved file path is inside the customer workspace.
 * Returns true if safe, false if it escapes.
 */
export function isPathSafe(customerId: string, filePath: string): boolean {
  try {
    const workspace = getWorkspacePath(customerId);
    const resolved = path.resolve(workspace, filePath);
    return resolved.startsWith(workspace + path.sep) || resolved === workspace;
  } catch {
    return false;
  }
}

// ============================================================
// Directory management
// ============================================================

const DEFAULT_SOUL = `# SOUL.md -- Customer Workspace

Welcome to your AskElira workspace.
This directory contains all outputs from your building projects.

## Structure
- \`floors/\` -- Build outputs for each floor
- \`automations/\` -- Completed automation files
- \`SOUL.md\` -- This file (workspace overview)
`;

/**
 * Ensure a customer workspace exists with default structure.
 * Creates the directory tree and default SOUL.md if missing.
 * Returns the workspace path.
 */
export async function ensureWorkspace(customerId: string): Promise<string> {
  const workspace = getWorkspacePath(customerId);

  await fs.mkdir(workspace, { recursive: true });
  await fs.mkdir(path.join(workspace, 'floors'), { recursive: true });
  await fs.mkdir(path.join(workspace, 'automations'), { recursive: true });

  const soulPath = path.join(workspace, 'SOUL.md');
  if (!existsSync(soulPath)) {
    await fs.writeFile(soulPath, DEFAULT_SOUL, 'utf-8');
  }

  return workspace;
}

/**
 * List files in a customer workspace (up to 2 levels deep).
 * Returns relative paths from the workspace root.
 */
export async function listWorkspaceFiles(
  customerId: string,
  maxDepth: number = 2,
): Promise<string[]> {
  const workspace = getWorkspacePath(customerId);
  if (!existsSync(workspace)) return [];

  const results: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const relativePath = path.relative(workspace, path.join(dir, entry.name));

      if (entry.isDirectory()) {
        results.push(relativePath + '/');
        await walk(path.join(dir, entry.name), depth + 1);
      } else if (entry.isFile()) {
        results.push(relativePath);
      }
    }
  }

  await walk(workspace, 0);
  return results.sort();
}

/**
 * Read a file from a customer workspace.
 * Returns null if not found. Validates path safety.
 */
export async function readWorkspaceFile(
  customerId: string,
  filePath: string,
): Promise<string | null> {
  const workspace = getWorkspacePath(customerId);
  const resolved = path.resolve(workspace, filePath);

  // Path traversal check
  if (!resolved.startsWith(workspace + path.sep) && resolved !== workspace) {
    return null;
  }

  try {
    return await fs.readFile(resolved, 'utf-8');
  } catch {
    return null;
  }
}
