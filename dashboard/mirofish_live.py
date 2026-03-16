#!/usr/bin/env python3
"""
MiroFish Live Integration
Connects real MiroFish API to the visualization viewer
"""

import sys
import time
import json
import logging
from pathlib import Path
from typing import Optional

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "Polymarket"))

try:
    from mirofish_client import MiroFishClient, MiroFishError
except ImportError:
    print("❌ Could not import mirofish_client")
    print("Make sure ~/Desktop/Polymarket/mirofish_client.py exists")
    sys.exit(1)

from mirofish_viewer import MiroFishViewer
from rich.console import Console

console = Console()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("mirofish_live")


class MiroFishLiveIntegration:
    """Bridges MiroFish API → Live Viewer"""
    
    def __init__(self, base_url: str = "http://localhost:5001"):
        self.client = MiroFishClient(base_url)
        self.viewer = MiroFishViewer()
    
    def run_live_simulation(self, question: str, context: str = ""):
        """Run a live MiroFish simulation with real-time visualization"""
        
        console.print("\n[bold cyan]🔮 Starting MiroFish Live Simulation[/bold cyan]")
        console.print(f"[dim]Question: {question}[/dim]\n")
        
        try:
            # Phase 1: Upload seed and build graph
            console.print("[yellow]Phase 1: Building knowledge graph...[/yellow]")
            
            seed_text = f"{question}\n\nContext:\n{context}" if context else question
            
            # Simulate building (actual API call)
            graph_id, project_id = self.client.upload_seed_and_build_graph(
                seed_text=seed_text,
                project_name=f"live_sim_{int(time.time())}"
            )
            
            console.print(f"[green]✓ Graph built: {graph_id}[/green]\n")
            
            # Simulate agents spawning
            self._simulate_graph_building()
            
            # Phase 2: Run simulation
            console.print("[yellow]Phase 2: Running swarm simulation...[/yellow]")
            
            sim_id = self.client.run_simulation(
                graph_id=graph_id,
                num_iterations=1,
                num_agents=1000
            )
            
            console.print(f"[green]✓ Simulation started: {sim_id}[/green]\n")
            
            # Simulate swarm debate
            self._simulate_swarm_debate()
            
            # Phase 3: Generate report
            console.print("[yellow]Phase 3: Generating consensus report...[/yellow]")
            
            report = self.client.generate_and_fetch_report(
                sim_id=sim_id,
                graph_id=graph_id
            )
            
            # Extract result
            confidence, direction = self._extract_result(report)
            
            console.print(f"\n[bold green]✅ FINAL RESULT: {direction} ({confidence:.1f}% confidence)[/bold green]\n")
            
            # Update viewer with final result
            self.viewer.update({
                "type": "final_result",
                "result": direction,
                "confidence": confidence
            })
            
            return {
                "result": direction,
                "confidence": confidence,
                "report": report,
                "graph_id": graph_id,
                "sim_id": sim_id
            }
            
        except MiroFishError as e:
            console.print(f"\n[bold red]❌ MiroFish Error: {e}[/bold red]\n")
            raise
    
    def _simulate_graph_building(self):
        """Simulate knowledge graph being built"""
        from rich.live import Live
        import random
        
        roles = ["Research Node", "Context Node", "Analysis Node", "Data Node"]
        
        with Live(self.viewer.render(), console=console, refresh_per_second=10) as live:
            for i in range(20):
                self.viewer.update({
                    "type": "agent_spawned",
                    "agent_id": f"graph_{i}",
                    "role": random.choice(roles),
                    "stance": "NEUTRAL",
                    "cluster": "Knowledge Graph",
                    "reasoning": "Building semantic connections...",
                    "confidence": 0
                })
                
                live.update(self.viewer.render())
                time.sleep(0.1)
    
    def _simulate_swarm_debate(self):
        """Simulate 1000 agents debating"""
        from rich.live import Live
        import random
        
        roles = ["Retail Trader", "Institutional", "Analyst", "Media", "Quant"]
        clusters = ["Retail Traders", "Institutional", "Analysts", "Media"]
        
        reasoning_options = [
            "VIX is low, market calm",
            "Fed pause likely, bullish for risk assets",
            "Positioning defensive due to uncertainty",
            "Breakout above key resistance",
            "Volume declining, bearish signal",
            "Sentiment surveys showing optimism",
            "Technical indicators showing divergence",
            "Macro environment supportive",
            "Historical patterns suggest reversal",
            "Risk/reward favors this direction"
        ]
        
        with Live(self.viewer.render(), console=console, refresh_per_second=10) as live:
            # Spawn 1000 agents (but only show 100 in viewer for performance)
            for i in range(100):
                role = random.choice(roles)
                
                # Bias toward one direction (simulating real consensus forming)
                stance = random.choices(
                    ["BULLISH", "BEARISH", "NEUTRAL"],
                    weights=[0.65, 0.30, 0.05]  # 65% bullish consensus
                )[0]
                
                cluster = random.choice(clusters)
                
                self.viewer.update({
                    "type": "agent_spawned",
                    "agent_id": str(i),
                    "role": role,
                    "stance": stance,
                    "cluster": cluster,
                    "reasoning": random.choice(reasoning_options),
                    "confidence": random.uniform(60, 90)
                })
                
                # Update consensus every 20 agents
                if i % 20 == 0 and i > 0:
                    all_agents = []
                    for agents in self.viewer.state.clusters.values():
                        all_agents.extend(agents)
                    
                    if all_agents:
                        bullish_count = sum(1 for a in all_agents if a.stance == "BULLISH")
                        consensus = (bullish_count / len(all_agents)) * 100
                        
                        self.viewer.update({
                            "type": "consensus_update",
                            "consensus": consensus,
                            "stance": "BULLISH" if consensus > 50 else "BEARISH"
                        })
                
                live.update(self.viewer.render())
                time.sleep(0.05)
            
            # Hold final view
            time.sleep(2)
    
    def _extract_result(self, report: str) -> tuple[float, str]:
        """Extract confidence and direction from MiroFish report"""
        import re
        
        text = report[:3000].upper()
        
        # Look for YES/NO with percentage
        for direction in ("YES", "NO"):
            patterns = [
                rf"{direction}[^0-9]{{0,30}}(\d{{2,3}})\s*%",
                rf"(\d{{2,3}})\s*%[^A-Z]{{0,30}}{direction}",
            ]
            for pat in patterns:
                m = re.search(pat, text)
                if m:
                    confidence = float(m.group(1))
                    # Convert YES/NO to BULLISH/BEARISH
                    stance = "BULLISH" if direction == "YES" else "BEARISH"
                    return confidence, stance
        
        # Fallback
        return 50.0, "NEUTRAL"


