/**
 * Autonomous Improvement Loop
 * 
 * Self-improving agent system that:
 * 1. Researches improvements (Alba)
 * 2. Debates what to implement (David's swarm)
 * 3. Implements changes (Claude Code)
 * 4. Validates results (Vex)
 * 5. Commits or rolls back (Elira)
 * 
 * Runs continuously to improve the system over time.
 */

const ClaudeCodeRunner = require('./claude-code-runner');
const Alba = require('../agents/alba');
const David = require('../agents/david');
const Vex = require('../agents/vex');
const Elira = require('../agents/elira');
const fs = require('fs');
const path = require('path');

class AutonomousLoop {
  constructor(config = {}) {
    this.config = {
      researchQuery: config.researchQuery || "What are the latest improvements in AI agents?",
      loopInterval: config.loopInterval || 3600000, // 1 hour
      agentCount: config.agentCount || 10000,
      projectDir: config.projectDir || process.cwd(),
      enabled: config.enabled !== false,
      ...config
    };
    
    this.claude = new ClaudeCodeRunner({
      logDir: path.join(this.config.projectDir, 'logs/autonomous')
    });
    
    this.history = [];
    this.running = false;
  }
  
  /**
   * Start the autonomous improvement loop
   */
  async start() {
    if (this.running) {
      console.log('⚠ Loop already running');
      return;
    }
    
    this.running = true;
    console.log('🔄 Starting autonomous improvement loop...');
    console.log(`   Interval: ${this.config.loopInterval / 1000}s`);
    console.log(`   Agent count: ${this.config.agentCount}`);
    
    // Check if Claude Code is available
    const available = await ClaudeCodeRunner.isAvailable();
    if (!available) {
      console.log('📦 Claude Code not found, installing...');
      await ClaudeCodeRunner.install();
    }
    
    while (this.running) {
      try {
        await this.runIteration();
      } catch (error) {
        console.error('❌ Loop iteration failed:', error.message);
      }
      
      // Wait before next iteration
      if (this.running) {
        console.log(`⏳ Waiting ${this.config.loopInterval / 1000}s before next iteration...`);
        await this.sleep(this.config.loopInterval);
      }
    }
  }
  
  /**
   * Stop the loop
   */
  stop() {
    console.log('🛑 Stopping autonomous loop...');
    this.running = false;
  }
  
  /**
   * Run a single improvement iteration
   */
  async runIteration() {
    const iteration = {
      timestamp: new Date().toISOString(),
      phase: 1,
      result: null
    };
    
    console.log('\n═══════════════════════════════════════');
    console.log('🧠 NEW IMPROVEMENT ITERATION');
    console.log(`   Time: ${iteration.timestamp}`);
    console.log('═══════════════════════════════════════\n');
    
    try {
      // Phase 1: Research (Alba)
      console.log('📚 Phase 1: Research (Alba)');
      const research = await Alba.research(this.config.researchQuery);
      console.log(`   Found ${research.insights?.length || 0} insights`);
      iteration.research = research;
      
      // Phase 2: Swarm Debate (David)
      console.log('\n🧠 Phase 2: Swarm Debate (David)');
      const debate = await David.swarmDebate({
        question: "What improvement should we implement?",
        context: research,
        options: research.suggestions || [],
        agentCount: this.config.agentCount
      });
      console.log(`   Consensus: ${debate.winner} (${debate.confidence}% confidence)`);
      iteration.debate = debate;
      
      // Only proceed if swarm approves
      if (!debate.approved || debate.confidence < 70) {
        console.log('   ⏭️  Swarm rejected or low confidence, skipping implementation');
        iteration.result = 'skipped';
        this.history.push(iteration);
        return;
      }
      
      // Phase 3: Implementation (Claude Code)
      console.log('\n🛠️  Phase 3: Implementation (Claude Code)');
      const implementation = await this.claude.run({
        prompt: this.buildImplementationPrompt(debate.winner, research),
        workdir: this.config.projectDir,
        saveLog: true,
        onProgress: (data) => {
          // Real-time progress (throttled)
          if (Math.random() < 0.1) {
            process.stdout.write('.');
          }
        }
      });
      console.log(`\n   ✓ Implementation complete`);
      iteration.implementation = implementation;
      
      // Phase 4: Validation (Vex)
      console.log('\n🔍 Phase 4: Validation (Vex)');
      const validation = await Vex.audit({
        target: 'recent_changes',
        tests: true
      });
      console.log(`   Validation score: ${validation.score}/10`);
      iteration.validation = validation;
      
      // Phase 5: Decision (Elira)
      console.log('\n🎯 Phase 5: Decision (Elira)');
      const decision = await Elira.synthesize({
        research,
        debate,
        validation
      });
      
      if (decision.action === 'commit' && validation.score >= 7) {
        console.log('   ✅ IMPROVEMENT APPROVED - Committing changes');
        await this.commitChanges(decision);
        iteration.result = 'committed';
      } else {
        console.log('   ❌ IMPROVEMENT REJECTED - Rolling back');
        await this.rollbackChanges();
        iteration.result = 'rolled_back';
      }
      
      iteration.decision = decision;
      
    } catch (error) {
      console.error('❌ Iteration failed:', error.message);
      iteration.result = 'failed';
      iteration.error = error.message;
      
      // Attempt rollback
      try {
        await this.rollbackChanges();
      } catch (rollbackError) {
        console.error('❌ Rollback also failed:', rollbackError.message);
      }
    }
    
    // Save to history
    this.history.push(iteration);
    this.saveHistory();
    
    console.log('\n═══════════════════════════════════════');
    console.log(`ITERATION COMPLETE: ${iteration.result}`);
    console.log('═══════════════════════════════════════\n');
  }
  
