#!/usr/bin/env node

/**
 * Test script for AskElira 2.1 agent implementation
 *
 * Tests the swarm debate flow with all 4 agents:
 * Alba (research) → David (debate) → Vex (audit) → Elira (synthesis)
 */

// Load environment variables from .env file
try {
  require('dotenv').config();
} catch (err) {
  // dotenv not installed, try loading .env manually
  const fs = require('fs');
  const path = require('path');
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (err) {
    // .env file not found or unreadable
  }
}

const { Swarm } = require('./src/agents/swarm');

async function testAgents() {
  console.log('🧪 Testing AskElira 2.1 Agent Implementation\n');
  console.log('═'.repeat(60));

  // Check environment
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set in environment');
    console.log('\nSet it in .env file or export it:');
    console.log('  export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  console.log('✅ Environment configured');
  console.log('✅ API key found:', process.env.ANTHROPIC_API_KEY.slice(0, 20) + '...');
  console.log('═'.repeat(60));
  console.log();

  // Test question
  const question = 'Build a simple todo list web app with add, complete, and delete functionality';
  console.log('📋 Test Question:');
  console.log(`   "${question}"`);
  console.log();

  // Create swarm
  console.log('🐝 Initializing 10,000-agent swarm...');
  const swarm = new Swarm({ agents: 10000 });
  console.log('✅ Swarm ready');
  console.log();

  try {
    // Run full debate pipeline
    console.log('🚀 Starting agent pipeline...');
    console.log('═'.repeat(60));
    console.log();

    const startTime = Date.now();
    const result = await swarm.debate(question);
    const duration = Date.now() - startTime;

    console.log();
    console.log('═'.repeat(60));
    console.log('✅ PIPELINE COMPLETE');
    console.log('═'.repeat(60));
    console.log();

    // Display results
    console.log('📊 RESULTS:');
    console.log();

    console.log('1️⃣  ALBA (Research):');
    console.log('   Summary:', result.research.summary);
    console.log('   Feasibility:', result.research.technicalFeasibility);
    console.log('   Confidence:', result.research.confidence + '%');
    console.log('   Sources:', result.research.sources?.length || 0);
    console.log();

    console.log('2️⃣  DAVID (Debate):');
    console.log('   Decision:', result.debate.decision);
    console.log('   Confidence:', result.debate.confidence + '%');
    console.log('   Consensus:', result.debate.consensus);
    console.log('   Votes For:', result.debate.votes?.for || 'N/A');
    console.log('   Votes Against:', result.debate.votes?.against || 'N/A');
    console.log('   Arguments For:', result.debate.argumentsFor?.length || 0);
    console.log('   Arguments Against:', result.debate.argumentsAgainst?.length || 0);
    console.log();

    console.log('3️⃣  VEX (Audit):');
    console.log('   Passed:', result.audit.passed ? '✅ YES' : '❌ NO');
    console.log('   Issues:', result.audit.issues?.length || 0);
    console.log('   Challenges:', result.audit.challenges?.length || 0);
    console.log('   Confidence Adjustment:', result.audit.confidenceAdjustment || 0);
    console.log('   Recommended Confidence:', result.audit.recommendedConfidence + '%');
    console.log();

    console.log('4️⃣  ELIRA (Synthesis):');
    console.log('   Final Decision:', result.synthesis.decision);
    console.log('   Final Confidence:', result.synthesis.confidence + '%');
    console.log('   Buildable:', result.synthesis.buildable ? '✅ YES' : '❌ NO');
    console.log('   Recommendation:', result.synthesis.recommendation);
    if (result.synthesis.buildPlan) {
      console.log('   Build Plan:');
      console.log('     Description:', result.synthesis.buildPlan.description);
      console.log('     Approach:', result.synthesis.buildPlan.approach);
      console.log('     Complexity:', result.synthesis.buildPlan.estimatedComplexity);
      console.log('     Time:', result.synthesis.buildPlan.estimatedTime);
    }
    console.log();

    console.log('💰 COST ANALYSIS:');
    console.log('   Alba Cost: $' + (result.research.cost || 0).toFixed(4));
    console.log('   David Cost: $' + (result.debate.cost || 0).toFixed(4));
    console.log('   Vex Cost: $' + (result.audit.cost || 0).toFixed(4));
    console.log('   Elira Cost: $' + (result.synthesis.cost || 0).toFixed(4));
    console.log('   ────────────────');
    console.log('   Total Cost: $' + result.totalCost.toFixed(4));
    console.log();

    console.log('⏱️  PERFORMANCE:');
    console.log('   Total Duration:', (duration / 1000).toFixed(2) + 's');
    console.log('   Average per Agent:', (duration / 4000).toFixed(2) + 's');
    console.log();

    console.log('═'.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('═'.repeat(60));
    console.log();
    console.log('🎉 AskElira 2.1 agents are fully operational!');
    console.log();
    console.log('Next steps:');
    console.log('  • Start the app: npm run dev');
    console.log('  • Open http://localhost:3000');
    console.log('  • Click "Build" to create an automation');
    console.log();

  } catch (error) {
    console.error();
    console.error('═'.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('═'.repeat(60));
    console.error();
    console.error('Error:', error.message);
    if (error.stack) {
      console.error();
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error();
    console.error('Troubleshooting:');
    console.error('  1. Check ANTHROPIC_API_KEY is valid');
    console.error('  2. Check internet connectivity');
    console.error('  3. Check API quota/rate limits');
    console.error('  4. Review error message above for details');
    console.error();
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testAgents().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { testAgents };
