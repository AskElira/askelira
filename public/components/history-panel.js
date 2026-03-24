/**
 * HistoryPanel — Sidebar component for debate history
 *
 * Displays recent debates as cards with search/filter.
 * Auto-refreshes every 30s. Emits events on selection.
 *
 * Usage:
 *   const panel = new HistoryPanel(containerElement, {
 *     onSelect: (debate) => console.log(debate),
 *   });
 *   panel.load();
 */

const REFRESH_INTERVAL = 30000;
const API_URL = '/api/history';

class HistoryPanel {
  constructor(container, { onSelect = null, days = 30 } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.days = days;
    this.debates = [];
    this.filtered = [];
    this.selectedId = null;
    this.refreshTimer = null;
    this.searchQuery = '';

    this._build();
    this.load();
    this._startAutoRefresh();
  }

  _build() {
    this.container.innerHTML = '';

    // Search bar
    this.searchWrap = document.createElement('div');
    this.searchWrap.style.cssText = 'padding:12px;border-bottom:1px solid rgba(255,255,255,0.06);';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search debates...';
    this.searchInput.style.cssText = [
      'width:100%;padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);',
      'background:rgba(15,17,23,0.6);color:#e5e7eb;font-size:0.8rem;outline:none;',
    ].join('');
    this.searchInput.addEventListener('input', () => {
      this.searchQuery = this.searchInput.value.trim().toLowerCase();
      this._applyFilter();
      this._renderList();
    });
    this.searchInput.addEventListener('focus', () => {
      this.searchInput.style.borderColor = 'rgba(99,102,241,0.5)';
    });
    this.searchInput.addEventListener('blur', () => {
      this.searchInput.style.borderColor = 'rgba(255,255,255,0.06)';
    });

    this.searchWrap.appendChild(this.searchInput);
    this.container.appendChild(this.searchWrap);

    // List container
    this.listEl = document.createElement('div');
    this.listEl.style.cssText = 'flex:1;overflow-y:auto;padding:6px;';
    this.container.appendChild(this.listEl);

    // Footer with count + refresh
    this.footerEl = document.createElement('div');
    this.footerEl.style.cssText = [
      'padding:8px 12px;border-top:1px solid rgba(255,255,255,0.06);',
      'display:flex;justify-content:space-between;align-items:center;',
    ].join('');

    this.countEl = document.createElement('span');
    this.countEl.style.cssText = 'font-size:0.7rem;color:#6b7280;';
    this.countEl.textContent = '0 debates';

    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh';
    refreshBtn.style.cssText = 'font-size:0.7rem;color:#6b7280;background:none;border:none;cursor:pointer;';
    refreshBtn.addEventListener('mouseenter', () => { refreshBtn.style.color = '#e5e7eb'; });
    refreshBtn.addEventListener('mouseleave', () => { refreshBtn.style.color = '#6b7280'; });
    refreshBtn.addEventListener('click', () => this.load());

    this.footerEl.appendChild(this.countEl);
    this.footerEl.appendChild(refreshBtn);
    this.container.appendChild(this.footerEl);

    // Empty state
    this._renderEmpty();
  }

