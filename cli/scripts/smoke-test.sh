#!/usr/bin/env bash
# ============================================================
# AskElira CLI — Smoke Test
# ============================================================
# Tests every command's --help output to verify they are wired.
# Exit code 0 = all passed, 1 = failure.

set -euo pipefail

CLI="node dist/bin/askelira.js"
PASS=0
FAIL=0
ERRORS=""

# Change to CLI directory
cd "$(dirname "$0")/.."

# Ensure built
if [ ! -f "dist/bin/askelira.js" ]; then
  echo "ERROR: dist/bin/askelira.js not found. Run 'npm run build' first."
  exit 1
fi

echo ""
echo "  AskElira CLI Smoke Test"
echo "  ======================="
echo ""

# Test --version
echo -n "  --version ... "
VERSION_OUT=$($CLI --version 2>&1 || true)
if echo "$VERSION_OUT" | grep -q "1.0.0"; then
  echo "PASS (${VERSION_OUT})"
  PASS=$((PASS + 1))
else
  echo "FAIL"
  FAIL=$((FAIL + 1))
  ERRORS="${ERRORS}\n  --version: expected 1.0.0, got: ${VERSION_OUT}"
fi

# Test --help
echo -n "  --help ... "
HELP_OUT=$($CLI --help 2>&1 || true)
if echo "$HELP_OUT" | grep -q "AskElira"; then
  echo "PASS"
  PASS=$((PASS + 1))
else
  echo "FAIL"
  FAIL=$((FAIL + 1))
  ERRORS="${ERRORS}\n  --help: missing AskElira header"
fi

# Test each command's help
COMMANDS=(
  login
  logout
  whoami
  build
  status
  floors
  logs
  watch
  run
  rollback
  workspace
  start
  stop
  heartbeat
  init
  completion
)

for CMD in "${COMMANDS[@]}"; do
  echo -n "  ${CMD} --help ... "
  CMD_OUT=$($CLI help "$CMD" 2>&1 || true)
  if echo "$CMD_OUT" | grep -qi "usage\|description\|options\|arguments\|${CMD}"; then
    echo "PASS"
    PASS=$((PASS + 1))
  else
    echo "FAIL"
    FAIL=$((FAIL + 1))
    ERRORS="${ERRORS}\n  ${CMD}: help output did not match expected pattern"
  fi
done

# Verify no placeholder text remains
echo -n "  No placeholders ... "
PLACEHOLDER_CHECK=$(grep -r "Coming in Phase" dist/ 2>/dev/null || true)
if [ -z "$PLACEHOLDER_CHECK" ]; then
  echo "PASS"
  PASS=$((PASS + 1))
else
  echo "FAIL (found placeholder text)"
  FAIL=$((FAIL + 1))
  ERRORS="${ERRORS}\n  Placeholder text found in dist/"
fi

# Summary
echo ""
echo "  ======================="
echo "  Results: ${PASS} passed, ${FAIL} failed"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  Failures:"
  echo -e "$ERRORS"
  echo ""
  exit 1
else
  echo "  All smoke tests passed."
  echo ""
  exit 0
fi
