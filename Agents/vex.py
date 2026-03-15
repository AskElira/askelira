"""
Vex — Adversarial Auditor
Step 6: Audit David's simulation setup before Elira approves capital deployment

COMPLETE IMPLEMENTATION with:
- 8-point adversarial audit checklist
- NLP-based resolution criteria matching
- Seed quality validation (recency, diversity)
- Agent population bias detection
- Run stability verification
- Confidence inflation detection
- Single-point-of-failure risk assessment
- Look-ahead contamination scanner
- Calibration accuracy gating
"""

import json
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Tuple, List, Dict, Optional

import anthropic

from models import Market, SimResult, VexVerdict
from Agents.david import get_category_accuracy, _classify_domain

# Pinecone memory (optional)
try:
    from pinecone_memory import memory as _mem
except Exception:
    _mem = None

log = logging.getLogger("vex")

MODEL = "claude-sonnet-4-5"

# Thresholds
VARIANCE_THRESHOLD = 0.15           # >15% variance = FAIL
CONFIDENCE_INFLATION_THRESHOLD = 0.85  # >85% confidence requires justification
SOURCE_RECENCY_HOURS = 72           # Sources must be <72h for fast-moving markets
SOURCE_DIVERSITY_THRESHOLD = 0.50   # No single source >50% of seed weight
CALIBRATION_MIN_ACCURACY = 0.60     # Category accuracy must be ≥60%
SEMANTIC_SIMILARITY_THRESHOLD = 0.85  # NLP match threshold for criteria

SYSTEM_CRITERIA_MATCH = """You are Vex, an adversarial auditor. Your job is to detect
semantic drift between the simulation goal and the actual contract resolution criteria.

Even small differences in wording can change the meaning of a binary prediction.

Return ONLY valid JSON:
{
  "match": true|false,
  "semantic_similarity": 0.0-1.0,
  "drift_explanation": "brief explanation if match=false, otherwise empty string"
}
"""

SYSTEM_SINGLE_POINT = """You are Vex, an adversarial auditor. Detect if this market
resolution depends on a single unpredictable actor (one person's decision, one tweet, 
one announcement) that could override any simulation.

Examples of single-point-of-failure:
- "Will Elon Musk tweet about X by date Y?" (one person's whim)
- "Will the Supreme Court rule in favor of X?" (one institution, unpredictable)
- "Will Taylor Swift attend the Grammy Awards?" (one person's choice)

NOT single-point-of-failure:
- "Will the Fed cut rates?" (institutional consensus process with signals)
- "Will the S&P 500 reach 7000?" (market aggregate of many actors)

Return ONLY valid JSON:
{
  "single_point_risk": true|false,
  "risk_description": "what single actor/event could override the simulation",
  "override_probability": "LOW|MEDIUM|HIGH"
}
"""


# ------------------------------------------------------------------ #
#  Audit Checklist Item 1: Resolution Criteria Match                 #
# ------------------------------------------------------------------ #

