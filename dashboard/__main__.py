"""Entrypoint for python3 -m dashboard"""
from dashboard.pipeline_dashboard import _run_demo, load_config
from dashboard.mirofish_viewer import MiroFishViewer
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
parser.add_argument("--demo",       action="store_true", help="Run simulated pipeline")
parser.add_argument("--mirofish",   action="store_true", help="Launch MiroFish demo viewer")
parser.add_argument("--live",       action="store_true", help="Run LIVE MiroFish (requires Docker)")
parser.add_argument("--question",   default="Will NQ go up today?", help="Question for live MiroFish")
parser.add_argument("--no-web",     action="store_true", help="Terminal only, no browser")
args = parser.parse_args()

if args.mirofish:
    if args.live:
        # Live MiroFish with real API
        from dashboard.mirofish_live import MiroFishLiveIntegration
        integration = MiroFishLiveIntegration()
        integration.run_live_simulation(question=args.question)
    else:
        # Demo mode (no API needed)
        viewer = MiroFishViewer()
        viewer.run_demo()
elif args.demo:
    _run_demo(args.config, web=not args.no_web)
else:
    parser.print_help()
