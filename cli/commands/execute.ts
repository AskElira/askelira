/**
 * AskElira Execute Command
 * Extracts automation code from database and executes it with OpenClaw safety verification.
 * Supports multi-file output (files[] array) and legacy single-string buildOutput.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { getApiKey } from '../lib/auth';
import { verifyPackages } from '../../lib/openclaw-package-verifier';
import { normalizeDavidResult } from '../../lib/shared-types';
import * as api from '../lib/api';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Extract dependencies from code by looking for import/require statements
 */
function extractDependenciesFromCode(code: string): string[] {
  const deps: Set<string> = new Set();

  // Python imports
  const pythonImports = code.match(/^(?:from|import)\s+([a-zA-Z0-9_-]+)/gm);
  if (pythonImports) {
    pythonImports.forEach((imp) => {
      const match = imp.match(/^(?:from|import)\s+([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const pkg = match[1];
        // Skip standard library
        if (!['os', 'sys', 'time', 'datetime', 'json', 're', 'math', 'random'].includes(pkg)) {
          deps.add(pkg);
        }
      }
    });
  }

  // JavaScript requires/imports
  const jsRequires = code.match(/require\(['"]([^'"]+)['"]\)/g);
  if (jsRequires) {
    jsRequires.forEach((req) => {
      const match = req.match(/require\(['"]([^'"]+)['"]\)/);
      if (match && match[1]) {
        const pkg = match[1].split('/')[0]; // Get package name before /
        if (!pkg.startsWith('.')) {
          // Skip relative imports
          deps.add(pkg);
        }
      }
    });
  }

  const jsImports = code.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
  if (jsImports) {
    jsImports.forEach((imp) => {
      const match = imp.match(/from\s+['"]([^'"]+)['"]/);
      if (match && match[1]) {
        const pkg = match[1].split('/')[0];
        if (!pkg.startsWith('.')) {
          deps.add(pkg);
        }
      }
    });
  }

  return Array.from(deps);
}

/**
 * Detect programming language from code
 */
function detectLanguage(code: string): string {
  if (code.includes('import ') || code.includes('def ') || code.includes('print(')) {
    return 'python';
  }
  if (code.includes('const ') || code.includes('function ') || code.includes('console.log')) {
    return 'javascript';
  }
  return 'python'; // default
}

/**
 * Extract all code content from a floor's buildOutput, supporting both formats.
 * Returns concatenated code from all files for scanning purposes.
 */
function extractAllCode(buildOutput: string): string {
  try {
    const parsed = JSON.parse(buildOutput);
    const normalized = normalizeDavidResult(parsed);
    if (normalized.files.length > 0) {
      return normalized.files.map((f) => f.content).join('\n');
    }
    if (parsed.buildOutput) {
      return parsed.buildOutput;
    }
  } catch {
    // Not JSON
  }
  return buildOutput;
}

/**
 * Detect environment variables needed by the code — scans all files
 */
function detectEnvVars(floors: any[]): Array<{ name: string; purpose: string }> {
  const envVars: Map<string, string> = new Map();

  for (const floor of floors) {
    const code = extractAllCode(floor.buildOutput || '');

    // Python: os.getenv('VAR_NAME') or os.environ['VAR_NAME']
    const pythonEnvMatches = code.matchAll(/os\.(?:getenv|environ(?:\.get)?)\s*\(\s*['"]([A-Z_][A-Z0-9_]*)['"](?:\s*,\s*['"]([^'"]*)['"'])?\)/g);
    for (const match of pythonEnvMatches) {
      const varName = match[1];
      if (!envVars.has(varName)) {
        const purpose = inferPurpose(varName, code);
        envVars.set(varName, purpose);
      }
    }

    // JavaScript: process.env.VAR_NAME
    const jsEnvMatches = code.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g);
    for (const match of jsEnvMatches) {
      const varName = match[1];
      if (!envVars.has(varName)) {
        const purpose = inferPurpose(varName, code);
        envVars.set(varName, purpose);
      }
    }

    // load_dotenv() or dotenv.config() patterns
    if (code.includes('load_dotenv') || code.includes('dotenv.config')) {
      const commonVars = ['API_KEY', 'SECRET_KEY', 'DATABASE_URL', 'PORT', 'HOST'];
      commonVars.forEach(varName => {
        const regex = new RegExp(`\\b${varName}\\b`, 'i');
        if (regex.test(code) && !envVars.has(varName)) {
          envVars.set(varName, inferPurpose(varName, code));
        }
      });
    }
  }

  return Array.from(envVars.entries()).map(([name, purpose]) => ({ name, purpose }));
}

/**
 * Infer the purpose of an environment variable from its name and context
 */
function inferPurpose(varName: string, code: string): string {
  const lower = varName.toLowerCase();

  if (lower.includes('sendgrid')) return 'SendGrid API key for email delivery';
  if (lower.includes('stripe')) return 'Stripe API key for payments';
  if (lower.includes('openai')) return 'OpenAI API key';
  if (lower.includes('anthropic')) return 'Anthropic API key';
  if (lower.includes('api_key') || lower.includes('apikey')) return 'API authentication key';
  if (lower.includes('secret')) return 'Secret key or token';
  if (lower.includes('database') || lower.includes('db')) return 'Database connection string';
  if (lower.includes('smtp')) return 'Email server configuration';
  if (lower.includes('port')) return 'Port number for server';
  if (lower.includes('host')) return 'Host address or URL';
  if (lower.includes('token')) return 'Authentication token';
  if (lower.includes('password') || lower.includes('pass')) return 'Password or credentials';
  if (lower.includes('email')) return 'Email address';
  if (lower.includes('user')) return 'Username or user identifier';

  // Check if mentioned in a comment near the var
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(varName)) {
      // Check previous line for comment
      if (i > 0 && (lines[i - 1].includes('#') || lines[i - 1].includes('//'))) {
        return lines[i - 1].replace(/[#\/]/g, '').trim().slice(0, 50);
      }
    }
  }

  return 'Required configuration value';
}

/**
 * Strip non-executable content from legacy buildOutput that concatenated
 * JS code + package.json + README.md into a single string.
 *
 * Removes:
 *  - JSON blocks that look like package.json (after a "// package.json" comment)
 *  - Markdown content (after a "// README.md" comment or starting with "# ")
 */
function stripNonExecutableContent(code: string): string {
  const lines = code.split('\n');
  const outputLines: string[] = [];
  let skipping = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect start of a package.json block
    // Pattern: a comment like "// package.json" followed by JSON starting with "{"
    if (
      trimmed.match(/^\/\/\s*package\.json/i) ||
      trimmed.match(/^\/\*\s*package\.json/i)
    ) {
      skipping = true;
      continue;
    }

    // Detect start of a README block
    if (
      trimmed.match(/^\/\/\s*README\.md/i) ||
      trimmed.match(/^\/\*\s*README\.md/i)
    ) {
      skipping = true;
      continue;
    }

    if (skipping) {
      // If we hit a JSON block while skipping (package.json content),
      // skip until the matching closing brace
      if (trimmed === '{') {
        let braceDepth = 1;
        i++;
        while (i < lines.length && braceDepth > 0) {
          const c = lines[i];
          for (const ch of c) {
            if (ch === '{') braceDepth++;
            if (ch === '}') braceDepth--;
          }
          i++;
        }
        i--; // adjust for the for-loop increment
        // After closing brace, keep skipping in case there is trailing whitespace
        continue;
      }

      // If we encounter a new JS code marker (comment with .js/.ts, or actual code),
      // stop skipping
      if (
        trimmed.match(/^\/\/\s*\S+\.(js|ts|mjs)/) ||
        trimmed.match(/^(const|let|var|function|class|import|export|'use strict'|"use strict")/) ||
        trimmed.match(/^require\(/)
      ) {
        skipping = false;
        outputLines.push(line);
        continue;
      }

      // If it looks like markdown (headings, blank lines in markdown sections), skip
      if (
        trimmed.startsWith('#') ||
        trimmed.startsWith('- ') ||
        trimmed.startsWith('* ') ||
        trimmed.startsWith('> ') ||
        trimmed.startsWith('```') ||
        trimmed === ''
      ) {
        continue;
      }

      // If the line looks like narrative text (no code syntax), keep skipping
      if (!trimmed.match(/[;{}()=]/) && trimmed.length > 0) {
        continue;
      }

      // Otherwise, likely back to code
      skipping = false;
      outputLines.push(line);
      continue;
    }

    // Not skipping — detect inline package.json JSON blob starting with { "name":
    if (trimmed.match(/^\{\s*"name"\s*:/) && !trimmed.includes('require') && !trimmed.includes('import')) {
      // Looks like start of a package.json object — skip until matching }
      let braceDepth = 0;
      for (const ch of trimmed) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      if (braceDepth > 0) {
        // Multi-line JSON block
        i++;
        while (i < lines.length && braceDepth > 0) {
          const c = lines[i];
          for (const ch of c) {
            if (ch === '{') braceDepth++;
            if (ch === '}') braceDepth--;
          }
          i++;
        }
        i--; // adjust for the for-loop increment
      }
      // Skip this entire block
      continue;
    }

    // Detect standalone markdown heading at the boundary (not inside a string)
    if (trimmed.startsWith('# ') && !trimmed.includes("'") && !trimmed.includes('"')) {
      skipping = true;
      continue;
    }

    outputLines.push(line);
  }

  const result = outputLines.join('\n').trim();
  // If stripping removed everything, return original code (safety fallback)
  return result.length > 0 ? result : code;
}

/**
 * Run a local syntax check on a file before execution
 */
async function localSyntaxCheck(filepath: string): Promise<{ valid: boolean; error?: string }> {
  const ext = path.extname(filepath);
  try {
    if (ext === '.js' || ext === '.mjs') {
      await execAsync(`node --check "${filepath}"`);
      return { valid: true };
    }
    if (ext === '.py') {
      await execAsync(`python3 -m py_compile "${filepath}"`);
      return { valid: true };
    }
    // Unknown extension — skip check
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.stderr || error.message };
  }
}

export async function executeCommand(goalId: string, options: any): Promise<void> {
  console.log(chalk.cyan('\n┌─────────────────────────────────────────────┐'));
  console.log(chalk.cyan('│  AskElira Execute - Run Your Automation     │'));
  console.log(chalk.cyan('└─────────────────────────────────────────────┘\n'));

  // Step 1: Load goal and floors
  const spinner = ora('Loading automation...').start();

  try {
    const res = await api.getGoal(goalId);
    if (!res.ok) {
      spinner.fail(chalk.red('Failed to load automation'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    const goalData = res.data;
    const { goal, floors } = goalData;

    spinner.succeed(chalk.green('Automation loaded'));

    console.log(chalk.gray(`  Goal: ${goal.goalText}`));
    console.log(chalk.gray(`  Status: ${goal.status}`));
    console.log(chalk.gray(`  Floors: ${floors.length}`));
    console.log();

    // Step 2: Check if automation is complete
    const liveFloors = floors.filter(f => f.status === 'live');
    if (liveFloors.length === 0) {
      console.log(chalk.yellow('⚠  No live floors found. Automation not ready to execute.'));
      return;
    }

    console.log(chalk.green(`✓ ${liveFloors.length} live floor(s) ready to execute\n`));

    // Step 3: Extract dependencies — scan all files in each floor
    console.log(chalk.cyan('─'.repeat(60)));
    console.log(chalk.bold('Dependencies Detection'));
    console.log(chalk.cyan('─'.repeat(60)) + '\n');

    const dependencies: Array<{ name: string; purpose: string; floor: number }> = [];

    for (const floor of liveFloors) {
      const buildOutput = floor.buildOutput || '';
      let deps: string[] = [];

      try {
        const parsed = JSON.parse(buildOutput);
        // Use declared dependencies first
        if (parsed.dependencies && Array.isArray(parsed.dependencies)) {
          deps = parsed.dependencies;
        }
        // Also scan all files for additional imports
        const normalized = normalizeDavidResult(parsed);
        for (const file of normalized.files) {
          const codeDeps = extractDependenciesFromCode(file.content);
          deps.push(...codeDeps);
        }
      } catch {
        // Not JSON, extract from code directly
        deps = extractDependenciesFromCode(buildOutput);
      }

      for (const dep of deps) {
        if (!dependencies.find(d => d.name === dep)) {
          dependencies.push({
            name: dep,
            purpose: `Required by Floor ${floor.floorNumber}: ${floor.name}`,
            floor: floor.floorNumber,
          });
        }
      }
    }

    if (dependencies.length === 0) {
      console.log(chalk.gray('  No 3rd party dependencies detected.'));
      console.log(chalk.gray('  Automation uses only standard libraries.\n'));
    } else {
      console.log(chalk.yellow(`  Found ${dependencies.length} 3rd party package(s):\n`));
      dependencies.forEach((dep, i) => {
        console.log(chalk.gray(`    ${i + 1}. ${chalk.white(dep.name)} - ${dep.purpose}`));
      });
      console.log();

      // Step 4: OpenClaw Safety Verification
      console.log(chalk.cyan('─'.repeat(60)));
      console.log(chalk.bold('OpenClaw Security Check'));
      console.log(chalk.cyan('─'.repeat(60)) + '\n');

      const apiKey = getApiKey();
      if (!apiKey) {
        console.log(chalk.red('x API key not configured'));
        console.log(chalk.gray('  Run `askelira init` to configure your API key.'));
        process.exitCode = 1;
        return;
      }

      const verifySpinner = ora('OpenClaw is verifying package safety...').start();

      const verification = await verifyPackages(
        dependencies.map(d => ({ name: d.name, purpose: d.purpose })),
        apiKey,
      );

      verifySpinner.stop();

      console.log(chalk.bold('\nSafety Report:\n'));

      let hasRejected = false;
      let hasCaution = false;

      for (const pkg of verification.packages) {
        const scoreColor =
          pkg.safetyScore >= 80
            ? chalk.green
            : pkg.safetyScore >= 50
            ? chalk.yellow
            : chalk.red;

        const icon =
          pkg.recommendation === 'safe'
            ? chalk.green('✓')
            : pkg.recommendation === 'caution'
            ? chalk.yellow('!')
            : chalk.red('x');

        console.log(`  ${icon} ${chalk.bold(pkg.packageName)}`);
        console.log(`     Safety Score: ${scoreColor(pkg.safetyScore + '/100')}`);
        console.log(`     Recommendation: ${chalk.bold(pkg.recommendation.toUpperCase())}`);
        console.log(`     What it does: ${chalk.gray(pkg.whatItDoes)}`);
        console.log(`     Reasoning: ${chalk.gray(pkg.reasoning)}`);

        if (pkg.risks.length > 0) {
          console.log(`     Risks: ${chalk.red(pkg.risks.join(', '))}`);
        }

        if (pkg.alternatives.length > 0) {
          console.log(`     Alternatives: ${chalk.cyan(pkg.alternatives.join(', '))}`);
        }

        console.log();

        if (pkg.recommendation === 'reject') {
          hasRejected = true;
        }
        if (pkg.recommendation === 'caution') {
          hasCaution = true;
        }
      }

      console.log(chalk.cyan('─'.repeat(60)));
      console.log(chalk.bold('Summary: ') + verification.summary);
      console.log(chalk.cyan('─'.repeat(60)) + '\n');

      // Step 5: User Consent
      if (hasRejected) {
        console.log(chalk.red('!  SECURITY WARNING: OpenClaw detected unsafe packages!'));
        console.log(chalk.red('   Execution blocked for your safety.\n'));

        const { confirmDanger } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmDanger',
            message: chalk.red(
              'Are you SURE you want to install rejected packages? (NOT recommended)',
            ),
            default: false,
          },
        ]);

        if (!confirmDanger) {
          console.log(chalk.yellow('\nx Execution cancelled for safety.'));
          console.log(chalk.gray('  Review the packages and try safer alternatives.\n'));
          return;
        }

        console.log(chalk.red('\n!  Proceeding at your own risk...\n'));
      } else if (hasCaution) {
        console.log(chalk.yellow('!  Some packages require caution.\n'));

        const { confirmCaution } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmCaution',
            message: 'Install packages with caution warnings?',
            default: false,
          },
        ]);

        if (!confirmCaution) {
          console.log(chalk.yellow('\nx Execution cancelled.'));
          return;
        }
      } else {
        const { confirmInstall } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmInstall',
            message: chalk.green(
              `Install ${dependencies.length} safe package(s) and execute automation?`,
            ),
            default: true,
          },
        ]);

        if (!confirmInstall) {
          console.log(chalk.yellow('\nx Execution cancelled by user.'));
          return;
        }
      }
    }

    // Step 6: Extract and Execute
    console.log(chalk.cyan('\n─'.repeat(60)));
    console.log(chalk.bold('Executing Automation'));
    console.log(chalk.cyan('─'.repeat(60)) + '\n');

    const execDir = path.join(process.cwd(), '.askelira-exec', goalId);
    mkdirSync(execDir, { recursive: true });

    console.log(chalk.gray(`  Execution directory: ${execDir}\n`));

    // Track resolved entry points per floor for auto-execute
    const floorEntryPoints: Array<{ floorNumber: number; entryPoint: string; language: string }> = [];

    for (const floor of liveFloors) {
      const buildOutput = floor.buildOutput;
      if (!buildOutput || buildOutput.trim().length === 0) {
        console.log(chalk.yellow(`  ! Floor ${floor.floorNumber}: No code found`));
        continue;
      }

      // Try to parse as structured David output
      let extracted = false;
      try {
        const parsed = JSON.parse(buildOutput);
        const normalized = normalizeDavidResult(parsed);

        if (normalized.files.length > 0) {
          // Multi-file format: write each file into floor-N/ subdirectory
          const floorSubDir = path.join(execDir, `floor-${floor.floorNumber}`);
          mkdirSync(floorSubDir, { recursive: true });

          for (const file of normalized.files) {
            const filePath = path.join(floorSubDir, file.name);
            mkdirSync(path.dirname(filePath), { recursive: true });
            writeFileSync(filePath, file.content);
            console.log(chalk.gray(`  ✓ Floor ${floor.floorNumber}: ${file.name}`));
          }

          // Show syntax validation status
          if (normalized.syntaxValid === true) {
            console.log(chalk.green(`    Syntax: validated`));
          } else if (normalized.syntaxValid === false) {
            console.log(chalk.red(`    Syntax: FAILED (may not run correctly)`));
          }

          floorEntryPoints.push({
            floorNumber: floor.floorNumber,
            entryPoint: path.join(`floor-${floor.floorNumber}`, normalized.entryPoint),
            language: normalized.language,
          });
          extracted = true;
        } else if (parsed.buildOutput) {
          // Legacy single-string format — strip non-executable content
          const code = stripNonExecutableContent(parsed.buildOutput);
          const language = (parsed.language || 'python').toLowerCase();
          const ext = language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'txt';
          const filename = `floor-${floor.floorNumber}.${ext}`;
          const filepath = path.join(execDir, filename);

          writeFileSync(filepath, code);
          console.log(chalk.gray(`  ✓ Extracted Floor ${floor.floorNumber}: ${filename}`));

          floorEntryPoints.push({
            floorNumber: floor.floorNumber,
            entryPoint: filename,
            language,
          });
          extracted = true;
        }
      } catch {
        // Not JSON — fall through to raw write
      }

      if (!extracted) {
        // Raw code string fallback — strip non-executable content
        const cleanedCode = stripNonExecutableContent(buildOutput);
        const language = detectLanguage(cleanedCode);
        const ext = language === 'python' ? 'py' : 'js';
        const filename = `floor-${floor.floorNumber}.${ext}`;
        const filepath = path.join(execDir, filename);

        writeFileSync(filepath, cleanedCode);
        console.log(chalk.gray(`  ✓ Extracted Floor ${floor.floorNumber}: ${filename} (raw)`));

        floorEntryPoints.push({
          floorNumber: floor.floorNumber,
          entryPoint: filename,
          language,
        });
      }
    }

    // Install dependencies if needed
    if (dependencies.length > 0) {
      console.log();
      const installSpinner = ora('Installing dependencies...').start();

      const language = floorEntryPoints[0]?.language || 'python';

      try {
        if (language === 'python') {
          const pkgList = dependencies.map(d => d.name).join(' ');
          await execAsync(`pip3 install ${pkgList}`, { cwd: execDir });
        } else if (language === 'javascript' || language === 'typescript') {
          const pkgList = dependencies.map(d => d.name).join(' ');
          await execAsync(`npm install ${pkgList}`, { cwd: execDir });
        }

        installSpinner.succeed(chalk.green('Dependencies installed'));
      } catch (error: any) {
        installSpinner.fail(chalk.red('Failed to install dependencies'));
        console.log(chalk.red(`  ${error.message}`));
        process.exitCode = 1;
        return;
      }
    }

    // Step 7: Check for .env requirements
    console.log();
    console.log(chalk.cyan('─'.repeat(60)));
    console.log(chalk.bold('Environment Configuration'));
    console.log(chalk.cyan('─'.repeat(60)) + '\n');

    const envVars = detectEnvVars(liveFloors);

    if (envVars.length > 0) {
      console.log(chalk.yellow(`!  This automation requires ${envVars.length} environment variable(s):\n`));

      envVars.forEach((envVar, i) => {
        console.log(chalk.white(`  ${i + 1}. ${envVar.name}`) + chalk.gray(` - ${envVar.purpose}`));
      });

      console.log();
      console.log(chalk.gray('You need to create a .env file with these variables.\n'));

      const { setupEnv } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'setupEnv',
          message: 'Would you like to set up the .env file now?',
          default: true,
        },
      ]);

      if (setupEnv) {
        console.log(chalk.cyan('\nSetting up .env file...\n'));

        const envContent: string[] = [];

        for (const envVar of envVars) {
          const { value } = await inquirer.prompt([
            {
              type: 'input',
              name: 'value',
              message: `Enter value for ${chalk.white(envVar.name)}:`,
              validate: (input) => {
                if (!input || input.trim().length === 0) {
                  return `${envVar.name} is required`;
                }
                return true;
              },
            },
          ]);

          envContent.push(`${envVar.name}=${value}`);
        }

        const envPath = path.join(execDir, '.env');
        writeFileSync(envPath, envContent.join('\n') + '\n');

        console.log(chalk.green(`\n✓ .env file created at: ${envPath}\n`));
      } else {
        console.log(chalk.yellow('\n!  Remember to create .env file before running:\n'));
        envVars.forEach((envVar) => {
          console.log(chalk.gray(`  ${envVar.name}=your_value_here`));
        });
        console.log();
      }
    } else {
      console.log(chalk.gray('  No environment variables required.\n'));
    }

    // Step 8: Show run instructions
    console.log(chalk.cyan('─'.repeat(60)));
    console.log();
    console.log(chalk.green('✓ Automation ready to execute!'));
    console.log(chalk.gray(`\n  Run the automation:`));
    console.log(chalk.cyan(`    cd ${execDir}`));

    const primaryEntry = floorEntryPoints[0];
    if (primaryEntry) {
      const { language, entryPoint } = primaryEntry;
      if (language === 'python') {
        console.log(chalk.cyan(`    python3 ${entryPoint}`));
      } else {
        console.log(chalk.cyan(`    node ${entryPoint}`));
      }
    }

    console.log();

    // Auto-execute if requested
    if (options.autorun && primaryEntry) {
      console.log(chalk.cyan('─'.repeat(60)));
      console.log(chalk.bold('Auto-executing...'));
      console.log(chalk.cyan('─'.repeat(60)) + '\n');

      const { language, entryPoint } = primaryEntry;
      const entryPath = path.join(execDir, entryPoint);

      // Local syntax check before execution
      const syntaxCheck = await localSyntaxCheck(entryPath);
      if (!syntaxCheck.valid) {
        console.log(chalk.red('x Local syntax check failed:'));
        console.log(chalk.red(`  ${syntaxCheck.error}`));
        console.log(chalk.yellow('  Skipping auto-execution due to syntax errors.'));
        process.exitCode = 1;
        return;
      }

      try {
        const cmd = language === 'python' ? `python3 ${entryPoint}` : `node ${entryPoint}`;
        const { stdout, stderr } = await execAsync(cmd, { cwd: execDir });

        if (stdout) {
          console.log(chalk.gray('Output:'));
          console.log(stdout);
        }
        if (stderr) {
          console.log(chalk.red('Errors:'));
          console.log(stderr);
        }

        console.log(chalk.green('\n✓ Execution complete!'));
      } catch (error: any) {
        console.log(chalk.red('x Execution failed:'));
        console.log(chalk.red(`  ${error.message}`));
        if (error.stdout) console.log(chalk.gray(error.stdout));
        if (error.stderr) console.log(chalk.red(error.stderr));
        process.exitCode = 1;
      }
    }
  } catch (err: unknown) {
    spinner.fail(chalk.red('Execution failed'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}
