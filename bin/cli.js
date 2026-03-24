#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

const program = new Command();

const WORKSPACE_DIR = path.join(os.homedir(), 'askelira');

const DEFAULT_SOUL = `# SOUL.md - Your AI's Personality
## Who I Am
I am your automation assistant. I help you build, test, and deploy software.
## My Goals
- Build working code fast
- Ship before perfecting
- Learn from results
`;

const DEFAULT_AGENTS = `# AGENTS.md - Current Tasks & Results
## Current Task
[Describe your automation goal here]
## Recent Results
[Results will appear here after running]
`;

const DEFAULT_TOOLS = `# TOOLS.md - Your API Keys & Capabilities
## API Keys
ANTHROPIC_API_KEY=your_key_here
BRAVE_API_KEY=your_key_here
## Capabilities
- Web research (Brave Search)
- AI reasoning (Claude)
- Code generation
`;

program
  .name('askelira')
  .description('ChatGPT for Automations - AI agents that build working code')
  .version('2.1.0');

// askelira init
program
  .command('init')
  .description('Create ~/askelira/ workspace with SOUL.md, AGENTS.md, TOOLS.md')
  .action(() => {
    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
      console.log(`✅ Created workspace: ${WORKSPACE_DIR}`);
    } else {
      console.log(`📁 Workspace already exists: ${WORKSPACE_DIR}`);
    }

    const files = {
      'SOUL.md': DEFAULT_SOUL,
      'AGENTS.md': DEFAULT_AGENTS,
      'TOOLS.md': DEFAULT_TOOLS,
    };

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(WORKSPACE_DIR, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ Created ${filename}`);
      } else {
        console.log(`  ⏭️  ${filename} already exists (skipped)`);
      }
    }

    console.log('\n🚀 Workspace ready!');
    console.log(`   Edit ${WORKSPACE_DIR}/AGENTS.md to set your goal`);
    console.log('   Run: askelira web  to start the UI');
  });

// askelira web
program
  .command('web')
  .description('Start Next.js dev server')
  .option('-p, --port <port>', 'Port to run on', '3001')
  .action((options) => {
    const port = options.port || '3001';
    console.log(`🌐 Starting AskElira web UI on port ${port}...`);
    console.log(`   Visit: http://localhost:${port}`);
    console.log('   Press Ctrl+C to stop\n');

    const env = { ...process.env, PORT: port };
    const child = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      env,
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (err) => {
      console.error('❌ Failed to start dev server:', err.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });

    process.on('SIGINT', () => {
      child.kill('SIGINT');
    });
  });

// askelira run <question>
program
  .command('run <question>')
  .description('Run a swarm debate via the API')
  .option('-p, --port <port>', 'API port', '3001')
  .action(async (question, options) => {
    const port = options.port || '3001';
    const url = `http://localhost:${port}/api/swarm`;

    console.log(`🤖 Running swarm debate...`);
    console.log(`   Question: "${question}"\n`);

    try {
      // Use built-in fetch (Node 18+) or fall back to http
      let fetchFn;
      if (typeof fetch !== 'undefined') {
        fetchFn = fetch;
      } else {
        const http = require('http');
        fetchFn = (url, opts) => new Promise((resolve, reject) => {
          const body = opts.body;
          const req = http.request(url, {
            method: 'POST',
            headers: opts.headers,
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              resolve({ ok: res.statusCode < 400, json: () => Promise.resolve(JSON.parse(data)) });
            });
          });
          req.on('error', reject);
          req.write(body);
          req.end();
        });
      }

      const res = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        console.error('❌ Error:', data.error);
        process.exit(1);
      }

      console.log('✅ Swarm complete!\n');

      if (data.result) {
        const r = data.result;
        if (r.recommendation) {
          console.log('📊 RECOMMENDATION:', r.recommendation);
        }
        if (r.confidence) {
          console.log('🎯 Confidence:', r.confidence);
        }
        if (r.summary) {
          console.log('\n📝 Summary:');
          console.log(r.summary);
        }
        if (r.action_plan && r.action_plan.length) {
          console.log('\n🗺️  Action Plan:');
          r.action_plan.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
        }
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        console.error(`❌ Could not connect to server on port ${port}`);
        console.error('   Make sure the dev server is running: askelira web');
      } else {
        console.error('❌ Error:', err.message);
      }
      process.exit(1);
    }
  });

// askelira status
program
  .command('status')
  .description('Show workspace status')
  .action(() => {
    console.log('📊 AskElira 2.1 Status\n');
    console.log(`Workspace: ${WORKSPACE_DIR}`);

    if (!fs.existsSync(WORKSPACE_DIR)) {
      console.log('  ❌ Not initialized. Run: askelira init');
      return;
    }

    const files = ['SOUL.md', 'AGENTS.md', 'TOOLS.md'];
    for (const f of files) {
      const fp = path.join(WORKSPACE_DIR, f);
      if (fs.existsSync(fp)) {
        const stats = fs.statSync(fp);
        console.log(`  ✅ ${f} (${stats.size} bytes)`);
      } else {
        console.log(`  ❌ ${f} missing`);
      }
    }

    // Check for API key
    const toolsPath = path.join(WORKSPACE_DIR, 'TOOLS.md');
    if (fs.existsSync(toolsPath)) {
      const tools = fs.readFileSync(toolsPath, 'utf8');
      const hasKey = tools.includes('ANTHROPIC_API_KEY=') && !tools.includes('ANTHROPIC_API_KEY=your_key_here');
      console.log(`\nAPI Key: ${hasKey ? '✅ Configured' : '⚠️  Not set (edit ~/askelira/TOOLS.md)'}`);
    }

    console.log('\nCommands:');
    console.log('  askelira web         Start web UI (port 3001)');
    console.log('  askelira run "q"     Run a swarm debate');
    console.log('  askelira init        Re-initialize workspace');
  });

program.parse(process.argv);
