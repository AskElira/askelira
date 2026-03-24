const fs = require('fs');
const path = require('path');
const readline = require('readline');

const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

const TEMPLATES = {
  trading: {
    name: 'Trading Strategy Evaluator',
    description: 'Evaluate a trading strategy with swarm intelligence',
    fields: [
      { key: 'strategy', prompt: 'Strategy name', default: 'my-strategy' },
      { key: 'market', prompt: 'Market (e.g. stocks, crypto, futures)', default: 'futures' },
      { key: 'agents', prompt: 'Agent count', default: '10000' },
    ],
  },
  hiring: {
    name: 'Hiring Decision Helper',
    description: 'Evaluate hiring decisions with swarm debate',
    fields: [
      { key: 'role', prompt: 'Role title', default: 'Software Engineer' },
      { key: 'team', prompt: 'Team name', default: 'engineering' },
      { key: 'agents', prompt: 'Agent count', default: '5000' },
    ],
  },
  product: {
    name: 'Product Launch Evaluator',
    description: 'Should you launch this product? Swarm debate decides.',
    fields: [
      { key: 'product', prompt: 'Product name', default: 'my-product' },
      { key: 'market', prompt: 'Target market', default: 'B2B SaaS' },
      { key: 'agents', prompt: 'Agent count', default: '10000' },
    ],
  },
};

async function createCommand(templateName, options) {
  const chalk = require('chalk');

  if (!templateName || options.list) {
    console.log(chalk.bold('\nAvailable templates:\n'));
    for (const [key, tpl] of Object.entries(TEMPLATES)) {
      console.log(`  ${chalk.cyan(key.padEnd(12))} ${tpl.name}`);
      console.log(`  ${''.padEnd(12)} ${chalk.dim(tpl.description)}\n`);
    }
    console.log(chalk.dim('Usage: askelira create <template> [--dir <path>]'));
    return;
  }

  const template = TEMPLATES[templateName];
  if (!template) {
    console.error(chalk.red(`Unknown template: "${templateName}"`));
    console.log(chalk.dim(`Available: ${Object.keys(TEMPLATES).join(', ')}`));
    process.exit(1);
  }

  console.log(chalk.bold(`\n${template.name}\n`));
  console.log(chalk.dim(template.description + '\n'));

  const answers = {};
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (prompt, defaultVal) =>
    new Promise((resolve) => {
      const suffix = defaultVal ? ` (${defaultVal})` : '';
      rl.question(`  ${prompt}${suffix}: `, (answer) => {
        resolve(answer.trim() || defaultVal || '');
      });
    });

  for (const field of template.fields) {
    answers[field.key] = await ask(field.prompt, field.default);
  }
  rl.close();

  const targetDir = options.dir || path.join(process.cwd(), answers[template.fields[0].key]);

  fs.mkdirSync(targetDir, { recursive: true });

  const templateDir = path.join(TEMPLATES_DIR, templateName);
  if (fs.existsSync(templateDir)) {
    copyDir(templateDir, targetDir, answers);
  }

  const configPath = path.join(targetDir, 'askelira.config.json');
  const config = {
    template: templateName,
    ...answers,
    created: new Date().toISOString(),
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  const scriptPath = path.join(targetDir, 'run.js');
  fs.writeFileSync(scriptPath, generateRunScript(templateName, answers));

  const readmePath = path.join(targetDir, 'README.md');
  fs.writeFileSync(readmePath, generateReadme(templateName, template, answers));

  console.log(chalk.green(`\nProject created at ${targetDir}\n`));
  console.log('  Next steps:');
  console.log(`  ${chalk.cyan('cd')} ${path.relative(process.cwd(), targetDir)}`);
  console.log(`  ${chalk.cyan('node')} run.js\n`);
}

function copyDir(src, dest, vars) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, vars);
    } else {
      let content = fs.readFileSync(srcPath, 'utf8');
      for (const [key, val] of Object.entries(vars)) {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
      }
      fs.writeFileSync(destPath, content);
    }
  }
}

function generateRunScript(templateName, answers) {
  const agents = parseInt(answers.agents, 10) || 10000;
  const questions = {
    trading: `Should I deploy the "${answers.strategy || 'strategy'}" strategy in ${answers.market || 'futures'} markets?`,
    hiring: `Should we hire the top candidate for the ${answers.role || 'role'} position on the ${answers.team || 'team'} team?`,
    product: `Should we launch "${answers.product || 'product'}" targeting the ${answers.market || 'market'} market?`,
  };

  return `#!/usr/bin/env node
const { Swarm } = require('askelira/src/agents/swarm');

async function main() {
  const swarm = new Swarm({ agents: ${agents} });

  console.log('Starting swarm debate...\\n');

  const result = await swarm.debate({
    question: '${questions[templateName] || 'Should we proceed?'}',
  });

  console.log('Decision:', result.decision);
  console.log('Confidence:', result.confidence + '%');
  console.log('Verdict:', result.verdict);

  if (result.reasoning) {
    console.log('\\nReasoning:', result.reasoning);
  }

  if (result.arguments) {
    if (result.arguments.for?.length) {
      console.log('\\nArguments FOR:');
      result.arguments.for.forEach((a) => console.log('  +', a));
    }
    if (result.arguments.against?.length) {
      console.log('\\nArguments AGAINST:');
      result.arguments.against.forEach((a) => console.log('  -', a));
    }
  }
}

main().catch(console.error);
`;
}

function generateReadme(templateName, template, answers) {
  return `# ${answers[template.fields[0].key]}

Generated by \`askelira create ${templateName}\`.

## ${template.name}

${template.description}

## Configuration

| Field | Value |
|-------|-------|
${template.fields.map((f) => `| ${f.prompt} | ${answers[f.key]} |`).join('\n')}

## Usage

\`\`\`bash
node run.js
\`\`\`

Or use the CLI directly:

\`\`\`bash
askelira swarm -q "Your question here" -a ${answers.agents || '10000'}
\`\`\`

## Customization

Edit \`askelira.config.json\` to change settings, or modify \`run.js\` to customize the swarm parameters.
`;
}

module.exports = createCommand;
