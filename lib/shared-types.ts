/**
 * Shared Types — DavidResult & file normalization
 *
 * Centralizes the DavidResult interface and provides normalizeDavidResult()
 * to handle old (single buildOutput string) and new (files[] array) formats.
 */

// ============================================================
// Core types
// ============================================================

export interface DavidFile {
  name: string;
  content: string;
}

export interface DavidResult {
  files: DavidFile[];
  language: string;
  entryPoint: string;
  dependencies: string[];
  selfAuditReport: string;
  handoffNotes: string;
  syntaxValid?: boolean;
  /** @deprecated Use files[] instead. Kept for backward compat with old DB rows. */
  buildOutput?: string;
}

// ============================================================
// Normalizer
// ============================================================

/**
 * Normalize any David output into the canonical DavidResult shape.
 *
 * Handles:
 *  1. Already has files[] (pass-through)
 *  2. Has buildOutput string (wrap in single file)
 *  3. Raw string input (wrap as main file)
 *  4. Double-serialized JSON string
 *  5. null / undefined / empty
 */
export function normalizeDavidResult(raw: unknown): DavidResult {
  // Handle null/undefined
  if (raw == null) {
    return emptyResult();
  }

  // Handle double-serialized JSON string
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.length === 0) return emptyResult();

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeDavidResult(parsed);
    } catch {
      // Raw code string — wrap as single file
      return {
        files: [{ name: 'main.js', content: trimmed }],
        language: 'javascript',
        entryPoint: 'main.js',
        dependencies: [],
        selfAuditReport: '',
        handoffNotes: '',
        buildOutput: trimmed,
      };
    }
  }

  // Handle non-object types
  if (typeof raw !== 'object') {
    return emptyResult();
  }

  const obj = raw as Record<string, unknown>;

  // Case 1: Already has files[] array
  if (Array.isArray(obj.files) && obj.files.length > 0) {
    const files: DavidFile[] = obj.files
      .filter((f: unknown) => f && typeof f === 'object' && 'name' in (f as Record<string, unknown>) && 'content' in (f as Record<string, unknown>))
      .map((f: unknown) => {
        const file = f as Record<string, unknown>;
        return {
          name: String(file.name || 'unknown'),
          content: String(file.content || ''),
        };
      });

    if (files.length === 0) {
      return normalizeFromBuildOutput(obj);
    }

    const entryPoint = String(obj.entryPoint || files[0].name);
    return {
      files,
      language: String(obj.language || detectLanguageFromFiles(files)),
      entryPoint,
      dependencies: normalizeArray(obj.dependencies),
      selfAuditReport: String(obj.selfAuditReport || ''),
      handoffNotes: String(obj.handoffNotes || ''),
      syntaxValid: typeof obj.syntaxValid === 'boolean' ? obj.syntaxValid : undefined,
    };
  }

  // Case 2: Has buildOutput string (old format)
  return normalizeFromBuildOutput(obj);
}

// ============================================================
// Helpers
// ============================================================

function normalizeFromBuildOutput(obj: Record<string, unknown>): DavidResult {
  const buildOutput = typeof obj.buildOutput === 'string' ? obj.buildOutput : '';
  const language = String(obj.language || 'javascript').toLowerCase();
  const entryPoint = String(obj.entryPoint || guessEntryPoint(language));

  if (!buildOutput) {
    return {
      files: [],
      language,
      entryPoint,
      dependencies: normalizeArray(obj.dependencies),
      selfAuditReport: String(obj.selfAuditReport || ''),
      handoffNotes: String(obj.handoffNotes || ''),
      buildOutput: '',
    };
  }

  // Derive file name from entryPoint
  const fileName = entryPoint.includes('.') ? entryPoint : guessEntryPoint(language);

  return {
    files: [{ name: fileName, content: buildOutput }],
    language,
    entryPoint: fileName,
    dependencies: normalizeArray(obj.dependencies),
    selfAuditReport: String(obj.selfAuditReport || ''),
    handoffNotes: String(obj.handoffNotes || ''),
    buildOutput,
    syntaxValid: typeof obj.syntaxValid === 'boolean' ? obj.syntaxValid : undefined,
  };
}

function emptyResult(): DavidResult {
  return {
    files: [],
    language: 'javascript',
    entryPoint: 'index.js',
    dependencies: [],
    selfAuditReport: '',
    handoffNotes: '',
  };
}

function normalizeArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.filter((v) => typeof v === 'string') as string[];
  }
  return [];
}

function guessEntryPoint(language: string): string {
  if (language.includes('python')) return 'main.py';
  if (language.includes('typescript')) return 'index.ts';
  return 'index.js';
}

function detectLanguageFromFiles(files: DavidFile[]): string {
  for (const f of files) {
    if (f.name.endsWith('.py')) return 'python';
    if (f.name.endsWith('.ts')) return 'typescript';
    if (f.name.endsWith('.js')) return 'javascript';
  }
  return 'javascript';
}

/**
 * Serialize a normalized DavidResult for DB storage.
 * Produces a JSON string that includes both files[] and buildOutput for compat.
 */
export function serializeDavidResult(result: DavidResult): string {
  // Build a legacy buildOutput string from files for backward compat
  const legacyBuildOutput = result.files.length === 1
    ? result.files[0].content
    : result.files.map((f) => `// --- ${f.name} ---\n${f.content}`).join('\n\n');

  return JSON.stringify({
    files: result.files,
    buildOutput: legacyBuildOutput,
    language: result.language,
    entryPoint: result.entryPoint,
    dependencies: result.dependencies,
    selfAuditReport: result.selfAuditReport,
    handoffNotes: result.handoffNotes,
    syntaxValid: result.syntaxValid,
  });
}
