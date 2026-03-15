#!/bin/bash
# Prepare Quantjellyfish for GitHub Release
# Scrubs personal data and creates clean repo

set -e

echo "🌐 QUANTJELLYFISH GITHUB RELEASE PREP"
echo "====================================="
echo ""

# 1. Create clean copy
echo "📁 Creating clean repository copy..."
CLEAN_DIR="$HOME/Desktop/quantjellyfish-release"
rm -rf "$CLEAN_DIR"
mkdir -p "$CLEAN_DIR"

# 2. Copy source files (exclude data/)
echo "📋 Copying source files..."
cd ~/Desktop/Polymarket

rsync -av \
  --exclude='.git' \
  --exclude='data/' \
  --exclude='*.pem' \
  --exclude='.env' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.DS_Store' \
  --exclude='node_modules' \
  . "$CLEAN_DIR/"

# 3. Create .env.example (scrubbed)
echo "🔒 Creating .env.example..."
cat > "$CLEAN_DIR/.env.example" << 'EOF'
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (for long-term memory)
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=polymarket-agent-memory

# MiroFish
MIROFISH_URL=http://localhost:5001

# Trading mode
TRADING_MODE=paper  # paper or live

# Schedule (local time)
SCAN_TIME=09:00
MONITOR_TIME=08:45

# Live trading (optional, for future use)
# POLYMARKET_API_KEY=...
# KALSHI_API_KEY=...
# KALSHI_PRIVATE_KEY_PATH=./kalshi_private_key.pem
EOF

# 4. Update .gitignore
echo "🚫 Creating .gitignore..."
cat > "$CLEAN_DIR/.gitignore" << 'EOF'
# Environment
.env
*.pem

# Data (contains positions and personal trading data)
data/active_positions.json
data/pipeline_state.json
data/cost_log.json
data/*.csv
data/seeds/*.txt

# Python
__pycache__/
*.pyc
*.pyo
*.egg-info/
.venv/
venv/

# System
.DS_Store
.idea/
.vscode/

# Build
dist/
build/
*.log

# MiroFish
MiroFish/
EOF

# 5. Create placeholder data files
echo "📝 Creating placeholder data files..."
mkdir -p "$CLEAN_DIR/data"
echo '{"positions": []}' > "$CLEAN_DIR/data/active_positions.json"
echo "DATE,MARKET,PLATFORM,SIM_CONFIDENCE,SIM_DIRECTION,ACTUAL_OUTCOME,WIN_LOSS,VARIANCE,TIER,POSITION_SIZE,PNL,SEED_QUALITY,LESSON" > "$CLEAN_DIR/data/calibration_log.csv"

# 6. Initialize Git
echo "📦 Initializing Git repository..."
cd "$CLEAN_DIR"
git init
git add .
git commit -m "Initial commit: Quantjellyfish v1.0.0

Autonomous prediction market trading system powered by MiroFish swarm intelligence.

Features:
- 5 specialized AI agents (Alba, David, Vex, Orb, Steven)
- MiroFish swarm intelligence integration
- 6-gate validation framework
- Paper trading mode (production-ready)
- Real trading infrastructure (API stubs ready)
- Calibration and learning system
- Long-term memory (Pinecone)
- Comprehensive documentation

Agents:
- Alba: Research analyst (web search, market scan, seed generation)
- David: Engineer (MiroFish automation, multi-run orchestration)
- Vex: Adversarial auditor (8-point quality gate)
- Orb: Operations manager (6-gate validation, capital tiers)
- Steven: Live trader (paper/real execution)

Built by: Jelly + OpenClaw
License: MIT"

echo ""
echo "✅ Clean repository created at:"
echo "   $CLEAN_DIR"
echo ""
echo "📋 Next steps:"
echo "1. Review files in $CLEAN_DIR"
echo "2. Verify no personal data leaked"
echo "3. Test: cd $CLEAN_DIR && ./start_paper_trading.sh --once"
echo "4. Create GitHub repo"
echo "5. Push: git remote add origin git@github.com:yourusername/quantjellyfish.git"
echo "6.       git branch -M main"
echo "7.       git push -u origin main"
echo ""
echo "🌐 Ready for open-source release!"
