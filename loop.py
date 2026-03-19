"""
Polymarket MiroFish Agent Loop — Entry Point

Usage:
  python loop.py            # run on schedule (daily at SCAN_TIME)
  python loop.py --once     # run one full pipeline pass immediately and exit
  python loop.py --monitor  # run position monitor once and exit
"""

import argparse
import logging
import os
import sys
from datetime import date, timezone, datetime

# Ensure project root and Agents/ dir are both on sys.path
_ROOT = os.path.dirname(os.path.abspath(__file__))
_AGENTS_DIR = os.path.join(_ROOT, "Agents")
for _p in (_ROOT, _AGENTS_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import schedule
import time
from dotenv import load_dotenv

load_dotenv()

# ------------------------------------------------------------------ #
#  Logging setup                                                       #
# ------------------------------------------------------------------ #

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-10s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("data/loop.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("loop")


# ------------------------------------------------------------------ #
#  Validate environment on startup                                     #
# ------------------------------------------------------------------ #

def check_env() -> bool:
    required = ["ANTHROPIC_API_KEY"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        log.error(f"Missing required env vars: {missing}")
        log.error("Copy .env.example to .env and fill in your keys.")
        return False
    mirofish_url = os.environ.get("MIROFISH_URL", "http://localhost:5001")
    from mirofish_client import MiroFishClient
    client = MiroFishClient(mirofish_url)
    if not client.ping():
        log.error(f"MiroFish not reachable at {mirofish_url}")
        log.error("Start it with: docker-compose up -d (from your MiroFish directory)")
        return False
    log.info(f"✓ MiroFish reachable at {mirofish_url}")
    return True


# ------------------------------------------------------------------ #
#  Scheduled jobs                                                      #
# ------------------------------------------------------------------ #

def run_pipeline():
    from orb import run_full_pipeline
    today = date.today().isoformat()
    log.info(f"--- Scheduled pipeline run: {today} ---")
    try:
        result = run_full_pipeline(today)
        log.info(f"Pipeline result: {result.get('status')}")
    except Exception as e:
        log.exception(f"Pipeline crashed: {e}")


def run_monitor():
    from orb import monitor_open_positions
    today = date.today().isoformat()
    log.info(f"--- Scheduled monitor run: {today} ---")
    try:
        monitor_open_positions(today)
    except Exception as e:
        log.exception(f"Monitor crashed: {e}")


# ------------------------------------------------------------------ #
#  Main                                                                #
# ------------------------------------------------------------------ #

def main():
    parser = argparse.ArgumentParser(description="Polymarket MiroFish agent loop")
    parser.add_argument("--once",    action="store_true", help="Run one pipeline pass and exit")
    parser.add_argument("--monitor", action="store_true", help="Run position monitor once and exit")
    args = parser.parse_args()

    log.info("=" * 60)
    log.info("  Polymarket MiroFish Agent Loop")
    log.info(f"  Started: {datetime.now(timezone.utc).isoformat()}")
    log.info("=" * 60)

    if not check_env():
        sys.exit(1)

    if args.once:
        log.info("--once mode: running single pipeline pass")
        run_pipeline()
        return

    if args.monitor:
        log.info("--monitor mode: running position monitor once")
        run_monitor()
        return

    # Scheduled mode
    scan_time    = os.environ.get("SCAN_TIME",    "09:00")
    monitor_time = os.environ.get("MONITOR_TIME", "08:45")

    schedule.every().day.at(monitor_time).do(run_monitor)
    schedule.every().day.at(scan_time).do(run_pipeline)

    log.info(f"Scheduler active: monitor={monitor_time} | scan={scan_time} (local time)")
    log.info("Press Ctrl+C to stop.")

    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == "__main__":
    main()
