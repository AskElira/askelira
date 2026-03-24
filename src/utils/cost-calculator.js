const BRAVE_COST_PER_QUERY = 0.005;
const SWARM_COST_PER_AGENT = 0.000007;

// Anthropic pricing per 1M tokens
const ANTHROPIC_PRICING = {
  'claude-opus-4-6':          { input: 15.00, output: 75.00 },
  'claude-sonnet-4-5':        { input:  3.00, output: 15.00 },
  'claude-haiku-4-5':         { input:  0.80, output:  4.00 },
};

const ledger = [];

function calculateBraveSearchCost(queryCount = 1) {
  const cost = queryCount * BRAVE_COST_PER_QUERY;
  record('brave_search', cost, { queryCount });
  return cost;
}

function calculateAnthropicCost(model, inputTokens, outputTokens) {
  const pricing = ANTHROPIC_PRICING[model];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}. Available: ${Object.keys(ANTHROPIC_PRICING).join(', ')}`);
  }
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const cost = inputCost + outputCost;
  record('anthropic', cost, { model, inputTokens, outputTokens });
  return cost;
}

function calculateSwarmCost(agentCount) {
  const cost = agentCount * SWARM_COST_PER_AGENT;
  record('swarm', cost, { agentCount });
  return cost;
}

function getTotalCost() {
  return ledger.reduce((sum, entry) => sum + entry.cost, 0);
}

function getLedger() {
  return [...ledger];
}

function resetLedger() {
  ledger.length = 0;
}

function record(type, cost, metadata) {
  ledger.push({
    type,
    cost,
    metadata,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  calculateBraveSearchCost,
  calculateAnthropicCost,
  calculateSwarmCost,
  getTotalCost,
  getLedger,
  resetLedger,
};
