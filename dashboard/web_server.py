"""
web_server.py — FastAPI + WebSocket server for the browser dashboard.

Serves static/index.html at GET /
Streams all EventBus events to connected WebSocket clients at WS /ws
Provides current pipeline state snapshot at GET /api/state

Runs in a daemon thread via uvicorn so it doesn't block the main pipeline.
"""

import asyncio
import json
import threading
import time
from pathlib import Path
from typing import List, Optional

STATIC_DIR = Path(__file__).parent / "static"


class DashboardWebServer:
    """
    Wraps a FastAPI app in a daemon uvicorn thread.

    The web server subscribes to the shared EventBus using async queues,
    one per connected WebSocket client. Events from the main thread are
    forwarded to all active WebSocket connections.
    """

    def __init__(self, bus, nodes, metrics, mirofish_state_ref: dict, port: int = 8888):
        self.bus = bus
        self.nodes = nodes
        self.metrics = metrics
        self.mirofish_state_ref = mirofish_state_ref
        self.port = port

        self._thread: Optional[threading.Thread] = None
        self._server = None
        self._app = self._build_app()

    def _build_app(self):
        from fastapi import FastAPI, WebSocket, WebSocketDisconnect
        from fastapi.responses import HTMLResponse, JSONResponse

        app = FastAPI(title="AskElira Pipeline Dashboard", docs_url=None)

        # ── Static HTML ─────────────────────────────────────────────── #
        @app.get("/", response_class=HTMLResponse)
        async def index():
            html_path = STATIC_DIR / "index.html"
            if html_path.exists():
                return HTMLResponse(html_path.read_text(encoding="utf-8"))
            return HTMLResponse("<h1>Dashboard UI not found</h1>", status_code=404)

        # ── State snapshot ───────────────────────────────────────────── #
        @app.get("/api/state")
        async def state():
            return JSONResponse({
                "pipeline_name": self.metrics.to_dict(),
                "nodes": [n.to_dict() for n in self.nodes],
                "metrics": self.metrics.to_dict(),
                "mirofish": self.mirofish_state_ref,
            })

        # ── WebSocket ─────────────────────────────────────────────────  #
        @app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            await websocket.accept()

            loop = asyncio.get_event_loop()
            queue = self.bus.subscribe_async(loop)

            # Push full current state immediately on connect
            try:
                await websocket.send_json({
                    "event": "init",
                    "data": {
                        "nodes": [n.to_dict() for n in self.nodes],
                        "metrics": self.metrics.to_dict(),
                        "mirofish": self.mirofish_state_ref,
                    },
                    "ts": int(time.time() * 1000),
                })
            except Exception:
                self.bus.unsubscribe_async(loop, queue)
                return

            # Forward events until disconnect
            try:
                while True:
                    msg = await queue.get()
                    await websocket.send_json(msg)
            except WebSocketDisconnect:
                pass
            except Exception:
                pass
            finally:
                self.bus.unsubscribe_async(loop, queue)

        return app

    def start(self) -> None:
        """Start uvicorn in a daemon thread."""
        import uvicorn

        config = uvicorn.Config(
            self._app,
            host="0.0.0.0",
            port=self.port,
            log_level="error",
            access_log=False,
        )
        self._server = uvicorn.Server(config)
        self._thread = threading.Thread(
            target=self._server.run, daemon=True, name="dash-web"
        )
        self._thread.start()

    def stop(self) -> None:
        """Signal uvicorn to exit."""
        if self._server:
            self._server.should_exit = True
        if self._thread:
            self._thread.join(timeout=3)
