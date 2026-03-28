#!/bin/bash
# Start Steven - the AskElira building engineer
# Run this to start Steven in the background on your Mac.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/steven-runner.log"
PID_FILE="/tmp/steven-runner.pid"

cd "$SCRIPT_DIR/.."

# Kill existing instance
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Steven already running (PID $OLD_PID). Use 'stop-steven.sh' first."
    exit 1
  fi
fi

# Start in background using .env file
nohup node scripts/steven-runner.cjs > "$LOG_FILE" 2>&1 &

echo $! > "$PID_FILE"
echo "Steven started (PID $!)"
echo "Log: $LOG_FILE"
echo "Use 'tail -f $LOG_FILE' to watch"
echo "Use './scripts/stop-steven.sh' to stop"
