"""
MiroFish HTTP API client — wraps localhost:5001 for the agent loop.

Full pipeline:
  A. upload_seed_and_build_graph()  → graph_id, project_id
  B. run_simulation()               → simulation_id
  C. generate_and_fetch_report()    → markdown report text
"""

import re
import time
import logging
from pathlib import Path

import requests

# Long-term Pinecone memory (non-fatal if unavailable)
try:
    from pinecone_memory import memory as _mem
except Exception:
    _mem = None


def _extract_sim_result(markdown: str) -> tuple[float, str]:
    """
    Heuristically extract (confidence, direction) from a MiroFish markdown report.
    Looks for patterns like 'YES: 67%', 'NO wins at 0.62', 'probability of YES is 71%'.
    Falls back to (0.0, 'UNKNOWN') if nothing found.
    """
    text = markdown[:3000].upper()
    # Pattern: YES/NO followed or preceded by a percentage
    for direction in ("YES", "NO"):
        patterns = [
            rf"{direction}[^0-9]{{0,30}}(\d{{2,3}})\s*%",
            rf"(\d{{2,3}})\s*%[^A-Z]{{0,30}}{direction}",
            rf"PROBABILITY[^0-9]{{0,30}}(\d{{2,3}})\s*%",
        ]
        for pat in patterns:
            m = re.search(pat, text)
            if m:
                confidence = min(float(m.group(1)) / 100, 1.0)
                return confidence, direction
    return 0.0, "UNKNOWN"

log = logging.getLogger("david.mirofish")

DEFAULT_BASE = "http://localhost:5001"
POLL_INTERVAL = 10    # seconds between status polls
POLL_TIMEOUT  = 600   # max seconds to wait per stage (graph-build, sim-prepare)
REPORT_TIMEOUT = 1800  # report generation can take 20-30 min


class MiroFishError(Exception):
    pass