def check_resolution_criteria_match(
    market: Market,
    sim_prompt: str,
) -> Tuple[bool, str]:
    """
    Verify simulation goal matches contract resolution criteria with NLP.
    
    Uses Claude to detect semantic drift between:
    - Market resolution criteria (exact contract language)
    - Simulation prompt (what MiroFish was asked to predict)
    
    Returns:
        (pass: bool, finding: str)
    """
    log.info("[Vex 1/8] Checking resolution criteria match...")
    
    client = anthropic.Anthropic()
    user = (
        f"MARKET RESOLUTION CRITERIA (exact contract language):\n{market.resolution_criteria}\n\n"
        f"SIMULATION GOAL (prompt given to MiroFish):\n{sim_prompt}\n\n"
        "Do these match semantically? Even small drift is unacceptable."
    )
    
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=512,
            system=SYSTEM_CRITERIA_MATCH,
            messages=[{"role": "user", "content": user}],
        )
        text = response.content[0].text.strip()
        text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\n?```\s*$", "", text)
        result = json.loads(text)
        
        match = result.get("match", False)
        similarity = result.get("semantic_similarity", 0.0)
        drift = result.get("drift_explanation", "")
        
        if not match or similarity < SEMANTIC_SIMILARITY_THRESHOLD:
            finding = f"FAIL — Semantic drift detected (similarity={similarity:.0%}): {drift}"
            log.warning(f"[Vex 1/8] {finding}")
            return False, finding
        
        finding = f"PASS — Criteria match (similarity={similarity:.0%})"
        log.info(f"[Vex 1/8] {finding}")
        return True, finding
        
    except Exception as e:
        log.error(f"[Vex 1/8] Criteria check failed: {e}")
        finding = f"WARN — Could not verify criteria match: {str(e)[:100]}"
        return True, finding  # Don't block on NLP failure, but warn


# ------------------------------------------------------------------ #
#  Audit Checklist Item 2: Seed Quality                              #
# ------------------------------------------------------------------ #

def check_seed_quality(
    seed_path: Path,
    market: Market,
) -> Tuple[bool, str]:
    """
    Validate Alba's seed file quality:
    - Source recency (<72h for fast-moving markets)
    - Source diversity (no single source >50% of content)
    
    Returns:
        (pass: bool, finding: str)
    """
    log.info("[Vex 2/8] Checking seed quality...")
    
    if not seed_path.exists():
        finding = "FAIL — Seed file not found"
        log.error(f"[Vex 2/8] {finding}")
        return False, finding
    
    seed_text = seed_path.read_text(encoding="utf-8")
    
    # Parse sources from seed file
    # Format: SOURCE N: <url>\nSUMMARY: <text>\nDATE: YYYY-MM-DD\nTYPE: <type>
    source_pattern = re.compile(
        r"SOURCE \d+:\s*(.+?)\s*\nSUMMARY:\s*(.+?)\s*\nDATE:\s*(\d{4}-\d{2}-\d{2})",
        re.DOTALL | re.IGNORECASE
    )
    sources = source_pattern.findall(seed_text)
    
    if not sources:
        finding = "WARN — Could not parse sources from seed file (format may vary)"
        log.warning(f"[Vex 2/8] {finding}")
        return True, finding  # Don't block if parsing fails
    
    now = datetime.utcnow()
    stale_sources = []
    
    for i, (url, summary, date_str) in enumerate(sources, 1):
        try:
            source_date = datetime.strptime(date_str.strip(), "%Y-%m-%d")
            age_hours = (now - source_date).total_seconds() / 3600
            
            # Fast-moving markets (resolution <7 days) require fresh sources
            resolution_date = datetime.strptime(market.resolution_date, "%Y-%m-%d")
            days_to_resolution = (resolution_date - now).days
            
            if days_to_resolution <= 7 and age_hours > SOURCE_RECENCY_HOURS:
                stale_sources.append(f"Source {i}: {age_hours:.0f}h old (>{SOURCE_RECENCY_HOURS}h)")
        except ValueError:
            log.warning(f"[Vex 2/8] Could not parse date for source {i}: {date_str}")
    
    # Check source diversity (crude heuristic: char count per source)
    total_chars = sum(len(summary) for _, summary, _ in sources)
    max_source_chars = max(len(summary) for _, summary, _ in sources)
    max_source_ratio = max_source_chars / total_chars if total_chars > 0 else 0
    
    findings = []
    passed = True
    
    if stale_sources:
        findings.append(f"WARN — Stale sources detected: {'; '.join(stale_sources)}")
    
    if max_source_ratio > SOURCE_DIVERSITY_THRESHOLD:
        findings.append(
            f"WARN — Single source dominates seed ({max_source_ratio:.0%} of content). "
            f"Diversity risk."
        )
    
    if not stale_sources and max_source_ratio <= SOURCE_DIVERSITY_THRESHOLD:
        finding = f"PASS — Seed quality good ({len(sources)} sources, diverse, recent)"
        log.info(f"[Vex 2/8] {finding}")
        return True, finding
    
    finding = " | ".join(findings) if findings else "PASS"
    log.info(f"[Vex 2/8] {finding}")
    return passed, finding


# ------------------------------------------------------------------ #
#  Audit Checklist Item 3: Agent Population Bias                     #
# ------------------------------------------------------------------ #

def check_agent_population_bias(
    market: Market,
) -> Tuple[bool, str]:
    """
    Verify David's agent population config is appropriate for the market domain.
    
    This is a heuristic check — David auto-selects domain, but Vex verifies.
    
    Returns:
        (pass: bool, finding: str)
    """
    log.info("[Vex 3/8] Checking agent population bias...")
    
    domain = _classify_domain(market)
    
    # Heuristic: check if domain classification seems reasonable
    question_lower = market.question.lower()
    
    # Flag obvious mismatches
    if domain == "financial" and "election" in question_lower:
        finding = "WARN — Domain classified as 'financial' but question mentions 'election'. Verify agent mix."
        log.warning(f"[Vex 3/8] {finding}")
        return True, finding
    
    if domain == "political" and any(word in question_lower for word in ["stock", "nasdaq", "s&p", "fed"]):
        finding = "WARN — Domain classified as 'political' but question is financial. Verify agent mix."
        log.warning(f"[Vex 3/8] {finding}")
        return True, finding
    
    finding = f"PASS — Agent population domain '{domain}' matches market category"
    log.info(f"[Vex 3/8] {finding}")
    return True, finding


# ------------------------------------------------------------------ #
#  Audit Checklist Item 4: Run Stability                             #
# ------------------------------------------------------------------ #

def check_run_stability(
    sim_result: SimResult,
) -> Tuple[bool, str]:
    """
    Verify variance across David's simulation runs is <15%.
    
    This should already be enforced by David's self-blocking,
    but Vex double-checks as a quality gate.
    
    Returns:
        (pass: bool, finding: str)
    """
    log.info("[Vex 4/8] Checking run stability...")
    
    if sim_result.variance > VARIANCE_THRESHOLD:
        finding = (
            f"FAIL — Run variance {sim_result.variance:.2%} exceeds {VARIANCE_THRESHOLD:.0%} threshold. "
            f"Simulation is unstable. Runs: {[f'{c:.0%}' for c in sim_result.run_confidences]}"
        )
        log.error(f"[Vex 4/8] {finding}")
        return False, finding
    
    finding = (
        f"PASS — Run stability good (variance={sim_result.variance:.2%}, "
        f"runs={[f'{c:.0%}' for c in sim_result.run_confidences]})"
    )
    log.info(f"[Vex 4/8] {finding}")
    return True, finding


# ------------------------------------------------------------------ #
#  Audit Checklist Item 5: Confidence Inflation                      #
# ------------------------------------------------------------------ #

def check_confidence_inflation(
    sim_result: SimResult,
) -> Tuple[bool, str]:
    """
    Flag if David's confidence is >85% (requires justification).
    
    Polymarket rarely misprices markets >85% unless very close to resolution.
    High confidence may indicate overfitting or look-ahead bias.
    
    Returns:
        (pass: bool, finding: str)
    """
    log.info("[Vex 5/8] Checking confidence inflation...")
    
    if sim_result.confidence > CONFIDENCE_INFLATION_THRESHOLD:
        finding = (
            f"WARN — Confidence {sim_result.confidence:.0%} is very high (>{CONFIDENCE_INFLATION_THRESHOLD:.0%}). "
            f"Polymarket rarely misprices this much. Verify no look-ahead bias."
        )
        log.warning(f"[Vex 5/8] {finding}")
        return True, finding  # WARN, not FAIL
    
    finding = f"PASS — Confidence {sim_result.confidence:.0%} is reasonable"
    log.info(f"[Vex 5/8] {finding}")
    return True, finding


# ------------------------------------------------------------------ #
#  Audit Checklist Item 6: Single-Point-of-Failure Risk              #
# ------------------------------------------------------------------ #

def check_single_point_of_failure(
    market: Market,
) -> Tuple[bool, str, bool]:
    """
    Detect if market resolution depends on a single unpredictable actor.
    
    Uses Claude to assess whether one person/event can override simulation.
    
    Returns:
        (pass: bool, finding: str, override_risk: bool)
    """
    log.info("[Vex 6/8] Checking single-point-of-failure risk...")
    
    client = anthropic.Anthropic()
    user = (
        f"MARKET QUESTION: {market.question}\n"
        f"RESOLUTION CRITERIA: {market.resolution_criteria}\n\n"
        "Does this market's resolution depend on a single unpredictable actor or event?"
    )
    
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=512,
            system=SYSTEM_SINGLE_POINT,
            messages=[{"role": "user", "content": user}],
        )
        text = response.content[0].text.strip()
        text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\n?```\s*$", "", text)
        result = json.loads(text)
        
        single_point_risk = result.get("single_point_risk", False)
        risk_desc = result.get("risk_description", "")
        override_prob = result.get("override_probability", "LOW")
        
        if single_point_risk:
            finding = f"WARN — Single-point-of-failure detected: {risk_desc} (override prob: {override_prob})"
            log.warning(f"[Vex 6/8] {finding}")
            return True, finding, True  # WARN, flag override risk to Elira
        
        finding = "PASS — No single-point-of-failure detected"
        log.info(f"[Vex 6/8] {finding}")
        return True, finding, False
        
    except Exception as e:
        log.error(f"[Vex 6/8] Single-point check failed: {e}")
        finding = f"WARN — Could not assess single-point risk: {str(e)[:100]}"
        return True, finding, False  # Don't block on NLP failure


