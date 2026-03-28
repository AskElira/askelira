#!/bin/bash
# Stop Steven - the AskElira building engineer
PID_FILE="/tmp/steven-runner.pid"
LOG_FILE="/tmp/steven-runner.log"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    echo "Steven stopped (PID $PID)"
  else
    echo "Steven not running (stale PID file)"
  fi
  rm -f "$PID_FILE"
else
  # Fallback: find by process name
  PIDS=$(pgrep -f "steven-runner.ts" 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "Killing Steven PIDs: $PIDS"
    echo "$PIDS" | xargs kill 2>/dev/null
  else
    echo "Steven not running"
  fi
fi
