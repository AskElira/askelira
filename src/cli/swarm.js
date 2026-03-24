const { Swarm } = require('../agents/swarm');
const { saveToMemory } = require('../memory');
const chalk = require('chalk');

module.exports = async function swarm(options) {
  const { question, agents } = options;

  if (!question) {
    console.error('Error: --question required');
    process.exit(1);
  }

  const agentCount = parseInt(agents);
  const cost = calculateCost(agentCount);

  console.log(chalk.cyan(`
🧠 Starting ${agentCount.toLocaleString()} agent swarm...`));
  console.log(chalk.gray(`   Cost: ${cost.toFixed(3)}`));
  console.log();

  const swarm = new Swarm({ agents: agentCount });
  const result = await swarm.debate(question);

  // Save to memory
  await saveToMemory(result);

  // Display results
  console.log(chalk.green(`
✅ Decision: ${result.decision}`));
  console.log(chalk.blue(`   Confidence: ${result.confidence}%`));
  console.log(chalk.gray(`   Cost: ${result.actualCost.toFixed(3)}`));

  return result;
};

function calculateCost(agents) {
  return agents * 0.000007;
}
