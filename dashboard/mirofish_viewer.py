#!/usr/bin/env python3
"""
MiroFish Live Visualization
Real-time swarm debate viewer with node network
"""

import json
import time
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
from rich.console import Console
from rich.live import Live
from rich.layout import Layout
from rich.panel import Panel
from rich.progress import Progress, BarColumn, TextColumn
from rich.table import Table
from rich.tree import Tree
from rich.text import Text

console = Console()


@dataclass
class Agent:
    """Individual agent in the swarm"""
    id: str
    role: str
    stance: str  # YES, NO, NEUTRAL (domain-agnostic)
    confidence: float
    reasoning: str
    timestamp: float


@dataclass
class SwarmState:
    """Current state of the swarm simulation"""
    total_agents: int
    spawned_agents: int
    clusters: Dict[str, List[Agent]]
    consensus: float
    dominant_stance: str
    debate_log: List[str]
    start_time: float
    

class MiroFishViewer:
    """Live visualization for MiroFish swarm simulations"""
    
    def __init__(self):
        self.state = SwarmState(
            total_agents=1000,
            spawned_agents=0,
            clusters={},
            consensus=0.0,
            dominant_stance="NEUTRAL",
            debate_log=[],
            start_time=time.time()
        )
        self.layout = self._create_layout()
    
    def _create_layout(self) -> Layout:
        """Create the dashboard layout"""
        layout = Layout()
        
        # Split into header and body
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="body")
        )
        
        # Split body into left (network) and right (debate)
        layout["body"].split_row(
            Layout(name="network", ratio=2),
            Layout(name="sidebar")
        )
        
        # Split sidebar into metrics and log
        layout["sidebar"].split_column(
            Layout(name="metrics", size=12),
            Layout(name="debate")
        )
        
        return layout
    
    def _render_header(self) -> Panel:
        """Render header with title and status"""
        elapsed = time.time() - self.state.start_time
        
        header_text = Text()
        header_text.append("🔮 MiroFish Live Swarm Visualization", style="bold cyan")
        header_text.append(f"  |  Agents: {self.state.spawned_agents}/{self.state.total_agents}", style="bold")
        header_text.append(f"  |  Consensus: {self.state.consensus:.1f}%", style="bold green")
        header_text.append(f"  |  Elapsed: {elapsed:.1f}s", style="dim")
        
        return Panel(header_text, style="cyan")
    
    def _render_network(self) -> Panel:
        """Render agent network tree"""
        tree = Tree("🧠 [bold cyan]Agent Network[/bold cyan]")
        
        # Show clusters
        for cluster_name, agents in self.state.clusters.items():
            if not agents:
                continue
            
            # Calculate cluster consensus
            yes_votes = sum(1 for a in agents if a.stance == "YES")
            no_votes = sum(1 for a in agents if a.stance == "NO")
            total = len(agents)
            
            if total == 0:
                continue
                
            cluster_pct = (yes_votes / total) * 100 if total > 0 else 0
            
            # Color based on stance
            if cluster_pct > 60:
                color = "green"
                emoji = "🟢"
            elif cluster_pct < 40:
                color = "red"
                emoji = "🔴"
            else:
                color = "yellow"
                emoji = "🟡"
            
            cluster_branch = tree.add(
                f"{emoji} [{color}]{cluster_name}[/{color}] ({total} agents, {cluster_pct:.0f}% YES)"
            )
            
            # Show sample agents (max 3)
            for agent in agents[:3]:
                stance_color = "green" if agent.stance == "YES" else "red" if agent.stance == "NO" else "yellow"
                cluster_branch.add(
                    f"[{stance_color}]{agent.role} #{agent.id}[/{stance_color}]: {agent.reasoning[:50]}..."
                )
        
        return Panel(tree, title="[bold]Node Network[/bold]", border_style="cyan")
    
    def _render_metrics(self) -> Panel:
        """Render consensus metrics"""
        table = Table.grid(padding=(0, 2))
        
        # Consensus bar
        consensus_bar = "█" * int(self.state.consensus / 5) + "░" * (20 - int(self.state.consensus / 5))
        
        table.add_row("[bold]Consensus:[/bold]", f"{consensus_bar} {self.state.consensus:.1f}%")
        table.add_row("[bold]Stance:[/bold]", f"[{'green' if self.state.dominant_stance == 'BULLISH' else 'red'}]{self.state.dominant_stance}[/]")
        table.add_row("[bold]Agents:[/bold]", f"{self.state.spawned_agents}/{self.state.total_agents}")
        
        # Show cluster breakdown
        table.add_row("", "")
        table.add_row("[bold]Clusters:[/bold]", "")
        
        for cluster_name, agents in self.state.clusters.items():
            if agents:
                pct = (len(agents) / self.state.total_agents) * 100 if self.state.total_agents > 0 else 0
                table.add_row(f"  {cluster_name}:", f"{len(agents)} ({pct:.0f}%)")
        
        return Panel(table, title="[bold]Metrics[/bold]", border_style="green")
    
    def _render_debate_log(self) -> Panel:
        """Render scrolling debate log"""
        # Show last 10 messages
        recent_log = self.state.debate_log[-10:]
        
        log_text = Text()
        for msg in recent_log:
            log_text.append(msg + "\n", style="dim")
        
        return Panel(log_text, title="[bold]Live Debate Feed[/bold]", border_style="yellow")
    
    def update(self, event: Dict):
        """Update state based on incoming event"""
        event_type = event.get("type")
        
        if event_type == "agent_spawned":
            agent = Agent(
                id=event["agent_id"],
                role=event["role"],
                stance=event.get("stance", "NEUTRAL"),
                confidence=event.get("confidence", 0.0),
                reasoning=event.get("reasoning", ""),
                timestamp=time.time()
            )
            
            # Add to cluster
            cluster_name = event.get("cluster", "General")
            if cluster_name not in self.state.clusters:
                self.state.clusters[cluster_name] = []
            
            self.state.clusters[cluster_name].append(agent)
            self.state.spawned_agents += 1
            
            # Add to debate log
            stance_emoji = "🟢" if agent.stance == "YES" else "🔴" if agent.stance == "NO" else "🟡"
            self.state.debate_log.append(
                f"{stance_emoji} {agent.role} #{agent.id}: {agent.reasoning[:60]}..."
            )
        
        elif event_type == "consensus_update":
            self.state.consensus = event["consensus"]
            self.state.dominant_stance = event["stance"]
            
            self.state.debate_log.append(
                f"📊 Consensus updated: {self.state.consensus:.1f}% {self.state.dominant_stance}"
            )
        
        elif event_type == "cluster_formed":
            cluster_name = event["cluster_name"]
            self.state.debate_log.append(
                f"🔵 New cluster formed: {cluster_name}"
            )
        
        elif event_type == "final_result":
            self.state.consensus = event["confidence"]
            self.state.dominant_stance = event["result"]
            
            self.state.debate_log.append(
                f"✅ FINAL RESULT: {self.state.dominant_stance} ({self.state.consensus:.1f}% confidence)"
            )
    
    def render(self) -> Layout:
        """Render the current state"""
        self.layout["header"].update(self._render_header())
        self.layout["network"].update(self._render_network())
        self.layout["metrics"].update(self._render_metrics())
        self.layout["debate"].update(self._render_debate_log())
        
        return self.layout
    
    def run_demo(self, question: str = "Sample question"):
        """Run a demo simulation"""
        import random
        
        # Generic roles (not trading-specific)
        roles = ["Expert", "Researcher", "Analyst", "Reviewer", "Specialist"]
        clusters = ["Experts", "Researchers", "Analysts", "Reviewers"]
        
        with Live(self.render(), console=console, refresh_per_second=10) as live:
            # Spawn agents gradually
            for i in range(100):  # Demo with 100 agents
                # Spawn agent
                role = random.choice(roles)
                stance = random.choices(
                    ["YES", "NO", "NEUTRAL"],
                    weights=[0.6, 0.3, 0.1]
                )[0]
                
                cluster = random.choice(clusters)
                
                # Generic reasoning (works for any domain)
                reasoning_options = [
                    "Data supports this direction",
                    "Historical patterns suggest YES",
                    "Analysis shows conflicting signals",
                    "Strong evidence in favor",
                    "Trend indicates reversal possible",
                    "Metrics align with this outcome"
                ]
                
                self.update({
                    "type": "agent_spawned",
                    "agent_id": str(i),
                    "role": role,
                    "stance": stance,
                    "cluster": cluster,
                    "reasoning": random.choice(reasoning_options),
                    "confidence": random.uniform(60, 90)
                })
                
                # Update consensus periodically
                if i % 20 == 0:
                    # Calculate current consensus
                    all_agents = []
                    for agents in self.state.clusters.values():
                        all_agents.extend(agents)
                    
                    if all_agents:
                        yes_count = sum(1 for a in all_agents if a.stance == "YES")
                        consensus = (yes_count / len(all_agents)) * 100
                        
                        self.update({
                            "type": "consensus_update",
                            "consensus": consensus,
                            "stance": "YES" if consensus > 50 else "NO"
                        })
                
                live.update(self.render())
                time.sleep(0.05)  # 50ms per agent
            
            # Final result
            all_agents = []
            for agents in self.state.clusters.values():
                all_agents.extend(agents)
            
            yes_count = sum(1 for a in all_agents if a.stance == "YES")
            final_consensus = (yes_count / len(all_agents)) * 100 if all_agents else 0
            
            self.update({
                "type": "final_result",
                "result": "YES" if final_consensus > 50 else "NO",
                "confidence": final_consensus
            })
            
            live.update(self.render())
            
            # Hold final view for 5 seconds
            time.sleep(5)


def main():
    """Run MiroFish viewer demo"""
    viewer = MiroFishViewer()
    
    console.print("\n[bold cyan]🔮 MiroFish Live Swarm Visualization[/bold cyan]")
    console.print("[dim]Starting demo simulation...[/dim]\n")
    
    time.sleep(2)
    
    viewer.run_demo()
    
    console.print("\n[bold green]✅ Demo complete![/bold green]")
    console.print("[dim]This visualization shows how MiroFish agents debate in real-time.[/dim]\n")


if __name__ == "__main__":
    main()
