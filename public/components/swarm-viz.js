/**
 * SwarmVisualization — Canvas-based particle system
 *
 * Renders agent clusters as animated particles. Each particle represents
 * a group of agents. Particles drift, pulse, and color-shift as the
 * debate progresses from neutral → for/against → consensus.
 *
 * Usage:
 *   const viz = new SwarmVisualization(canvasElement, { agents: 10000 });
 *   viz.start();
 *   viz.update({ phase: 'debate', forRatio: 0.6 });
 *   viz.stop();
 */

const COLORS = {
  neutral: { r: 99, g: 102, b: 241 },   // indigo
  for:     { r: 74, g: 222, b: 128 },    // green
  against: { r: 248, g: 113, b: 113 },   // red
  glow:    { r: 99, g: 102, b: 241 },    // accent glow
};

const PHASE_CONFIG = {
  idle:      { speed: 0.3, spread: 0.9, pulseRate: 0.005 },
  research:  { speed: 0.5, spread: 0.85, pulseRate: 0.008 },
  debate:    { speed: 1.2, spread: 0.6, pulseRate: 0.015 },
  audit:     { speed: 0.6, spread: 0.4, pulseRate: 0.01 },
  synthesis: { speed: 0.2, spread: 0.3, pulseRate: 0.005 },
  complete:  { speed: 0.1, spread: 0.25, pulseRate: 0.003 },
};

class Particle {
  constructor(x, y, canvas) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
    this.canvas = canvas;
    this.size = 1.5 + Math.random() * 2;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0.2 + Math.random() * 0.8;
    this.orbitRadius = 20 + Math.random() * 80;
    this.opacity = 0.2 + Math.random() * 0.6;
    this.pulseOffset = Math.random() * Math.PI * 2;
    this.color = { ...COLORS.neutral };
    this.targetColor = { ...COLORS.neutral };
    this.stance = 'neutral';
  }

  setStance(stance) {
    this.stance = stance;
    this.targetColor = { ...COLORS[stance] || COLORS.neutral };
  }

  update(config, time) {
    // Orbit around base position
    this.angle += config.speed * this.speed * 0.01;
    const spread = config.spread * this.orbitRadius;
    this.x = this.baseX + Math.cos(this.angle) * spread;
    this.y = this.baseY + Math.sin(this.angle * 0.7) * spread * 0.6;

    // Pulse opacity
    this.opacity = 0.3 + Math.sin(time * config.pulseRate + this.pulseOffset) * 0.4;

    // Lerp color toward target
    this.color.r += (this.targetColor.r - this.color.r) * 0.03;
    this.color.g += (this.targetColor.g - this.color.g) * 0.03;
    this.color.b += (this.targetColor.b - this.color.b) * 0.03;

    // Wrap around edges
    if (this.x < -10) this.x = this.canvas.width + 10;
    if (this.x > this.canvas.width + 10) this.x = -10;
    if (this.y < -10) this.y = this.canvas.height + 10;
    if (this.y > this.canvas.height + 10) this.y = -10;
  }

  draw(ctx) {
    const r = Math.round(this.color.r);
    const g = Math.round(this.color.g);
    const b = Math.round(this.color.b);

    // Glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.15})`;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
    ctx.fill();
  }
}

class ClusterGlow {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.opacity = 0;
    this.targetOpacity = 0;
    this.color = { ...COLORS.neutral };
  }

  update(time) {
    this.opacity += (this.targetOpacity - this.opacity) * 0.02;
    const pulse = Math.sin(time * 0.003) * 0.1;
    this.opacity = Math.max(0, this.opacity + pulse);
  }

  draw(ctx) {
    if (this.opacity < 0.01) return;
    const r = Math.round(this.color.r);
    const g = Math.round(this.color.g);
    const b = Math.round(this.color.b);
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.3})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
  }
}