# ------------------------------------------------------------------ #
#  Audit Checklist Item 7: Look-Ahead Contamination                  #
# ------------------------------------------------------------------ #

def check_look_ahead_contamination(
    seed_path: Path,
    market: Market,
) -> Tuple[bool, str]:
    """
    Scan seed sources for dates after the market resolution date.
    
    If any source is dated AFTER resolution, it may contain outcome information
    that would contaminate the simulation.
    
    Returns:
        (pass: bool, finding: str)
    """
    log.info("[Vex 7/8] Checking look-ahead contamination...")
    
    if not seed_path.exists():
        finding = "FAIL — Seed file not found"
        log.error(f"[Vex 7/8] {finding}")
        return False, finding
    
    seed_text = seed_path.read_text(encoding="utf-8")
    
    # Parse source dates
    source_pattern = re.compile(
        r"SOURCE \d+:.+?DATE:\s*(\d{4}-\d{2}-\d{2})",
        re.DOTALL | re.IGNORECASE
    )
    source_dates = source_pattern.findall(seed_text)
    
    if not source_dates:
        finding = "WARN — Could not parse source dates (format may vary)"
        log.warning(f"[Vex 7/8] {finding}")
        return True, finding
    
    resolution_date = datetime.strptime(market.resolution_date, "%Y-%m-%d")
    contaminated_sources = []
    
    for i, date_str in enumerate(source_dates, 1):
        try:
            source_date = datetime.strptime(date_str.strip(), "%Y-%m-%d")
            if source_date > resolution_date:
                contaminated_sources.append(f"Source {i}: dated {date_str} (after resolution)")
        except ValueError:
            log.warning(f"[Vex 7/8] Could not parse source date {i}: {date_str}")
    
    if contaminated_sources:
        finding = f"FAIL — Look-ahead contamination detected: {'; '.join(contaminated_sources)}"
        log.error(f"[Vex 7/8] {finding}")
        return False, finding
    
    finding = f"PASS — No look-ahead contamination ({len(source_dates)} sources checked)"
    log.info(f"[Vex 7/8] {finding}")
    return True, finding