class MiroFishClient:
    def __init__(self, base_url: str = DEFAULT_BASE):
        self.base = base_url.rstrip("/")

    # ------------------------------------------------------------------ #
    #  Internal helpers                                                    #
    # ------------------------------------------------------------------ #

    def _post(self, path: str, json=None, files=None, data=None) -> dict:
        url = f"{self.base}{path}"
        try:
            r = requests.post(url, json=json, files=files, data=data, timeout=30)
            r.raise_for_status()
            return r.json()
        except requests.exceptions.ConnectionError:
            raise MiroFishError(f"MiroFish unreachable at {self.base}. Is Docker running?")
        except requests.exceptions.HTTPError as e:
            raise MiroFishError(f"HTTP {r.status_code} on POST {path}: {r.text[:300]}") from e

    def _get(self, path: str, params=None) -> dict:
        url = f"{self.base}{path}"
        try:
            r = requests.get(url, params=params, timeout=30)
            r.raise_for_status()
            return r.json()
        except requests.exceptions.ConnectionError:
            raise MiroFishError(f"MiroFish unreachable at {self.base}. Is Docker running?")
        except requests.exceptions.HTTPError as e:
            raise MiroFishError(f"HTTP {r.status_code} on GET {path}: {r.text[:300]}") from e

    def _poll(self, check_fn, label: str, timeout: int = POLL_TIMEOUT) -> dict:
        """Poll check_fn() every POLL_INTERVAL seconds until status==completed or timeout."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            result = check_fn()
            status = result.get("data", {}).get("status", "")
            progress = result.get("data", {}).get("progress", 0)
            log.info(f"  [{label}] status={status} progress={progress}%")
            if status == "completed":
                return result["data"]
            if status == "failed":
                raise MiroFishError(f"{label} failed: {result.get('data', {}).get('message', 'unknown')}")
            time.sleep(POLL_INTERVAL)
        raise MiroFishError(f"{label} timed out after {timeout}s")

    def ping(self) -> bool:
        """Return True if MiroFish backend is reachable."""
        try:
            requests.get(f"{self.base}/api/graph/project/ping", timeout=5)
            return True
        except Exception:
            try:
                requests.get(self.base, timeout=5)
                return True
            except Exception:
                return False

    # ------------------------------------------------------------------ #
    #  Step A: Upload seed file + build knowledge graph                   #
    # ------------------------------------------------------------------ #

    def upload_seed_and_build_graph(
        self,
        seed_txt_path: Path,
        simulation_requirement: str,
        project_name: str,
    ) -> tuple[str, str]:
        """
        Upload seed .txt file → generate ontology → build graph.
        Returns (graph_id, project_id).
        """
        log.info(f"[A1] Uploading seed file: {seed_txt_path.name}")
        with open(seed_txt_path, "rb") as f:
            resp = self._post(
                "/api/graph/ontology/generate",
                files={"files": (seed_txt_path.name, f, "text/plain")},
                data={
                    "simulation_requirement": simulation_requirement,
                    "project_name": project_name,
                    "additional_context": "",
                },
            )
        project_id = resp["data"]["project_id"]
        log.info(f"[A1] Ontology generated. project_id={project_id}")

        log.info(f"[A2] Building knowledge graph for project_id={project_id}")
        build_resp = self._post("/api/graph/build", json={"project_id": project_id})
        task_id = build_resp["data"]["task_id"]

        result = self._poll(
            lambda: self._get(f"/api/graph/task/{task_id}"),
            label="graph-build",
        )
        graph_id = result.get("result", {}).get("graph_id") or result.get("graph_id")
        if not graph_id:
            raise MiroFishError(f"graph_id missing from build result: {result}")
        log.info(f"[A2] Graph built. graph_id={graph_id}")
        return graph_id, project_id

    def _poll_prepare(self, task_id: str, simulation_id: str, label: str) -> dict:
        """Poll /api/simulation/prepare/status until status==ready."""
        deadline = time.time() + POLL_TIMEOUT
        while time.time() < deadline:
            result = self._post(
                "/api/simulation/prepare/status",
                json={"task_id": task_id, "simulation_id": simulation_id},
            )
            data = result.get("data", {})
            status = data.get("status", "")
            progress = data.get("progress", 0)
            log.info(f"  [{label}] status={status} progress={progress}%")
            if status in ("ready", "completed") or data.get("already_prepared"):
                return data
            if status == "failed":
                raise MiroFishError(f"{label} failed: {data.get('message', 'unknown')}")
            time.sleep(POLL_INTERVAL)
        raise MiroFishError(f"{label} timed out after {POLL_TIMEOUT}s")

    def _poll_run_status(self, simulation_id: str, label: str, timeout: int = 1200) -> dict:
        """Poll /api/simulation/{sim_id}/run-status until runner_status==completed."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            result = self._get(f"/api/simulation/{simulation_id}/run-status")
            data = result.get("data", {})
            runner_status = data.get("runner_status", "idle")
            current_round = data.get("current_round", 0)
            total_rounds = data.get("total_rounds", 0)
            progress = data.get("progress_percent", 0)
            log.info(f"  [{label}] status={runner_status} round={current_round}/{total_rounds} ({progress:.0f}%)")
            if runner_status == "completed":
                return data
            if runner_status in ("failed", "stopped"):
                raise MiroFishError(f"{label} {runner_status}")
            time.sleep(POLL_INTERVAL)
        raise MiroFishError(f"{label} timed out after {timeout}s")

    # ------------------------------------------------------------------ #
    #  Step B: Run OASIS simulation                                        #
    # ------------------------------------------------------------------ #

    def run_simulation(self, graph_id: str, project_id: str) -> str:
        """
        Create → prepare → start → poll simulation until complete.
        Returns simulation_id.
        """
        # B1: Create simulation record
        log.info(f"[B1] Creating simulation. project_id={project_id}")
        create_resp = self._post(
            "/api/simulation/create",
            json={"project_id": project_id, "graph_id": graph_id},
        )
        simulation_id = create_resp["data"]["simulation_id"]
        log.info(f"[B1] Simulation created. sim_id={simulation_id}")

        # B2: Prepare simulation (LLM generates agent profiles + config)
        log.info(f"[B2] Preparing simulation. sim_id={simulation_id}")
        prep_resp = self._post(
            "/api/simulation/prepare",
            json={"simulation_id": simulation_id},
        )
        prep_data = prep_resp["data"]
        if not prep_data.get("already_prepared"):
            task_id = prep_data.get("task_id")
            self._poll_prepare(task_id, simulation_id, label="sim-prepare")
        log.info(f"[B2] Simulation prepared. sim_id={simulation_id}")

        # B3: Start simulation runner (TESTING MODE: 5 rounds for speed)
        log.info(f"[B3] Starting simulation runner. sim_id={simulation_id}")
        self._post(
            "/api/simulation/start",
            json={"simulation_id": simulation_id, "max_rounds": 5},  # Was 1 (typo), now 5 for faster testing
        )

        # B4: Poll run-status until completed
        try:
            self._poll_run_status(simulation_id, label="simulation-run", timeout=2400)
        except MiroFishError as e:
            # Stop the simulation if we timed out so it doesn't hog resources
            try:
                self._post("/api/simulation/stop", json={"simulation_id": simulation_id})
                log.warning(f"[B4] Stopped timed-out simulation {simulation_id}")
            except Exception:
                pass
            raise
        log.info(f"[B] Simulation complete. sim_id={simulation_id}")
        return simulation_id

    # ------------------------------------------------------------------ #
    #  Step C: Generate report + extract result                           #
    # ------------------------------------------------------------------ #

    def generate_and_fetch_report(self, simulation_id: str) -> tuple[str, str]:
        """
        Trigger report generation, poll until done, return (report_id, markdown).
        """
        log.info(f"[C1] Generating report for sim_id={simulation_id}")
        gen_resp = self._post(
            "/api/report/generate",
            json={"simulation_id": simulation_id, "force_regenerate": False},
        )
        task_id   = gen_resp["data"]["task_id"]
        report_id = gen_resp["data"]["report_id"]

        self._poll(
            lambda: self._post(
                "/api/report/generate/status",
                json={"task_id": task_id, "simulation_id": simulation_id},
            ),
            label="report-gen",
            timeout=REPORT_TIMEOUT,
        )

        log.info(f"[C2] Fetching report. report_id={report_id}")
        report = self._get(f"/api/report/{report_id}")
        markdown = report["data"].get("markdown_content", "")
        log.info(f"[C2] Report fetched. length={len(markdown)} chars")
        return report_id, markdown

    # ------------------------------------------------------------------ #
    #  Full single-run pipeline                                            #
    # ------------------------------------------------------------------ #

    def full_run(
        self,
        seed_txt_path: Path,
        simulation_requirement: str,
        project_name: str,
    ) -> tuple[str, str, str]:
        """
        Convenience: A → B → C.
        Returns (simulation_id, report_id, markdown).
        """
        graph_id, project_id = self.upload_seed_and_build_graph(
            seed_txt_path, simulation_requirement, project_name
        )
        simulation_id = self.run_simulation(graph_id, project_id)
        report_id, markdown = self.generate_and_fetch_report(simulation_id)

        # Store simulation result in Pinecone long-term memory
        try:
            if _mem and markdown:
                confidence, direction = _extract_sim_result(markdown)
                market_slug = re.sub(r"[^a-z0-9]+", "-", project_name.lower())[:50].strip("-")
                _mem.store_simulation(
                    market_slug=market_slug,
                    result_summary=markdown[:600],
                    confidence=confidence,
                    direction=direction,
                    simulation_id=simulation_id,
                )
        except Exception as _exc:
            log.warning(f"[full_run] Pinecone store_simulation failed (non-fatal): {_exc}")

        return simulation_id, report_id, markdown
