#!/bin/bash

###############################################################################
# AskElira CLI/TUI Demo Script
#
# Demonstrates all the visual features of the enhanced CLI
###############################################################################

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║              🎨 AskElira CLI/TUI Demo                               ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "This demo will showcase all the visual CLI features."
echo "Press ENTER to continue through each step..."
echo ""

read -p "▶ Press ENTER to start..."

# Function to pause
pause() {
  echo ""
  read -p "▶ Press ENTER to continue..."
  echo ""
}

# Demo 1: Show version
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 1: Version Display"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node bin/cli-enhanced.js --version
pause

# Demo 2: Status command
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 2: Status Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node bin/cli-enhanced.js status
pause

# Demo 3: Agent activity
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 3: Agent Activity Display"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ASKELIRA_NO_BANNER=1 node bin/cli-enhanced.js agents
pause

# Demo 4: Building visualization (short)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 4: Building Progress Visualization"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Watch the animated progress bars build 3 floors..."
echo ""
ASKELIRA_NO_BANNER=1 node bin/cli-enhanced.js build --floors 3 &
BUILD_PID=$!

# Wait for it to complete (max 10 seconds)
sleep 10
kill $BUILD_PID 2>/dev/null

pause

# Demo 5: Help menu
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 5: Main Menu (no args)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node bin/cli-enhanced.js
pause

# Demo 6: TUI info
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo 6: TUI Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "The full TUI dashboard is available via:"
echo "  • askelira-tui"
echo "  • ask dashboard"
echo ""
echo "Features:"
echo "  ✓ Interactive menu navigation"
echo "  ✓ Real-time building monitoring"
echo "  ✓ Agent activity feed"
echo "  ✓ Keyboard shortcuts (↑↓ ESC Q)"
echo ""
echo "To launch the TUI now, run:"
echo "  node bin/tui-dashboard.js"
echo ""
pause

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You've seen all the visual features:"
echo "  ✓ Colorful ASCII art banners"
echo "  ✓ Styled message boxes"
echo "  ✓ Progress bars and spinners"
echo "  ✓ Agent activity displays"
echo "  ✓ Dashboard summaries"
echo ""
echo "Try these commands:"
echo "  ask status          - Show dashboard"
echo "  ask build           - Simulate building"
echo "  askelira-tui        - Launch interactive TUI"
echo ""
echo "Documentation:"
echo "  • CLI_TUI_GUIDE.md"
echo "  • CLI_IMPROVEMENTS_SUMMARY.md"
echo ""
echo "Enjoy your enhanced AskElira CLI! 🎨✨"
echo ""
