const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(require('os').homedir(), '.askelira', 'memory');
const INDEX_FILE = path.join(MEMORY_DIR, 'index.json');

function init() {
  // Ensure file-based memory directory exists
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
  
  // Create index if doesn't exist
  if (!fs.existsSync(INDEX_FILE)) {
    fs.writeFileSync(INDEX_FILE, JSON.stringify([]), 'utf-8');
  }
}

async function saveToMemory(result) {
  init();
  
  // Save to markdown file
  await saveToFile(result);
  
  // Save to index for search
  await saveToIndex(result);
}

async function saveToFile(result) {
  const date = new Date().toISOString().split('T')[0];
  const filePath = path.join(MEMORY_DIR, `${date}.md`);
  const time = new Date().toLocaleTimeString();

  const entry = `
---

## ${time} — ${result.question}

**Decision:** ${result.decision}
**Confidence:** ${result.confidence}%
**Agents:** ${result.agentCount.toLocaleString()}
**Cost:** $${result.actualCost.toFixed(3)}
**Duration:** ${result.duration || 0}ms

### Arguments For
${(result.argumentsFor || []).map((a) => `- ${a}`).join('\n') || '- None'}

### Arguments Against
${(result.argumentsAgainst || []).map((a) => `- ${a}`).join('\n') || '- None'}

${result.auditNotes?.length ? `### Audit Notes\n${result.auditNotes.map((n) => `- ${n}`).join('\n')}` : ''}
`;

  fs.appendFileSync(filePath, entry, 'utf-8');
}

async function saveToIndex(result) {
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  
  index.push({
    id: `decision_${Date.now()}`,
    question: result.question,
    decision: result.decision,
    confidence: result.confidence,
    cost: result.actualCost,
    agentCount: result.agentCount,
    timestamp: result.timestamp || new Date().toISOString(),
  });
  
  // Keep last 1000 entries
  if (index.length > 1000) {
    index.shift();
  }
  
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

async function searchMemory(query, limit = 5) {
  init();
  
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  const queryLower = query.toLowerCase();
  
  // Simple keyword search (can be enhanced with better algorithms)
  const results = index
    .map((entry) => ({
      ...entry,
      score: calculateRelevance(entry.question, queryLower),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return results;
}

function calculateRelevance(question, query) {
  const questionLower = question.toLowerCase();
  let score = 0;
  
  // Exact match
  if (questionLower.includes(query)) {
    score += 10;
  }
  
  // Word matches
  const queryWords = query.split(/\s+/);
  queryWords.forEach((word) => {
    if (questionLower.includes(word)) {
      score += 1;
    }
  });
  
  return score;
}

function getRecentDebates(days = 7) {
  init();

  const now = new Date();
  const files = [];

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const filename = date.toISOString().split('T')[0] + '.md';
    const filePath = path.join(MEMORY_DIR, filename);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const debates = parseMarkdownDebates(content, filename);
      files.push(...debates);
    }
  }

  return files;
}

function parseMarkdownDebates(content, filename) {
  const date = filename.replace('.md', '');
  const sections = content.split('\n---\n').filter((s) => s.trim());

  return sections.map((section) => {
    const questionMatch = section.match(/## .+ — (.+)/);
    const decisionMatch = section.match(/\*\*Decision:\*\* (.+)/);
    const confidenceMatch = section.match(/\*\*Confidence:\*\* (\d+)%/);
    const costMatch = section.match(/\*\*Cost:\*\* \$(.+)/);

    return {
      date,
      question: questionMatch ? questionMatch[1] : 'Unknown',
      decision: decisionMatch ? decisionMatch[1] : 'Unknown',
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 0,
      cost: costMatch ? parseFloat(costMatch[1]) : 0,
      raw: section.trim(),
    };
  });
}

module.exports = { init, saveToMemory, searchMemory, getRecentDebates };