  /**
   * Build implementation prompt for Claude Code
   */
  buildImplementationPrompt(improvement, research) {
    return `
Implement the following improvement to this AskElira agent system:

IMPROVEMENT: ${improvement}

CONTEXT:
${JSON.stringify(research.context || {}, null, 2)}

REQUIREMENTS:
1. Modify the relevant agent file (agents/*.js)
2. Add tests if needed (test/*.js)
3. Update documentation (docs/*.md)
4. Run existing tests to ensure nothing broke
5. Commit changes with descriptive message

SAFETY:
- Only modify files in agents/, test/, or docs/
- Do NOT modify core framework files
- Run 'npm test' before finishing
- If tests fail, rollback changes

Start with reading the current agent code, then implement the improvement.
    `.trim();
  }
  
  /**
   * Commit approved changes
   */
  async commitChanges(decision) {
    const message = `feat: ${decision.summary}\n\n${decision.reasoning}`;
    
    // Git commit (if in git repo)
    try {
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec(`git add . && git commit -m "${message}"`, {
          cwd: this.config.projectDir
        }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      console.log('   ✓ Changes committed to git');
    } catch (error) {
      console.log('   ⚠ Not a git repo or commit failed');
    }
  }
  
  /**
   * Rollback failed changes
   */
  async rollbackChanges() {
    try {
      const { exec } = require('child_process');
      await new Promise((resolve) => {
        exec('git checkout .', {
          cwd: this.config.projectDir
        }, () => resolve());
      });
      console.log('   ✓ Changes rolled back');
    } catch (error) {
      console.log('   ⚠ Rollback failed (not a git repo?)');
    }
  }
  
  /**
   * Save iteration history
   */
  saveHistory() {
    const historyFile = path.join(this.config.projectDir, 'logs/autonomous-history.json');
    const dir = path.dirname(historyFile);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(historyFile, JSON.stringify(this.history, null, 2));
  }
  
  /**
   * Get improvement statistics
   */
  getStats() {
    const total = this.history.length;
    const committed = this.history.filter(i => i.result === 'committed').length;
    const rolledBack = this.history.filter(i => i.result === 'rolled_back').length;
    const skipped = this.history.filter(i => i.result === 'skipped').length;
    const failed = this.history.filter(i => i.result === 'failed').length;
    
    return {
      total,
      committed,
      rolledBack,
      skipped,
      failed,
      successRate: total > 0 ? (committed / total * 100).toFixed(1) : 0
    };
  }
  
  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = AutonomousLoop;
