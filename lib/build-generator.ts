export interface BuildPromptInput {
  question: string;
  decision: string;
  confidence: number;
  argumentsFor: string[];
  research: string | null;
}

export interface BuildStep {
  id: number;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  output?: string;
}

/**
 * Convert swarm debate results into an actionable Claude Code prompt.
 * Combines the decision, supporting arguments, and research into a
 * structured implementation prompt.
 */
export function generateBuildPrompt(input: BuildPromptInput): string {
  const { question, decision, confidence, argumentsFor, research } = input;

  const lines: string[] = [
    `# Build Task`,
    ``,
    `## Context`,
    `The following decision was made by a 10,000-agent swarm debate:`,
    ``,
    `**Question:** ${question}`,
    `**Decision:** ${decision} (${confidence}% confidence)`,
    ``,
    `## Key Arguments Supporting This Decision`,
  ];

  if (argumentsFor.length > 0) {
    argumentsFor.forEach((arg) => {
      lines.push(`- ${arg}`);
    });
  } else {
    lines.push(`- No specific arguments recorded`);
  }

  if (research) {
    lines.push(``, `## Research Context`, research);
  }

  lines.push(
    ``,
    `## Instructions`,
    `Based on the above decision and supporting evidence, generate a complete implementation.`,
    `Include:`,
    `1. All necessary source files with production-quality code`,
    `2. A README.md explaining setup and usage`,
    `3. Configuration files as needed`,
    `4. Basic tests if applicable`,
    ``,
    `Output all files with clear file paths. Use modern best practices.`,
  );

  return lines.join('\n');
}

/**
 * Define the build execution steps for progress tracking.
 */
export function createBuildSteps(): BuildStep[] {
  return [
    { id: 1, label: 'Generating build prompt', status: 'pending' },
    { id: 2, label: 'Running Claude Code', status: 'pending' },
    { id: 3, label: 'Collecting output files', status: 'pending' },
    { id: 4, label: 'Packaging results', status: 'pending' },
  ];
}

/**
 * Parse Claude Code output into individual files for ZIP packaging.
 * Looks for ```filename patterns in the output.
 */
export function parseOutputFiles(
  output: string,
): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];

  // Try to detect files[] JSON format first
  try {
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed.files) && parsed.files.length > 0) {
      for (const f of parsed.files) {
        if (f && typeof f === 'object' && f.name && f.content) {
          files.push({ path: f.name, content: f.content });
        }
      }
      if (files.length > 0) return files;
    }
    // Legacy buildOutput string inside JSON
    if (typeof parsed.buildOutput === 'string' && parsed.buildOutput.trim()) {
      files.push({ path: parsed.entryPoint || 'output.md', content: parsed.buildOutput });
      return files;
    }
  } catch {
    // Not JSON — fall through to regex parsing
  }

  // Match code blocks with file paths: ```lang filepath or // filepath
  const codeBlockRegex =
    /```[\w]*\s*\n?\/\/\s*(.+?)\n([\s\S]*?)```|```[\w]*\s+(\S+\.[\w.]+)\n([\s\S]*?)```/g;

  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(output)) !== null) {
    const filePath = (match[1] || match[3])?.trim();
    const content = (match[2] || match[4])?.trim();
    if (filePath && content) {
      files.push({ path: filePath, content });
    }
  }

  // If no structured files found, return the raw output as a single file
  if (files.length === 0 && output.trim().length > 0) {
    files.push({ path: 'output.md', content: output.trim() });
  }

  return files;
}
