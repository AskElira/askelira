#!/bin/bash
# Quantjellyfish Paper Trading Deployment
# Auto-start script for daily scheduled runs

set -e

echo "🐙 QUANTJELLYFISH PAPER TRADING DEPLOYMENT"
echo "=========================================="
echo ""

# Load environment variables from .env
if [ -f .env ]; then
    echo "📝 Loading environment from .env..."
    export $(grep -v '^#' .env | xargs)
    echo "✅ Environment loaded"
else
    echo "⚠️  No .env file found (using system environment)"
fi
echo ""

# Check MiroFish is running
echo "📊 Checking MiroFish backend..."
if ! curl -s http://localhost:5001/api/graph/project/ping > /dev/null 2>&1; then
    echo "❌ MiroFish not reachable at localhost:5001"
    echo "   Start it with: cd MiroFish/Mirofish && docker-compose up -d"
    exit 1
fi
echo "✅ MiroFish backend is running"
echo ""

# Check environment
echo "🔧 Checking environment variables..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY not set"
    echo "   Export it in your shell: export ANTHROPIC_API_KEY='sk-ant-...'"
    exit 1
fi
echo "✅ ANTHROPIC_API_KEY is set"

if [ -z "$PINECONE_API_KEY" ]; then
    echo "⚠️  PINECONE_API_KEY not set (optional but recommended)"
else
    echo "✅ PINECONE_API_KEY is set"
fi

# Set trading mode to paper (default)
export TRADING_MODE=paper
echo "✅ Trading mode: PAPER (safe)"
echo ""

# Create data directory
mkdir -p data
echo "✅ Data directory ready"
echo ""

# Detect Python command
if command -v python3 &> /dev/null; then
    PYTHON=python3
elif command -v python &> /dev/null; then
    PYTHON=python
else
    echo "❌ Python not found. Install Python 3.11+ first."
    exit 1
fi
echo "✅ Using: $PYTHON ($(${PYTHON} --version))"
echo ""

# Run mode selection
if [ "$1" = "--once" ]; then
    echo "🎯 Running single pipeline pass..."
    $PYTHON loop.py --once
elif [ "$1" = "--monitor" ]; then
    echo "👀 Running position monitor..."
    $PYTHON loop.py --monitor
elif [ "$1" = "--schedule" ]; then
    echo "⏰ Starting scheduled daily runs..."
    echo "   SCAN_TIME=${SCAN_TIME:-09:00} (full pipeline)"
    echo "   MONITOR_TIME=${MONITOR_TIME:-08:45} (position monitoring)"
    echo ""
    echo "   Press Ctrl+C to stop"
    $PYTHON loop.py
else
    echo "Usage:"
    echo "  ./start_paper_trading.sh --once      # Single run (testing)"
    echo "  ./start_paper_trading.sh --monitor   # Monitor positions"
    echo "  ./start_paper_trading.sh --schedule  # Daily scheduled runs"
    echo ""
    echo "Example: ./start_paper_trading.sh --once"
fi
