/**
 * ConfidenceMeter — SVG circular gauge
 *
 * Animates from 0% to target confidence with color transitions.
 * Red (0-50%) → Yellow (50-75%) → Green (75-100%)
 *
 * Usage:
 *   const meter = new ConfidenceMeter(containerElement);
 *   meter.animate(83);
 */

const COLORS = {
  low:    { start: '#ef4444', end: '#f87171' },
  medium: { start: '#eab308', end: '#facc15' },
  high:   { start: '#22c55e', end: '#4ade80' },
  track:  '#2a2d3a',
  text:   '#ffffff',
  label:  '#9ca3af',
};

const RADIUS = 50;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ANIMATION_DURATION = 1200;
const SIZE = (RADIUS + STROKE) * 2;
const CENTER = SIZE / 2;

class ConfidenceMeter {
  constructor(container) {
    this.container = container;
    this.currentValue = 0;
    this.targetValue = 0;
    this.animationId = null;
    this._build();
  }

  _build() {
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.width = SIZE + 'px';
    this.container.style.height = SIZE + 'px';

    // SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', SIZE);
    svg.setAttribute('height', SIZE);
    svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
    svg.style.transform = 'rotate(-90deg)';

    // Gradient definition
    this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    this.gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    this.gradient.setAttribute('id', 'meter-gradient-' + Math.random().toString(36).slice(2));
    this.gradientStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    this.gradientStop1.setAttribute('offset', '0%');
    this.gradientStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    this.gradientStop2.setAttribute('offset', '100%');
    this.gradient.appendChild(this.gradientStop1);
    this.gradient.appendChild(this.gradientStop2);
    this.defs.appendChild(this.gradient);
    svg.appendChild(this.defs);

    // Track
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('cx', CENTER);
    track.setAttribute('cy', CENTER);
    track.setAttribute('r', RADIUS);
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', COLORS.track);
    track.setAttribute('stroke-width', STROKE);
    svg.appendChild(track);

    // Fill arc
    this.arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.arc.setAttribute('cx', CENTER);
    this.arc.setAttribute('cy', CENTER);
    this.arc.setAttribute('r', RADIUS);
    this.arc.setAttribute('fill', 'none');
    this.arc.setAttribute('stroke', `url(#${this.gradient.getAttribute('id')})`);
    this.arc.setAttribute('stroke-width', STROKE);
    this.arc.setAttribute('stroke-linecap', 'round');
    this.arc.setAttribute('stroke-dasharray', CIRCUMFERENCE);
    this.arc.setAttribute('stroke-dashoffset', CIRCUMFERENCE);
    svg.appendChild(this.arc);

    // Glow (duplicate arc with blur)
    this.glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.glow.setAttribute('cx', CENTER);
    this.glow.setAttribute('cy', CENTER);
    this.glow.setAttribute('r', RADIUS);
    this.glow.setAttribute('fill', 'none');
    this.glow.setAttribute('stroke', `url(#${this.gradient.getAttribute('id')})`);
    this.glow.setAttribute('stroke-width', STROKE + 4);
    this.glow.setAttribute('stroke-linecap', 'round');
    this.glow.setAttribute('stroke-dasharray', CIRCUMFERENCE);
    this.glow.setAttribute('stroke-dashoffset', CIRCUMFERENCE);
    this.glow.setAttribute('opacity', '0.2');
    this.glow.setAttribute('filter', 'blur(4px)');
    svg.appendChild(this.glow);

    this.container.appendChild(svg);

    // Label overlay
    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;';

    this.valueEl = document.createElement('span');
    this.valueEl.style.cssText = `font-size:1.75rem;font-weight:700;color:${COLORS.text};font-variant-numeric:tabular-nums;`;
    this.valueEl.textContent = '0%';

    this.labelEl = document.createElement('span');
    this.labelEl.style.cssText = `font-size:0.7rem;color:${COLORS.label};text-transform:uppercase;letter-spacing:0.08em;margin-top:2px;`;
    this.labelEl.textContent = 'confidence';

    label.appendChild(this.valueEl);
    label.appendChild(this.labelEl);
    this.container.appendChild(label);

    this._updateColors(0);
  }

  animate(confidence) {
    this.targetValue = Math.max(0, Math.min(100, confidence));

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const startValue = this.currentValue;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const value = startValue + (this.targetValue - startValue) * eased;
      this._render(value);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(tick);
      } else {
        this.currentValue = this.targetValue;
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(tick);
  }

  reset() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.currentValue = 0;
    this.targetValue = 0;
    this._render(0);
  }

  _render(value) {
    this.currentValue = value;

    // Arc offset
    const offset = CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE;
    this.arc.setAttribute('stroke-dashoffset', offset);
    this.glow.setAttribute('stroke-dashoffset', offset);

    // Label
    this.valueEl.textContent = Math.round(value) + '%';

    // Colors
    this._updateColors(value);
  }

  _updateColors(value) {
    let colors;
    if (value < 50) {
      colors = COLORS.low;
    } else if (value < 75) {
      colors = COLORS.medium;
    } else {
      colors = COLORS.high;
    }

    this.gradientStop1.setAttribute('stop-color', colors.start);
    this.gradientStop2.setAttribute('stop-color', colors.end);

    // Tint the percentage label to match
    this.valueEl.style.color = colors.end;
  }
}

// Export for both module and browser use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConfidenceMeter };
} else {
  window.ConfidenceMeter = ConfidenceMeter;
}
