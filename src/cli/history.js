const chalk = require('chalk');
const { searchMemory, getRecentDebates } = require('../memory');

module.exports = async function history(options) {
  const { query, recent, list, json } = options;

  let results;

  if (query) {
    results = await handleSearch(query);
  } else if (recent) {
    const days = parseInt(recent) || 7;
    results = handleRecent(days);
  } else if (list) {
    results = handleRecent(365);
  } else {
    results = handleRecent(7);
  }

  if (results.length === 0) {
    console.log(chalk.yellow('No debates found.'));
    return;
  }

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  displayResults(results, query ? 'search' : 'recent');
};

async function handleSearch(query) {
  const matches = await searchMemory(query, 10);
  return matches.map((m) => ({
    question: m.metadata.question || 'Unknown',
    decision: m.metadata.decision || 'Unknown',
    confidence: m.metadata.confidence || 0,
    cost: m.metadata.cost || 0,
    date: m.metadata.timestamp ? m.metadata.timestamp.split('T')[0] : 'Unknown',
    similarity: m.distance != null ? Math.round((1 - m.distance) * 100) : null,
  }));
}

function handleRecent(days) {
  return getRecentDebates(days);
}

function displayResults(results, mode) {
  const header = mode === 'search'
    ? chalk.cyan(`\nFound ${results.length} matching debate(s):\n`)
    : chalk.cyan(`\nShowing ${results.length} recent debate(s):\n`);
  console.log(header);

  for (const r of results) {
    const confidence = colorConfidence(r.confidence);
    const decision = colorDecision(r.decision);

    console.log(chalk.white(`  ${r.date}  ${decision}  ${confidence}  ${chalk.gray(r.question)}`));

    if (r.similarity != null) {
      console.log(chalk.gray(`           Match: ${r.similarity}%`));
    }
  }

  console.log();
}

function colorDecision(decision) {
  const padded = decision.padEnd(13);
  if (decision === 'yes') return chalk.green(padded);
  if (decision === 'no') return chalk.red(padded);
  return chalk.yellow(padded);
}

function colorConfidence(confidence) {
  const label = `${confidence}%`.padStart(4);
  if (confidence >= 70) return chalk.green(label);
  if (confidence >= 40) return chalk.yellow(label);
  return chalk.red(label);
}
