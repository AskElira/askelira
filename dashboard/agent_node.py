"""
agent_node.py — Agent node data model and Rich terminal renderer.

Each node represents one agent in the pipeline. Status drives color/icon.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional

from rich.align import Align
from rich.panel import Panel
from rich.text import Text

# ------------------------------------------------------------------ #
# Status constants                                                     #
# ------------------------------------------------------------------ #

STATUS_ICONS = {
    "waiting":  "⏸",
    "active":   "⚡",
    "complete": "✓",
    "error":    "✗",
    "skipped":  "—",
}

STATUS_BORDER_COLORS = {
    "waiting":  "dim white",
    "active":   "yellow",
    "complete": "green",
    "error":    "red",
    "skipped":  "grey50",
}

STATUS_TITLE_STYLES = {
    "waiting":  "dim white",
    "active":   "bold yellow",
    "complete": "bold green",
    "error":    "bold red",
    "skipped":  "grey50",
}

# vis.js compatible hex colors (used by web server)
STATUS_WEB_COLORS = {
    "waiting":  "#555566",
    "active":   "#f5a623",
    "complete": "#27ae60",
    "error":    "#e74c3c",
    "skipped":  "#888888",
}


# ------------------------------------------------------------------ #
# AgentNode                                                            #
# ------------------------------------------------------------------ #

@dataclass
class AgentNode:
    """
    Holds all runtime state for a single agent in the pipeline.

    Populated by PipelineDashboard in response to EventBus events.
    """

    name: str
    role: str
    color: str = "cyan"

    status: str = "waiting"       # waiting | active | complete | error | skipped
    progress: int = 0             # 0-100
    status_text: str = ""
    output_data: Dict[str, Any] = field(default_factory=dict)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    cost_usd: float = 0.0
    error: Optional[str] = None

    # ------------------------------------------------------------------ #
    # Derived helpers                                                      #
    # ------------------------------------------------------------------ #

    def duration_str(self) -> str:
        """Return elapsed/final duration as MM:SS."""
        if not self.start_time:
            return "--:--"
        end = self.end_time or datetime.utcnow()
        secs = int((end - self.start_time).total_seconds())
        return f"{secs // 60:02d}:{secs % 60:02d}"

    def web_color(self) -> str:
        """Hex color for vis.js node background."""
        return STATUS_WEB_COLORS.get(self.status, "#555566")

    # ------------------------------------------------------------------ #
    # Rich terminal renderer                                               #
    # ------------------------------------------------------------------ #

    def render(self) -> Panel:
        """Return a Rich Panel visualizing this node's current state."""
        border_color = STATUS_BORDER_COLORS.get(self.status, "dim white")
        title_style = STATUS_TITLE_STYLES.get(self.status, "white")
        icon = STATUS_ICONS.get(self.status, "?")

        content = Text(overflow="fold")

        # Role + icon line
        content.append(f"{icon} {self.role}\n", style=f"bold {border_color}")

        # Progress bar (shown when active and progress > 0)
        if self.status == "active":
            if self.progress > 0:
                bar_width = 10
                filled = max(1, int(bar_width * self.progress / 100))
                bar = "█" * filled + "░" * (bar_width - filled)
                content.append(f"[{bar}]{self.progress:>3}%\n", style=border_color)
            else:
                content.append("◌ starting...\n", style="dim yellow")

        # Status text / output summary
        if self.status_text and self.status == "active":
            truncated = self.status_text[:18]
            content.append(f"{truncated}\n", style="dim")
        elif self.status == "complete" and self.output_data:
            for k, v in list(self.output_data.items())[:2]:
                val_str = str(v)[:12]
                content.append(f"{k}: {val_str}\n", style="dim green")
        elif self.status == "error" and self.error:
            content.append(f"{self.error[:18]}\n", style="dim red")
        else:
            content.append("\n")  # padding

        # Footer: duration + cost
        footer = Text(overflow="fold")
        footer.append(f"⏱ {self.duration_str()}", style="dim")
        if self.cost_usd > 0:
            footer.append(f"  ${self.cost_usd:.4f}", style="dim yellow")
        content.append_text(footer)

        return Panel(
            content,
            title=f"[{title_style}]{self.name}[/]",
            border_style=border_color,
            width=20,
            padding=(0, 1),
        )

    # ------------------------------------------------------------------ #
    # JSON serialization (for web server)                                  #
    # ------------------------------------------------------------------ #

    def to_dict(self) -> dict:
        """Return JSON-serializable dict for the web dashboard."""
        return {
            "name": self.name,
            "role": self.role,
            "color": self.color,
            "status": self.status,
            "progress": self.progress,
            "status_text": self.status_text,
            "output_data": self.output_data,
            "cost_usd": self.cost_usd,
            "duration": self.duration_str(),
            "error": self.error,
            "web_color": self.web_color(),
        }