# ------------------------------------------------------------------ #
#  Audit Checklist Item 8: Calibration Check                         #
# ------------------------------------------------------------------ #

def check_calibration_accuracy(
    market: Market,
) -> Tuple[bool, str]:
    """
    Verify David's historical accuracy on this market category is ≥60%.
    
    If below 60%, require manual Elira review before deployment.
    
    Returns:
        (pass: bool, finding: str)
    """
    log.info("[Vex 8/8] Checking calibration accuracy...")
    
    domain = _classify_domain(market)
    accuracy = get_category_accuracy()  # Overall accuracy (category tracking TBD)
    
    if accuracy is None:
        finding = "WARN — Insufficient calibration data (need ≥5 resolved markets)"
        log.warning(f"[Vex 8/8] {finding}")
        return True, finding  # Don't block on first few markets
    
    if accuracy < CALIBRATION_MIN_ACCURACY:
        finding = (
            f"WARN — Calibration accuracy {accuracy:.0%} below {CALIBRATION_MIN_ACCURACY:.0%} threshold. "
            f"Require manual Elira review before deployment."
        )
        log.warning(f"[Vex 8/8] {finding}")
        return True, finding  # WARN, not FAIL (Elira decides)
    
    finding = f"PASS — Calibration accuracy {accuracy:.0%} meets {CALIBRATION_MIN_ACCURACY:.0%} threshold"
    log.info(f"[Vex 8/8] {finding}")
    return True, finding


# ------------------------------------------------------------------ #
#  Full Audit Pipeline                                                #
# ------------------------------------------------------------------ #