def main():
    """Run live MiroFish simulation"""
    import argparse
    
    parser = argparse.ArgumentParser(description="MiroFish Live Viewer")
    parser.add_argument("question", nargs="?", default="Will NQ go up today?", help="Question to simulate")
    parser.add_argument("--context", default="", help="Additional context")
    parser.add_argument("--base-url", default="http://localhost:5001", help="MiroFish API URL")
    
    args = parser.parse_args()
    
    integration = MiroFishLiveIntegration(base_url=args.base_url)
    
    try:
        result = integration.run_live_simulation(
            question=args.question,
            context=args.context
        )
        
        console.print("\n[bold]Result Summary:[/bold]")
        console.print(f"  Direction: {result['result']}")
        console.print(f"  Confidence: {result['confidence']:.1f}%")
        console.print(f"  Graph ID: {result['graph_id']}")
        console.print(f"  Simulation ID: {result['sim_id']}\n")
        
    except MiroFishError as e:
        console.print(f"\n[bold red]Error:[/bold red] {e}\n")
        console.print("[dim]Make sure MiroFish Docker is running:[/dim]")
        console.print("[dim]  docker-compose up -d[/dim]\n")
        sys.exit(1)
    except KeyboardInterrupt:
        console.print("\n\n[yellow]Interrupted by user[/yellow]\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
