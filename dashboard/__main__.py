"""Entrypoint for python3 -m dashboard"""
from dashboard.pipeline_dashboard import _run_demo, load_config
import argparse
from pathlib import Path

BASE = Path(__file__).parent

parser = argparse.ArgumentParser(description="AskElira Pipeline Dashboard")
parser.add_argument(
    "config",
    nargs="?",
    default=str(BASE / "examples" / "trading_pipeline.json"),
    help="Path to pipeline config JSON",
)
parser.add_argument("--demo",   action="store_true", help="Run simulated pipeline")
parser.add_argument("--no-web", action="store_true", help="Terminal only, no browser")
args = parser.parse_args()

if args.demo:
    _run_demo(args.config, web=not args.no_web)
else:
    parser.print_help()
