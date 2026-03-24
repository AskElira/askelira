// ============================================================
// AskElira CLI — Format Helpers
// ============================================================
// Shared formatting utilities for terminal output.

import chalk from 'chalk';

// ── Agent Colors ─────────────────────────────────────────────

const AGENT_COLORS: Record<string, (s: string) => string> = {
  Alba: chalk.cyan,
  Vex: chalk.yellow,
  David: chalk.magenta,
  Elira: chalk.green,
  Steven: chalk.blue,
  System: chalk.gray,
};

/**
 * Get the chalk color function for an agent name.
 */
export function agentColor(agentName: string): (s: string) => string {
  // Match partial names (e.g., "Vex Gate 1" -> Vex)
  for (const [key, colorFn] of Object.entries(AGENT_COLORS)) {
    if (agentName.toLowerCase().startsWith(key.toLowerCase())) {
      return colorFn;
    }
  }
  return chalk.white;
}

// ── Relative Time ────────────────────────────────────────────

/**
 * Convert a date string or Date to a human-readable relative time.
 * e.g. "2 hours ago", "just now", "3 days ago"
 */
export function relativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ── Status Badge ─────────────────────────────────────────────

const STATUS_COLORS: Record<string, (s: string) => string> = {
  planning: chalk.blue,
  building: chalk.yellow,
  goal_met: chalk.green,
  blocked: chalk.red,
  pending: chalk.gray,
  researching: chalk.cyan,
  auditing: chalk.magenta,
  live: chalk.green,
  broken: chalk.red,
};

/**
 * Return a colored status badge string.
 */
export function statusBadge(status: string): string {
  const colorFn = STATUS_COLORS[status] || chalk.white;
  const label = status.replace(/_/g, ' ').toUpperCase();
  return colorFn(`[${label}]`);
}

// ── Progress Bar ─────────────────────────────────────────────

/**
 * Render a 10-character progress bar.
 * @param filled - 0 to 10 (or fraction 0-1)
 * @param color - chalk color function
 */
export function progressBar(filled: number, color?: (s: string) => string): string {
  const width = 10;
  // Accept fraction (0-1) or integer (0-10)
  const filledCount = filled <= 1 ? Math.round(filled * width) : Math.min(filled, width);
  const emptyCount = width - filledCount;
  const colorFn = color || chalk.green;
  return colorFn('\u2588'.repeat(filledCount)) + chalk.gray('\u2591'.repeat(emptyCount));
}

// ── Truncate ─────────────────────────────────────────────────

/**
 * Truncate a string with ellipsis.
 */
export function truncate(str: string, len: number): string {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.substring(0, len - 1) + '\u2026';
}

// ── Box Drawing ──────────────────────────────────────────────

/**
 * Top border with title.
 * e.g. ┌─ Title ──────────────┐
 */
export function boxTop(title: string, width: number): string {
  const titlePart = title ? `\u2500 ${title} ` : '';
  const remaining = width - 2 - titlePart.length;
  return '\u250C' + titlePart + '\u2500'.repeat(Math.max(0, remaining)) + '\u2510';
}

/**
 * Bottom border.
 * e.g. └──────────────────────┘
 */
export function boxBottom(width: number): string {
  return '\u2514' + '\u2500'.repeat(width - 2) + '\u2518';
}

/**
 * Content row padded to width.
 * e.g. │ content              │
 */
export function boxRow(content: string, width: number): string {
  // Strip ANSI for length calculation
  const stripped = stripAnsi(content);
  const padding = width - 4 - stripped.length;
  return '\u2502 ' + content + ' '.repeat(Math.max(0, padding)) + ' \u2502';
}

/**
 * Divider row.
 * e.g. ├──────────────────────┤
 */
export function boxDivider(width: number): string {
  return '\u251C' + '\u2500'.repeat(width - 2) + '\u2524';
}

// ── Timestamp Formatting ─────────────────────────────────────

/**
 * Format a date string to HH:MM:SS.
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { hour12: false });
}

// ── ANSI Helpers ─────────────────────────────────────────────

/**
 * Strip ANSI escape codes from a string (for length calculation).
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001B\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Format an interval in milliseconds to a human-readable string.
 * e.g. 300000 -> "5 minutes", 60000 -> "1 minute"
 */
export function formatInterval(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)} seconds`;
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Format a number of milliseconds to human-readable duration.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSec}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return `${hours}h ${remainingMin}m`;
}

/**
 * Action text translation (same as frontend AgentTicker).
 */
export function translateAction(action: string): string {
  const map: Record<string, string> = {
    research_start: 'Started research',
    research_complete: 'Research complete',
    gate1_pass: 'Gate 1 passed',
    gate1_fail: 'Gate 1 failed',
    build_start: 'Started building',
    build_complete: 'Build complete',
    gate2_pass: 'Gate 2 passed',
    gate2_fail: 'Gate 2 failed',
    review_pass: 'Review passed',
    review_fail: 'Review failed',
    floor_live: 'Floor is LIVE',
    floor_blocked: 'Floor blocked',
    building_approved: 'Building approved',
    heartbeat_check: 'Heartbeat check',
    heartbeat_healthy: 'Floor healthy',
    heartbeat_rerun: 'Triggering rerun',
    heartbeat_escalate: 'Escalating issue',
    escalation_report: 'Escalation report',
    escalation_verdict: 'Escalation verdict',
    automation_suggestion: 'Suggestion logged',
  };
  return map[action] || action.replace(/_/g, ' ');
}
