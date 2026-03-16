"""
event_bus.py — Thread-safe pub/sub event system for the AskElira pipeline dashboard.

All dashboard components (terminal UI, web server) subscribe here.
Agents only call emit() — they never need to know who's listening.

Events:
    pipeline_start    {pipeline_name, agent_count}
    agent_start       {agent, task}
    agent_progress    {agent, progress: 0-100, status_text}
    agent_complete    {agent, data: dict, duration_seconds, cost_usd}
    agent_error       {agent, error: str}
    pipeline_complete {approved: bool, total_cost, total_time}
    mirofish_update   {phase, current_round, total_rounds, progress_percent, runner_status}
"""

import asyncio
import threading
import time
from collections import defaultdict
from typing import Callable, Any, Dict, List, Optional, Tuple


class EventBus:
    """
    Thread-safe publish/subscribe event bus.

    Supports both synchronous callbacks (for terminal UI) and
    async queues (for WebSocket server). Multiple consumers can
    subscribe independently.
    """

    def __init__(self):
        # event_name -> list of sync callbacks
        self._callbacks: Dict[str, List[Callable]] = defaultdict(list)
        self._lock = threading.Lock()

        # List of (loop, asyncio.Queue) for async consumers (web server)
        self._async_queues: List[Tuple[asyncio.AbstractEventLoop, asyncio.Queue]] = []
        self._queues_lock = threading.Lock()

    # ------------------------------------------------------------------ #
    # Sync API                                                             #
    # ------------------------------------------------------------------ #

    def on(self, event_name: str, callback: Callable) -> None:
        """Register a synchronous callback for an event (or "*" for all events)."""
        with self._lock:
            self._callbacks[event_name].append(callback)

    def off(self, event_name: str, callback: Callable) -> None:
        """Unregister a synchronous callback."""
        with self._lock:
            self._callbacks[event_name] = [
                cb for cb in self._callbacks[event_name] if cb is not callback
            ]

    def emit(self, event_name: str, data: Optional[Dict] = None) -> None:
        """
        Emit an event. Calls all registered sync callbacks immediately,
        then queues the event for all async consumers.

        Thread-safe: can be called from any thread.
        """
        data = data or {}

        # Collect callbacks under lock, call them outside to avoid deadlock
        with self._lock:
            callbacks = list(self._callbacks.get(event_name, []))
            wildcards = list(self._callbacks.get("*", []))

        for cb in callbacks + wildcards:
            try:
                cb(event_name, data)
            except Exception:
                pass  # never let a bad callback break the pipeline

        # Push to async queues (for web server WebSockets)
        payload = {
            "event": event_name,
            "data": data,
            "ts": int(time.time() * 1000),
        }
        with self._queues_lock:
            dead = []
            for loop, queue in self._async_queues:
                try:
                    loop.call_soon_threadsafe(queue.put_nowait, payload)
                except RuntimeError:
                    dead.append((loop, queue))
            for item in dead:
                self._async_queues.remove(item)

    # ------------------------------------------------------------------ #
    # Async API (for web server)                                           #
    # ------------------------------------------------------------------ #

    def subscribe_async(self, loop: asyncio.AbstractEventLoop) -> asyncio.Queue:
        """
        Register an async consumer. Returns an asyncio.Queue that will
        receive all future events as {event, data, ts} dicts.

        The loop must be the event loop of the async consumer's thread.
        """
        queue: asyncio.Queue = asyncio.Queue()
        with self._queues_lock:
            self._async_queues.append((loop, queue))
        return queue

    def unsubscribe_async(
        self, loop: asyncio.AbstractEventLoop, queue: asyncio.Queue
    ) -> None:
        """Deregister an async consumer (call when WebSocket disconnects)."""
        with self._queues_lock:
            self._async_queues = [
                (l, q) for l, q in self._async_queues if q is not queue
            ]
