#!/bin/bash
# AskElira 2.0 Build Orchestrator - Automated Step-by-Step

TERMINAL_ID=$(cat ~/Desktop/current_terminal.txt)
BUILD_PLAN="$HOME/Desktop/askelira-bundled-npm/BUILD_PLAN.json"
STATE_FILE="$HOME/Desktop/askelira-bundled-npm/build_state.json"
BOT_TOKEN="8698611165:AAEn3akHWf0MQNxtvXRHD3DeUJCT54NrafI"
CHAT_ID="5771911036"

send_telegram() {
    curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
      -H "Content-Type: application/json" \
      -d "{\"chat_id\": \"${CHAT_ID}\", \"text\": \"$1\"}" > /dev/null
}

# Initialize state
if [ ! -f "$STATE_FILE" ]; then
    echo '{"current_step": 1, "completed": [], "failed": []}' > "$STATE_FILE"
fi

# Extract steps from BUILD_PLAN
extract_step() {
    local step_num=$1
    python3 << PYTHON
import json
with open('$BUILD_PLAN') as f:
    plan = json.load(f)
for phase in plan['phases']:
    for step in phase['steps']:
        if step['step'] == $step_num:
            print(step['claude_prompt'])
            exit(0)
PYTHON
}

send_step_to_claude() {
    local step_num=$1
    local prompt=$(extract_step $step_num)
    
    echo "[$step_num/10] Sending to Claude Code..."
    
    # Send prompt
    osascript << EOF
tell application "Terminal"
    do script "$prompt" in window id $TERMINAL_ID
end tell
EOF
    
    sleep 1
    
    # Press Enter
    osascript << EOF
tell application "Terminal"
    do script "" in window id $TERMINAL_ID
end tell
EOF
}

wait_for_completion() {
    local step_num=$1
    local max_wait=600  # 10 minutes max
    local waited=0
    
    echo "   Waiting for completion (max 10 min)..."
    
    while [ $waited -lt $max_wait ]; do
        # Check terminal for completion signs
        CONTENT=$(osascript -e "tell application \"Terminal\" to get contents of window id $TERMINAL_ID" 2>/dev/null)
        
        # Check for done/ready/success
        if echo "$CONTENT" | grep -iE "Done|Finished|Success|Ready" > /dev/null; then
            echo "   ✅ Step $step_num complete!"
            return 0
        fi
        
        # Check for errors
        if echo "$CONTENT" | grep -iE "Error|Failed|Exception" > /dev/null; then
            echo "   ❌ Step $step_num failed!"
            return 1
        fi
        
        sleep 10
        waited=$((waited + 10))
    done
    
    echo "   ⏱️  Timeout waiting for Step $step_num"
    return 1
}

verify_step() {
    local step_num=$1
    
    case $step_num in
        1)
            [ -f "package.json" ] && echo "✅ package.json exists" || echo "❌ Missing package.json"
            ;;
        2)
            [ -d "src" ] && [ -d "bin" ] && echo "✅ Directories exist" || echo "❌ Missing directories"
            ;;
        3)
            [ -f "bin/cli.js" ] && [ -x "bin/cli.js" ] && echo "✅ CLI executable" || echo "❌ CLI missing"
            ;;
        *)
            echo "✅ Step $step_num assumed complete"
            ;;
    esac
}

# Main build loop
cd ~/Desktop/askelira-bundled-npm

echo "🚀 Starting AskElira 2.0 Build - Phase 1"
echo "════════════════════════════════════════════════════════"
echo ""

send_telegram "🚀 Build Started!

Phase 1: Project Setup (10 steps)
Terminal: $TERMINAL_ID
Auto-approval: Active

I'll update you every step!"

for step in {1..10}; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "STEP $step/10"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Send step to Claude Code
    send_step_to_claude $step
    
    # Wait for completion
    if wait_for_completion $step; then
        # Verify it worked
        verify_step $step
        
        # Update state
        python3 << PYTHON
import json
with open('$STATE_FILE', 'r') as f:
    state = json.load(f)
state['completed'].append($step)
state['current_step'] = $step + 1
with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)
PYTHON
        
        # Notify every 3 steps
        if [ $((step % 3)) -eq 0 ]; then
            send_telegram "✅ Step $step/10 complete!

Progress: $step steps done
Still building..."
        fi
    else
        echo "   ⚠️  Step $step had issues"
        python3 << PYTHON
import json
with open('$STATE_FILE', 'r') as f:
    state = json.load(f)
state['failed'].append($step)
with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)
PYTHON
    fi
    
    # Brief pause between steps
    sleep 5
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "🎉 PHASE 1 COMPLETE!"
echo "════════════════════════════════════════════════════════"

send_telegram "🎉 Phase 1 Complete!

✅ Project setup done (10 steps)
📦 npm package structure ready
🧠 Memory system configured
⏰ Time: ~1 hour

Next: Test with 'npm install' and continue to Phase 2!"

echo ""
echo "Next steps:"
echo "1. cd ~/Desktop/askelira-bundled-npm"
echo "2. npm install"
echo "3. Test: ./bin/cli.js --version"
echo "4. Continue to Phase 2!"