class SwarmVisualization {
  constructor(canvas, { agents = 10000 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.agentCount = agents;
    this.particles = [];
    this.clusters = [];
    this.phase = 'idle';
    this.forRatio = 0.5;
    this.running = false;
    this.animationId = null;
    this.time = 0;

    this._resize();
    this._initParticles();
    this._initClusters();

    this._resizeHandler = () => this._resize();
    window.addEventListener('resize', this._resizeHandler);
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  _initParticles() {
    // Cap visual particles for performance (represent agents in groups)
    const count = Math.min(Math.ceil(this.agentCount / 20), 500);
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    this.particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.min(cx, cy) * 0.8;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      this.particles.push(new Particle(x, y, this.canvas));
    }
  }

  _initClusters() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    // Two main clusters: for (left) and against (right)
    this.clusters = [
      new ClusterGlow(cx * 0.6, cy, Math.min(cx, cy) * 0.5),
      new ClusterGlow(cx * 1.4, cy, Math.min(cx, cy) * 0.5),
    ];
    this.clusters[0].color = { ...COLORS.for };
    this.clusters[1].color = { ...COLORS.against };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this._resizeHandler);
  }

  update({ phase = 'idle', forRatio = 0.5 } = {}) {
    this.phase = phase;
    this.forRatio = Math.max(0, Math.min(1, forRatio));

    // Assign stances to particles based on ratio
    const forCount = Math.floor(this.particles.length * this.forRatio);
    const shuffled = [...this.particles].sort(() => Math.random() - 0.5);

    shuffled.forEach((p, i) => {
      if (phase === 'idle' || phase === 'research') {
        p.setStance('neutral');
      } else if (i < forCount) {
        p.setStance('for');
      } else {
        p.setStance('against');
      }
    });

    // Move cluster bases during debate
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    if (phase === 'debate' || phase === 'audit') {
      // Separate clusters
      shuffled.slice(0, forCount).forEach((p) => {
        p.baseX = cx * 0.5 + (Math.random() - 0.5) * cx * 0.4;
        p.baseY = cy + (Math.random() - 0.5) * cy * 0.6;
      });
      shuffled.slice(forCount).forEach((p) => {
        p.baseX = cx * 1.5 + (Math.random() - 0.5) * cx * 0.4;
        p.baseY = cy + (Math.random() - 0.5) * cy * 0.6;
      });
      this.clusters[0].targetOpacity = 0.4;
      this.clusters[1].targetOpacity = 0.4;
    } else if (phase === 'synthesis' || phase === 'complete') {
      // Merge toward winner
      const winX = this.forRatio >= 0.5 ? cx * 0.7 : cx * 1.3;
      this.particles.forEach((p) => {
        p.baseX = winX + (Math.random() - 0.5) * cx * 0.3;
        p.baseY = cy + (Math.random() - 0.5) * cy * 0.4;
      });
      this.clusters[0].targetOpacity = this.forRatio >= 0.5 ? 0.5 : 0.1;
      this.clusters[1].targetOpacity = this.forRatio < 0.5 ? 0.5 : 0.1;
    } else {
      // Idle — spread evenly
      this.particles.forEach((p) => {
        p.baseX = cx + (Math.random() - 0.5) * cx * 1.4;
        p.baseY = cy + (Math.random() - 0.5) * cy * 1.2;
      });
      this.clusters[0].targetOpacity = 0;
      this.clusters[1].targetOpacity = 0;
    }
  }

  _loop() {
    if (!this.running) return;

    this.time++;
    const config = PHASE_CONFIG[this.phase] || PHASE_CONFIG.idle;

    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw clusters
    this.clusters.forEach((c) => {
      c.update(this.time);
      c.draw(this.ctx);
    });

    // Draw connection lines between nearby particles (sparse)
    if (this.phase === 'debate' || this.phase === 'audit') {
      this._drawConnections();
    }

    // Update and draw particles
    this.particles.forEach((p) => {
      p.update(config, this.time);
      p.draw(this.ctx);
    });

    this.animationId = requestAnimationFrame(() => this._loop());
  }

  _drawConnections() {
    const ctx = this.ctx;
    const maxDist = 50;

    for (let i = 0; i < this.particles.length; i += 3) {
      const a = this.particles[i];
      for (let j = i + 3; j < this.particles.length; j += 3) {
        const b = this.particles[j];
        if (a.stance !== b.stance) continue;

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.08;
          const r = Math.round(a.color.r);
          const g = Math.round(a.color.g);
          const bVal = Math.round(a.color.b);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${bVal}, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }
}

// Export for both module and browser use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SwarmVisualization };
} else {
  window.SwarmVisualization = SwarmVisualization;
}
