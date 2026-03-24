#!/usr/bin/env node
'use strict';

/**
 * AskElira TUI Dashboard - Conversational Interface
 * Talk to your dashboard with natural language!
 */

const chalk = require('chalk');
const readline = require('readline');

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const colors = {
  primary: chalk.hex('#2dd4bf'),
  secondary: chalk.hex('#a78bfa'),
  success: chalk.hex('#4ade80'),
  warning: chalk.hex('#facc15'),
  error: chalk.hex('#f87171'),
  info: chalk.hex('#60a5fa'),
  agent: {
    Alba: chalk.hex('#4ade80'),
    David: chalk.hex('#2dd4bf'),
    Vex: chalk.hex('#f87171'),
    Elira: chalk.hex('#a78bfa'),
    Steven: chalk.hex('#facc15'),
  }
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let stats = {
  buildings: 3,
  floors: 12,
  liveFloors: 8,
  agents: 5,
  activeBuildings: 2,
};

const buildings = [
  {
    id: 1,
    name: 'Customer Dashboard',
    status: 'building',
    floors: [
      { number: 1, name: 'Research Phase', status: 'live', progress: 100 },
      { number: 2, name: 'Planning Phase', status: 'live', progress: 100 },
      { number: 3, name: 'Building Phase', status: 'building', progress: 65 },
      { number: 4, name: 'Testing Phase', status: 'pending', progress: 0 },
      { number: 5, name: 'Deployment', status: 'pending', progress: 0 },
    ]
  },
  {
    id: 2,
    name: 'API Integration',
    status: 'live',
    floors: [
      { number: 1, name: 'Setup', status: 'live', progress: 100 },
      { number: 2, name: 'Implementation', status: 'live', progress: 100 },
      { number: 3, name: 'Testing', status: 'live', progress: 100 },
    ]
  }
];

let activities = [
  { agent: 'David', action: 'building the floor', floor: 3, building: 'Customer Dashboard' },
  { agent: 'Vex', action: 'auditing code', floor: 3, building: 'Customer Dashboard' },
  { agent: 'Alba', action: 'researching patterns', floor: 2, building: 'Customer Dashboard' },
  { agent: 'Steven', action: 'checking health', floor: 1, building: 'API Integration' },
  { agent: 'Elira', action: 'reviewing strategy', floor: 4, building: 'Customer Dashboard' },
];

let conversationHistory = [];

// ---------------------------------------------------------------------------
// Display Functions
// ---------------------------------------------------------------------------

function showWelcome() {
  console.log(colors.primary('\n╔════════════════════════════════════════════════════════╗'));
  console.log(colors.primary('║                                                        ║'));
  console.log(colors.primary('║         🏢 AskElira - Conversational Dashboard        ║'));
  console.log(colors.primary('║                                                        ║'));
  console.log(colors.primary('╚════════════════════════════════════════════════════════╝\n'));

  console.log(colors.info('  💬 Talk to me! Ask me anything about your buildings.\n'));
  console.log(chalk.gray('  Examples:'));
  console.log(chalk.gray('    • "show me the dashboard"'));
  console.log(chalk.gray('    • "what are the agents doing?"'));
  console.log(chalk.gray('    • "how is customer dashboard doing?"'));
  console.log(chalk.gray('    • "show building status"'));
  console.log(chalk.gray('    • "list all buildings"'));
  console.log(chalk.gray('    • "quit" or "exit" to leave\n'));
}

function showStats() {
  console.log(colors.primary('\n📊 Dashboard Overview\n'));
  console.log(colors.primary('  Buildings: ') + `${stats.buildings} total, ${colors.success(stats.activeBuildings + ' active')}`);
  console.log(colors.secondary('  Floors:    ') + `${stats.floors} total, ${colors.success(stats.liveFloors + ' live')}`);
  console.log(colors.warning('  Agents:    ') + `${stats.agents} active`);
  console.log('\n  ' + colors.success('●') + chalk.gray(' All systems operational'));
}

function showBuildings() {
  console.log(colors.secondary('\n🏢 Your Buildings\n'));
  buildings.forEach((building, i) => {
    const statusColor = building.status === 'live' ? colors.success : building.status === 'building' ? colors.warning : colors.info;
    console.log(`  ${i + 1}. ${chalk.bold(building.name)} - ${statusColor(building.status)}`);
    console.log(`     ${chalk.gray('Floors:')} ${building.floors.length} (${building.floors.filter(f => f.status === 'live').length} live)`);
  });
}

function showBuilding(buildingName) {
  const building = buildings.find(b =>
    b.name.toLowerCase().includes(buildingName.toLowerCase())
  );

  if (!building) {
    console.log(colors.error(`\n❌ Building "${buildingName}" not found.`));
    console.log(chalk.gray('\nAvailable buildings:'));
    buildings.forEach(b => console.log(chalk.gray(`  • ${b.name}`)));
    return;
  }

  console.log(colors.secondary(`\n🏢 ${building.name}\n`));

  building.floors.forEach(floor => {
    const statusColors = {
      pending: chalk.gray,
      researching: chalk.blue,
      building: chalk.cyan,
      auditing: chalk.yellow,
      live: chalk.green,
      broken: chalk.red,
    };

    const statusSymbols = {
      pending: '○',
      researching: '◐',
      building: '◓',
      auditing: '◑',
      live: '●',
      broken: '✗',
    };

    const statusColor = statusColors[floor.status] || chalk.gray;
    const symbol = statusSymbols[floor.status] || '○';
    const barWidth = 20;
    const filled = Math.floor((floor.progress / 100) * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

    console.log(`  ${statusColor(symbol)} Floor ${floor.number}: ${floor.name.padEnd(20)} ${chalk.cyan(bar)} ${floor.progress}%`);
  });
}

function showAgents() {
  console.log(colors.warning('\n🤖 Agent Activity\n'));

  activities.forEach(activity => {
    const agentColor = colors.agent[activity.agent] || chalk.gray;
    console.log(`  ${agentColor(activity.agent.padEnd(8))} ${chalk.gray('→')} ${activity.action}`);
    console.log(`  ${chalk.gray('           On ' + activity.building + ', Floor ' + activity.floor)}`);
  });
}

function showAgent(agentName) {
  const agentActivities = activities.filter(a =>
    a.agent.toLowerCase() === agentName.toLowerCase()
  );

  if (agentActivities.length === 0) {
    console.log(colors.error(`\n❌ No activity found for agent "${agentName}"`));
    console.log(chalk.gray('\nActive agents: Alba, David, Vex, Elira, Steven'));
    return;
  }

  const agentColor = colors.agent[agentActivities[0].agent] || chalk.gray;
  console.log(agentColor(`\n🤖 ${agentActivities[0].agent}\n`));

  agentActivities.forEach(activity => {
    console.log(`  ${chalk.gray('→')} ${activity.action}`);
    console.log(`    ${chalk.gray('Building:')} ${activity.building}`);
    console.log(`    ${chalk.gray('Floor:')} ${activity.floor}`);
  });
}

function showHelp() {
  console.log(colors.info('\n💡 What I can help you with:\n'));
  console.log(chalk.gray('  📊 Dashboard & Stats:'));
  console.log('    • "show dashboard" or "show stats"');
  console.log('    • "what\'s the status?"');
  console.log('');
  console.log(chalk.gray('  🏢 Buildings:'));
  console.log('    • "list buildings" or "show buildings"');
  console.log('    • "show [building name]"');
  console.log('    • "how is customer dashboard?"');
  console.log('');
  console.log(chalk.gray('  🤖 Agents:'));
  console.log('    • "show agents" or "what are agents doing?"');
  console.log('    • "show alba" or "what is david doing?"');
  console.log('');
  console.log(chalk.gray('  ℹ️  Other:'));
  console.log('    • "help" - show this message');
  console.log('    • "clear" - clear screen');
  console.log('    • "quit" or "exit" - leave');
}

// ---------------------------------------------------------------------------
// Natural Language Processing (Simple)
// ---------------------------------------------------------------------------

function processInput(input) {
  const lower = input.toLowerCase().trim();

  // Quit commands
  if (['quit', 'exit', 'bye', 'q'].includes(lower)) {
    console.log(colors.success('\n👋 Goodbye! Come back anytime.\n'));
    process.exit(0);
  }

  // Clear screen
  if (['clear', 'cls'].includes(lower)) {
    console.clear();
    showWelcome();
    return;
  }

  // Help
  if (lower.includes('help') || lower === '?') {
    showHelp();
    return;
  }

  // Dashboard/Stats
  if (lower.match(/dashboard|stats|status|overview|summary/)) {
    showStats();
    return;
  }

  // Buildings list
  if (lower.match(/list.*building|show.*building|all building|buildings/)) {
    showBuildings();
    return;
  }

  // Specific building
  const buildingMatch = lower.match(/show|how.*is|status.*of/);
  if (buildingMatch) {
    const possibleName = lower
      .replace(/show|how|is|doing|status|of|the|\?/g, '')
      .trim();

    if (possibleName) {
      const building = buildings.find(b =>
        b.name.toLowerCase().includes(possibleName) ||
        possibleName.includes(b.name.toLowerCase().split(' ')[0].toLowerCase())
      );

      if (building) {
        showBuilding(building.name);
        return;
      }
    }
  }

  // Agents
  if (lower.match(/agent|what.*doing|activity|activities/)) {
    showAgents();
    return;
  }

  // Specific agent
  const agents = ['alba', 'david', 'vex', 'elira', 'steven'];
  const mentionedAgent = agents.find(agent => lower.includes(agent));
  if (mentionedAgent) {
    showAgent(mentionedAgent.charAt(0).toUpperCase() + mentionedAgent.slice(1));
    return;
  }

  // Floors
  if (lower.match(/floor/)) {
    console.log(colors.info(`\n📊 Floor Summary\n`));
    console.log(`  Total floors: ${stats.floors}`);
    console.log(`  Live floors: ${colors.success(stats.liveFloors)}`);
    console.log(`  In progress: ${colors.warning(stats.floors - stats.liveFloors)}`);
    return;
  }

  // Default - didn't understand
  console.log(colors.error('\n❌ I didn\'t quite understand that.'));
  console.log(chalk.gray('Try asking:'));
  console.log(chalk.gray('  • "show dashboard"'));
  console.log(chalk.gray('  • "list buildings"'));
  console.log(chalk.gray('  • "what are agents doing?"'));
  console.log(chalk.gray('  • "help" for more options'));
}

// ---------------------------------------------------------------------------
// Auto-updates
// ---------------------------------------------------------------------------

function simulateUpdates() {
  // Update stats
  stats.liveFloors = Math.min(stats.liveFloors + 1, stats.floors);

  // Update activities
  const agents = ['Alba', 'David', 'Vex', 'Elira', 'Steven'];
  const actions = ['researching patterns', 'building floor', 'auditing code', 'deploying changes'];
  const newActivity = {
    agent: agents[Math.floor(Math.random() * agents.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    floor: Math.floor(Math.random() * 5) + 1,
    building: buildings[Math.floor(Math.random() * buildings.length)].name,
  };
  activities = [newActivity, ...activities.slice(0, 7)];
}

// ---------------------------------------------------------------------------
// Main Interface
// ---------------------------------------------------------------------------

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: colors.primary('askelira> '),
});

console.clear();
showWelcome();

// Start update simulation
const updateInterval = setInterval(simulateUpdates, 5000);

// Show prompt
rl.prompt();

rl.on('line', (input) => {
  if (input.trim()) {
    conversationHistory.push(input);
    console.log(''); // blank line
    processInput(input);
    console.log(''); // blank line
  }
  rl.prompt();
});

rl.on('close', () => {
  clearInterval(updateInterval);
  console.log(colors.success('\n👋 Goodbye!\n'));
  process.exit(0);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  clearInterval(updateInterval);
  console.log(colors.success('\n\n👋 Goodbye!\n'));
  process.exit(0);
});