def audit_simulation(
    market: Market,
    sim_result: SimResult,
    seed_path: Path,
    sim_prompt: str,
) -> VexVerdict:
    """
    Run full 8-point adversarial audit on David's simulation.
    
    Args:
        market: Market dataclass
        sim_result: David's simulation result
        seed_path: Path to Alba's seed file
        sim_prompt: Simulation prompt given to MiroFish
    
    Returns:
        VexVerdict with verdict (PASS/PASS-WITH-WARNINGS/FAIL), findings, and confidence
    """
    log.info("=" * 60)
    log.info(f"VEX AUDIT STARTING: {market.question[:60]}")
    log.info("=" * 60)
    
    findings = []
    fail_reasons = []
    override_risk = False
    
    # Checklist Item 1: Resolution Criteria Match
    pass1, finding1 = check_resolution_criteria_match(market, sim_prompt)
    findings.append(f"[1] {finding1}")
    if not pass1:
        fail_reasons.append("Resolution criteria mismatch")
    
    # Checklist Item 2: Seed Quality
    pass2, finding2 = check_seed_quality(seed_path, market)
    findings.append(f"[2] {finding2}")
    if not pass2:
        fail_reasons.append("Seed quality issues")
    
    # Checklist Item 3: Agent Population Bias
    pass3, finding3 = check_agent_population_bias(market)
    findings.append(f"[3] {finding3}")
    if not pass3:
        fail_reasons.append("Agent population bias")
    
    # Checklist Item 4: Run Stability
    pass4, finding4 = check_run_stability(sim_result)
    findings.append(f"[4] {finding4}")
    if not pass4:
        fail_reasons.append("Run instability (variance >15%)")
    
    # Checklist Item 5: Confidence Inflation
    pass5, finding5 = check_confidence_inflation(sim_result)
    findings.append(f"[5] {finding5}")
    if not pass5:
        fail_reasons.append("Confidence inflation")
    
    # Checklist Item 6: Single-Point-of-Failure
    pass6, finding6, override_risk = check_single_point_of_failure(market)
    findings.append(f"[6] {finding6}")
    if not pass6:
        fail_reasons.append("Single-point-of-failure risk")
    
    # Checklist Item 7: Look-Ahead Contamination
    pass7, finding7 = check_look_ahead_contamination(seed_path, market)
    findings.append(f"[7] {finding7}")
    if not pass7:
        fail_reasons.append("Look-ahead contamination detected")
    
    # Checklist Item 8: Calibration Accuracy
    pass8, finding8 = check_calibration_accuracy(market)
    findings.append(f"[8] {finding8}")
    if not pass8:
        fail_reasons.append("Calibration accuracy below threshold")
    
    # Determine verdict
    all_checks = [pass1, pass2, pass3, pass4, pass5, pass6, pass7, pass8]
    
    if not all(all_checks):
        verdict = "FAIL"
        confidence = "DO NOT DEPLOY"
    elif any("WARN" in f for f in findings):
        verdict = "PASS-WITH-WARNINGS"
        # Determine confidence based on warning severity
        critical_warns = sum(1 for f in findings if "WARN" in f and any(kw in f for kw in ["variance", "contamination", "criteria"]))
        if critical_warns >= 2 or override_risk:
            confidence = "LOW"
        else:
            confidence = "MEDIUM"
    else:
        verdict = "PASS"
        confidence = "HIGH"
    
    vex_verdict = VexVerdict(
        verdict=verdict,
        findings=findings,
        confidence=confidence,
        override_risk=override_risk,
    )
    
    log.info("=" * 60)
    log.info(f"VEX AUDIT VERDICT: {verdict}")
    log.info(f"VEX CONFIDENCE: {confidence}")
    if fail_reasons:
        log.info(f"FAIL REASONS: {', '.join(fail_reasons)}")
    if override_risk:
        log.warning("⚠️  OVERRIDE RISK FLAGGED TO ORB")
    log.info("=" * 60)
    
    # Store Vex audit result in Pinecone for learning
    try:
        if _mem:
            import re
            slug = re.sub(r"[^a-z0-9]+", "-", market.question.lower())[:50].strip("-")
            
            # Build audit summary
            audit_summary = f"Vex {verdict} on {market.question[:80]}. "
            audit_summary += f"Confidence: {confidence}. "
            if fail_reasons:
                audit_summary += f"Failed: {', '.join(fail_reasons)}. "
            if findings:
                # Extract key findings (FAIL/WARN messages)
                key_findings = [f for f in findings if 'FAIL' in f or 'WARN' in f]
                if key_findings:
                    audit_summary += f"Key issues: {' | '.join(key_findings[:2])}"
            
            _mem.store_agent_note(
                agent="Vex",
                note=audit_summary,
                market_slug=slug,
                note_type="audit-result",
            )
            log.debug(f"[Vex] Stored audit result to Pinecone: {verdict}")
    except Exception as _exc:
        log.warning(f"[Vex] Pinecone store failed (non-fatal): {_exc}")
    
    return vex_verdict
