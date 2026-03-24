/**
 * AskElira 2.0 — Main Frontend Application
 *
 * Wires up all UI components: swarm viz, confidence meter,
 * history panel, WebSocket, form submission, keyboard shortcuts.
 */

(function () {
  'use strict';

  // --- Constants ---
  const COST_PER_AGENT = 0.000007;
  const STATUS_INTERVAL = 30000;
  const WS_RECONNECT_DELAY = 3000;
  const PHASES = ['alba', 'david', 'vex', 'elira'];

  // --- State ---
  let ws = null;
  let isRunning = false;
  let swarmViz = null;
  let confidenceMeter = null;
  let historyPanel = null;
  let currentPhaseIndex = -1;

  // --- DOM refs ---
  const $ = (id) => document.getElementById(id);
  const els = {};

  function cacheDom() {
    els.questionInput = $('question-input');
    els.submitBtn = $('submit-btn');
    els.agentSlider = $('agent-slider');
    els.agentCount = $('agent-count');
    els.costEstimate = $('cost-estimate');
    els.statusBadge = $('status-badge');
    els.emptyState = $('empty-state');
    els.loadingState = $('loading-state');
    els.loadingPhase = $('loading-phase');
    els.resultDisplay = $('result-display');
    els.resultDecision = $('result-decision');
    els.resultConfidence = $('result-confidence');
    els.confidenceBar = $('confidence-bar');
    els.argsFor = $('args-for');
    els.argsAgainst = $('args-against');
    els.auditNotes = $('audit-notes');
    els.resultCost = $('result-cost');
    els.resultDuration = $('result-duration');
    els.resultAgents = $('result-agents');
    els.historyList = $('history-list');
    els.swarmCanvas = $('swarm-canvas');
    els.meterContainer = $('meter-container');
    els.historyContainer = $('history-container');
  }

  // --- Slider ---
  function updateSlider() {
    const val = parseInt(els.agentSlider.value);
    els.agentCount.textContent = val.toLocaleString();
    els.costEstimate.textContent = '$' + (val * COST_PER_AGENT).toFixed(4);
  }

  // --- WebSocket ---
  function connectWS() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    try {
      ws = new WebSocket(`${protocol}//${location.host}`);
    } catch {
      setTimeout(connectWS, WS_RECONNECT_DELAY);
      return;
    }

    ws.onopen = () => {
      console.log('[WS] Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWSMessage(data);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected, reconnecting...');
      setTimeout(connectWS, WS_RECONNECT_DELAY);
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  function handleWSMessage(data) {
    switch (data.type) {
      case 'connected':
        break;
      case 'phase':
        advancePhase(data.phase, data.message);
        break;
      case 'progress':
        if (swarmViz) {
          swarmViz.update({ phase: data.phase, forRatio: data.forRatio || 0.5 });
        }
        break;
      case 'result':
        displayResults(data.result);
        break;
    }
  }

  // --- Phase progress ---
  function resetPhases() {
    currentPhaseIndex = -1;
    PHASES.forEach((p) => {
      const el = $('phase-' + p);
      if (el) {
        el.className = 'flex items-center gap-2 text-sm text-gray-500';
        el.querySelector('span').innerHTML = '&#9711;';
      }
    });
  }

  function advancePhase(phaseName, message) {
    if (els.loadingPhase) {
      els.loadingPhase.textContent = message || `Running ${phaseName}...`;
    }

    // Mark previous phases complete
    const phaseIndex = PHASES.indexOf(phaseName);
    if (phaseIndex < 0) return;

    for (let i = 0; i <= phaseIndex; i++) {
      const el = $('phase-' + PHASES[i]);
      if (!el) continue;

      if (i < phaseIndex) {
        el.className = 'flex items-center gap-2 text-sm text-green-400';
        el.querySelector('span').innerHTML = '&#10003;';
      } else {
        el.className = 'flex items-center gap-2 text-sm text-accent';
        el.querySelector('span').innerHTML = '&#9679;';
      }
    }

    currentPhaseIndex = phaseIndex;

    // Update swarm viz phase
    if (swarmViz) {
      const vizPhase = ['research', 'debate', 'audit', 'synthesis'][phaseIndex] || 'idle';
      swarmViz.update({ phase: vizPhase });
    }
  }

  // --- Status ---
  async function checkStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      const color = data.gateway === 'online' ? 'bg-green-400' : 'bg-yellow-400';
      const label = data.gateway === 'online' ? 'Gateway Online' : 'Gateway Offline';
      els.statusBadge.innerHTML =
        `<span class="w-2 h-2 rounded-full ${color}"></span>` +
        `<span class="text-xs text-gray-400">${label}</span>`;
    } catch {
      els.statusBadge.innerHTML =
        '<span class="w-2 h-2 rounded-full bg-red-400"></span>' +
        '<span class="text-xs text-gray-400">Disconnected</span>';
    }
  }

  // --- Submit ---
  async function submitDebate() {
    const question = els.questionInput.value.trim();
    if (!question || isRunning) return;

    const agents = parseInt(els.agentSlider.value);
    isRunning = true;

    // Show loading
    showState('loading');
    resetPhases();
    setButtonLoading(true);

    // Start swarm viz
    if (swarmViz) {
      swarmViz.update({ phase: 'research', forRatio: 0.5 });
      swarmViz.start();
    }

    // Reset confidence meter
    if (confidenceMeter) {
      confidenceMeter.reset();
    }

    try {
      const res = await fetch('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, agents }),
      });

      const result = await res.json();

      if (res.ok) {
        displayResults(result);
      } else {
        showError(result.error || 'Unknown error');
      }
    } catch (err) {
      showError('Failed to connect: ' + err.message);
    } finally {
      isRunning = false;
      setButtonLoading(false);
      refreshHistory();
    }
  }

  // --- Display results ---
  function displayResults(r) {
    showState('result');

    // Complete swarm viz
    if (swarmViz) {
      const forRatio = r.argumentsFor && r.argumentsAgainst
        ? (r.argumentsFor.length || 1) / ((r.argumentsFor.length || 1) + (r.argumentsAgainst.length || 1))
        : 0.5;
      swarmViz.update({ phase: 'complete', forRatio });
    }

    // Decision
    const decText = r.decision.charAt(0).toUpperCase() + r.decision.slice(1);
    els.resultDecision.textContent = decText;
    els.resultDecision.className = 'text-2xl font-bold ' + decisionColor(r.decision);

    // Confidence bar
    els.resultConfidence.textContent = r.confidence + '%';
    els.confidenceBar.style.width = r.confidence + '%';
    els.confidenceBar.className = 'h-2 rounded-full transition-all duration-700 ' + confidenceBarColor(r.confidence);

    // Confidence meter
    if (confidenceMeter) {
      confidenceMeter.animate(r.confidence);
    }

    // Arguments for
    els.argsFor.innerHTML = formatArguments(r.argumentsFor, 'for');

    // Arguments against
    els.argsAgainst.innerHTML = formatArguments(r.argumentsAgainst, 'against');

    // Audit notes
    if (r.auditNotes && r.auditNotes.length > 0) {
      els.auditNotes.innerHTML = r.auditNotes
        .map((n) => `<li class="flex gap-2"><span class="text-yellow-400 shrink-0">!</span>${esc(n)}</li>`)
        .join('');
    } else {
      els.auditNotes.innerHTML = '<li class="text-green-400">All checks passed</li>';
    }

    // Stats
    els.resultCost.textContent = '$' + (r.actualCost || 0).toFixed(4);
    els.resultDuration.textContent = (r.duration || 0).toLocaleString() + 'ms';
    els.resultAgents.textContent = (r.agentCount || 0).toLocaleString();
  }

  function formatArguments(args, type) {
    if (!args || args.length === 0) {
      return '<li class="text-gray-500">None collected</li>';
    }
    const color = type === 'for' ? 'text-green-400' : 'text-red-400';
    const symbol = type === 'for' ? '+' : '-';
    return args
      .map((a) => `<li class="argument-item ${type}"><span class="${color} shrink-0">${symbol}</span>${esc(a)}</li>`)
      .join('');
  }

  // --- History ---
  async function refreshHistory() {
    // Use HistoryPanel component if available
    if (historyPanel) {
      historyPanel.load();
      return;
    }

    // Fallback: direct fetch
    try {
      const res = await fetch('/api/history?days=30');
      const debates = await res.json();

      if (!debates || debates.length === 0) {
        els.historyList.innerHTML = '<p class="text-sm text-gray-500 p-3">No debates yet</p>';
        return;
      }

      els.historyList.innerHTML = debates
        .map((d) => {
          const color = decisionColor(d.decision);
          return `
          <div class="history-item" onclick="document.getElementById('question-input').value='${escAttr(d.question)}'">
            <p class="text-sm text-gray-300 truncate">${esc(d.question)}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs ${color} font-medium">${esc(d.decision)}</span>
              <span class="text-xs text-gray-500">${d.confidence || 0}%</span>
              <span class="text-xs text-gray-600">${d.date || ''}</span>
            </div>
          </div>`;
        })
        .join('');
    } catch {
      // keep existing content
    }
  }

  // --- UI State ---
  function showState(state) {
    els.emptyState.classList.add('hidden');
    els.loadingState.classList.add('hidden');
    els.resultDisplay.classList.add('hidden');

    switch (state) {
      case 'empty':
        els.emptyState.classList.remove('hidden');
        break;
      case 'loading':
        els.loadingState.classList.remove('hidden');
        break;
      case 'result':
        els.resultDisplay.classList.remove('hidden');
        break;
    }
  }

  function setButtonLoading(loading) {
    els.submitBtn.disabled = loading;
    els.submitBtn.textContent = loading ? 'Running...' : 'Run Swarm';
    if (loading) {
      els.submitBtn.classList.add('opacity-50');
    } else {
      els.submitBtn.classList.remove('opacity-50');
    }
  }

  function showError(message) {
    showState('empty');
    // Brief inline error display
    const prev = els.emptyState.innerHTML;
    els.emptyState.innerHTML = `
      <div class="text-center fade-in">
        <p class="text-3xl mb-3">&#9888;&#65039;</p>
        <p class="text-red-400 font-medium">${esc(message)}</p>
        <p class="text-sm text-gray-600 mt-2">Check the console for details</p>
      </div>`;
    setTimeout(() => {
      els.emptyState.innerHTML = prev;
    }, 5000);
  }

  // --- Helpers ---
  function decisionColor(decision) {
    if (decision === 'yes') return 'text-green-400';
    if (decision === 'no') return 'text-red-400';
    return 'text-yellow-400';
  }

  function confidenceBarColor(confidence) {
    if (confidence >= 70) return 'bg-green-400';
    if (confidence >= 40) return 'bg-yellow-400';
    return 'bg-red-400';
  }

  function esc(str) {
    const el = document.createElement('span');
    el.textContent = str || '';
    return el.innerHTML;
  }

  function escAttr(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // --- Keyboard shortcuts ---
  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      // "/" to focus question input (when not already in an input)
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        els.questionInput.focus();
      }

      // Ctrl+K to focus history search
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const searchInput = document.querySelector('#history-container input, aside input');
        if (searchInput) searchInput.focus();
      }

      // Escape to clear / blur
      if (e.key === 'Escape') {
        if (document.activeElement === els.questionInput) {
          els.questionInput.value = '';
          els.questionInput.blur();
        } else {
          document.activeElement.blur();
        }
      }
    });
  }

  // --- Component init ---
  function initComponents() {
    // Swarm visualization
    if (els.swarmCanvas && typeof SwarmVisualization !== 'undefined') {
      const agents = parseInt(els.agentSlider.value) || 10000;
      swarmViz = new SwarmVisualization(els.swarmCanvas, { agents });
      swarmViz.start();
    }

    // Confidence meter
    if (els.meterContainer && typeof ConfidenceMeter !== 'undefined') {
      confidenceMeter = new ConfidenceMeter(els.meterContainer);
    }

    // History panel
    if (els.historyContainer && typeof HistoryPanel !== 'undefined') {
      historyPanel = new HistoryPanel(els.historyContainer, {
        onSelect: (debate) => {
          els.questionInput.value = debate.question || '';
        },
      });
    }
  }

  // --- Event bindings ---
  function bindEvents() {
    els.questionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitDebate();
    });

    els.submitBtn.addEventListener('click', submitDebate);

    els.agentSlider.addEventListener('input', () => {
      updateSlider();
      // Update swarm viz particle count
      if (swarmViz) {
        swarmViz.agentCount = parseInt(els.agentSlider.value);
      }
    });
  }

  // --- Init ---
  function init() {
    cacheDom();
    bindEvents();
    initKeyboard();
    initComponents();
    connectWS();
    checkStatus();
    refreshHistory();
    setInterval(checkStatus, STATUS_INTERVAL);

    console.log('[AskElira] UI initialized');
  }

  // Expose globals for inline HTML handlers (backwards compat)
  window.runSwarm = submitDebate;
  window.updateSlider = updateSlider;
  window.loadHistory = refreshHistory;

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