  async load() {
    try {
      const url = this.searchQuery
        ? `${API_URL}?query=${encodeURIComponent(this.searchQuery)}&days=${this.days}`
        : `${API_URL}?days=${this.days}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      this.debates = await res.json();
      if (!Array.isArray(this.debates)) this.debates = [];
    } catch {
      // Keep existing data on failure
    }

    this._applyFilter();
    this._renderList();
  }

  select(index) {
    const debate = this.filtered[index];
    if (!debate) return;

    this.selectedId = index;
    this._renderList();

    if (this.onSelect) {
      this.onSelect(debate);
    }
  }

  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  _startAutoRefresh() {
    this.refreshTimer = setInterval(() => this.load(), REFRESH_INTERVAL);
  }

  _applyFilter() {
    if (!this.searchQuery) {
      this.filtered = [...this.debates];
    } else {
      this.filtered = this.debates.filter((d) => {
        const text = [d.question, d.decision, d.date].join(' ').toLowerCase();
        return text.includes(this.searchQuery);
      });
    }
  }

  _renderList() {
    this.listEl.innerHTML = '';

    if (this.filtered.length === 0) {
      this._renderEmpty();
      this.countEl.textContent = '0 debates';
      return;
    }

    this.countEl.textContent = `${this.filtered.length} debate${this.filtered.length !== 1 ? 's' : ''}`;

    this.filtered.forEach((debate, i) => {
      const card = this._createCard(debate, i);
      this.listEl.appendChild(card);
    });
  }

  _createCard(debate, index) {
    const card = document.createElement('div');
    const isSelected = index === this.selectedId;

    card.style.cssText = [
      'padding:10px 12px;border-radius:8px;cursor:pointer;',
      'transition:background 0.15s ease;margin-bottom:2px;',
      'border-left:2px solid transparent;',
      isSelected ? 'background:rgba(99,102,241,0.08);border-left-color:#6366f1;' : '',
    ].join('');

    card.addEventListener('mouseenter', () => {
      if (!isSelected) card.style.background = 'rgba(255,255,255,0.03)';
    });
    card.addEventListener('mouseleave', () => {
      if (!isSelected) card.style.background = 'transparent';
    });
    card.addEventListener('click', () => this.select(index));

    // Question
    const question = document.createElement('p');
    question.textContent = debate.question || 'Unknown';
    question.style.cssText = 'font-size:0.8rem;color:#d1d5db;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0 0 6px 0;';
    card.appendChild(question);

    // Meta row
    const meta = document.createElement('div');
    meta.style.cssText = 'display:flex;align-items:center;gap:8px;';

    // Decision badge
    const badge = document.createElement('span');
    const decision = (debate.decision || 'unknown').toLowerCase();
    const badgeColor = decision === 'yes' ? '#4ade80'
      : decision === 'no' ? '#f87171'
      : '#facc15';
    badge.textContent = decision;
    badge.style.cssText = `font-size:0.7rem;font-weight:600;color:${badgeColor};text-transform:uppercase;`;
    meta.appendChild(badge);

    // Confidence
    const conf = document.createElement('span');
    const confValue = debate.confidence || 0;
    const confColor = confValue >= 75 ? '#4ade80' : confValue >= 50 ? '#facc15' : '#f87171';
    conf.textContent = confValue + '%';
    conf.style.cssText = `font-size:0.7rem;color:${confColor};font-variant-numeric:tabular-nums;`;
    meta.appendChild(conf);

    // Date
    if (debate.date) {
      const date = document.createElement('span');
      date.textContent = debate.date;
      date.style.cssText = 'font-size:0.65rem;color:#4b5563;margin-left:auto;';
      meta.appendChild(date);
    }

    card.appendChild(meta);

    // Cost (subtle)
    if (debate.cost) {
      const cost = document.createElement('p');
      cost.textContent = '$' + debate.cost.toFixed(4);
      cost.style.cssText = 'font-size:0.65rem;color:#374151;margin:4px 0 0 0;';
      card.appendChild(cost);
    }

    return card;
  }

  _renderEmpty() {
    this.listEl.innerHTML = '';
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:24px 16px;text-align:center;';

    const icon = document.createElement('p');
    icon.textContent = '\uD83D\uDD70\uFE0F';
    icon.style.cssText = 'font-size:1.5rem;margin-bottom:8px;';
    empty.appendChild(icon);

    const text = document.createElement('p');
    text.textContent = this.searchQuery ? 'No matching debates' : 'No debates yet';
    text.style.cssText = 'font-size:0.8rem;color:#6b7280;margin:0;';
    empty.appendChild(text);

    if (this.searchQuery) {
      const hint = document.createElement('p');
      hint.textContent = 'Try a different search term';
      hint.style.cssText = 'font-size:0.7rem;color:#4b5563;margin:4px 0 0 0;';
      empty.appendChild(hint);
    }

    this.listEl.appendChild(empty);
  }
}

// Export for both module and browser use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HistoryPanel };
} else {
  window.HistoryPanel = HistoryPanel;
}
