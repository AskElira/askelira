/**
 * Terminal Server — Phase 3 (CLI Phase 3)
 *
 * Socket.io /terminal namespace handler.
 * Spawns bash in customer workspace via node-pty.
 * Graceful fallback when node-pty is not available.
 */

import type { Server as SocketServer, Socket } from 'socket.io';
import { getWorkspacePath, ensureWorkspace } from './workspace-paths';

// ============================================================
// node-pty availability check
// ============================================================

interface IPty {
  onData: (callback: (data: string) => void) => void;
  onExit: (callback: (e: { exitCode: number; signal?: number }) => void) => void;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: (signal?: string) => void;
  pid: number;
}

interface NodePtyModule {
  spawn: (
    file: string,
    args: string[],
    options: {
      name?: string;
      cols?: number;
      rows?: number;
      cwd?: string;
      env?: Record<string, string>;
    },
  ) => IPty;
}

let nodePty: NodePtyModule | null = null;
let ptyAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  nodePty = require('node-pty') as NodePtyModule;
  ptyAvailable = true;
} catch {
  console.log('[TerminalServer] node-pty not available — terminal will be read-only');
}

/**
 * Check if node-pty is available for full terminal support.
 */
export function isPtyAvailable(): boolean {
  return ptyAvailable;
}

// ============================================================
// Active sessions tracking
// ============================================================

const activeSessions = new Map<string, IPty>();

// [BUG-5-10] Track sessions per customer to prevent resource exhaustion
const MAX_SESSIONS_PER_CUSTOMER = 3;
const customerSessionCounts = new Map<string, number>();

// [BUG-5-01] Allowlist of safe env vars for customer PTY shells.
// NEVER pass secrets (API keys, DB URLs, webhook secrets) to customer shells.
const SAFE_ENV_VARS = new Set([
  'PATH', 'LANG', 'LC_ALL', 'LC_CTYPE', 'SHELL', 'USER', 'LOGNAME',
  'TMPDIR', 'TMP', 'TEMP',
]);

/**
 * Kill all active PTY sessions. Called on server shutdown.
 */
export function killAllSessions(): void {
  for (const [socketId, pty] of activeSessions.entries()) {
    try {
      pty.kill();
    } catch {
      // best-effort cleanup
    }
    activeSessions.delete(socketId);
  }
}

// ============================================================
// Socket.io namespace handler
// ============================================================

/**
 * Register the /terminal namespace on a Socket.io server instance.
 * Each socket connection spawns a bash shell in the customer workspace.
 *
 * Events:
 *   terminal.input  (client -> server)  — keystrokes
 *   terminal.resize (client -> server)  — { cols, rows }
 *   terminal.output (server -> client)  — terminal data
 *   terminal.exit   (server -> client)  — shell exited
 *   terminal.error  (server -> client)  — error message
 *   terminal.ready  (server -> client)  — shell ready
 */
export function registerTerminalHandlers(io: SocketServer): void {
  const terminalNs = io.of('/terminal');

  terminalNs.on('connection', async (socket: Socket) => {
    const customerId = socket.handshake.auth?.customerId as string
      || socket.handshake.query?.customerId as string;

    if (!customerId) {
      socket.emit('terminal.error', { message: 'Missing customerId in auth' });
      socket.disconnect(true);
      return;
    }

    console.log(`[TerminalServer] Connection from customer ${customerId} (socket ${socket.id})`);

    // [BUG-5-10] Enforce per-customer session limit
    const currentCount = customerSessionCounts.get(customerId) ?? 0;
    if (currentCount >= MAX_SESSIONS_PER_CUSTOMER) {
      socket.emit('terminal.error', {
        message: `Too many active terminal sessions (max ${MAX_SESSIONS_PER_CUSTOMER}). Close an existing session first.`,
      });
      socket.disconnect(true);
      return;
    }
    customerSessionCounts.set(customerId, currentCount + 1);

    // Check PTY availability
    if (!nodePty || !ptyAvailable) {
      socket.emit('terminal.error', {
        message: 'Terminal not available — node-pty is not installed on this server.',
        mode: 'readonly',
      });
      socket.disconnect(true);
      return;
    }

    // Ensure workspace exists
    let workspacePath: string;
    try {
      workspacePath = await ensureWorkspace(customerId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      socket.emit('terminal.error', { message: `Workspace error: ${msg}` });
      socket.disconnect(true);
      return;
    }

    // Spawn PTY
    let pty: IPty;
    try {
      const shell = process.env.SHELL || '/bin/bash';
      pty = nodePty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: workspacePath,
        env: {
          // [BUG-5-01] Only pass safe env vars to customer shell.
          // Previously spread ALL of process.env, leaking ANTHROPIC_API_KEY,
          // STRIPE_SECRET_KEY, POSTGRES_URL, etc. to customer-controlled shell.
          ...Object.fromEntries(
            Object.entries(process.env).filter(
              (entry): entry is [string, string] =>
                entry[1] !== undefined && SAFE_ENV_VARS.has(entry[0]),
            ),
          ),
          HOME: workspacePath,
          TERM: 'xterm-256color',
          // Restrict to workspace
          WORKSPACE: workspacePath,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[TerminalServer] PTY spawn failed: ${msg}`);
      socket.emit('terminal.error', { message: `Shell spawn failed: ${msg}` });
      socket.disconnect(true);
      return;
    }

    // Track session
    activeSessions.set(socket.id, pty);

    console.log(`[TerminalServer] PTY spawned (pid ${pty.pid}) for ${customerId}`);

    // Wire PTY output -> client
    pty.onData((data: string) => {
      socket.emit('terminal.output', data);
    });

    // Wire PTY exit -> client
    pty.onExit((e: { exitCode: number; signal?: number }) => {
      console.log(`[TerminalServer] PTY exited (pid ${pty.pid}, code ${e.exitCode})`);
      socket.emit('terminal.exit', { exitCode: e.exitCode, signal: e.signal });
      activeSessions.delete(socket.id);
    });

    // Signal ready
    socket.emit('terminal.ready', {
      pid: pty.pid,
      workspacePath,
    });

    // Wire client input -> PTY
    socket.on('terminal.input', (data: string) => {
      try {
        pty.write(data);
      } catch {
        // PTY may have exited
      }
    });

    // Wire client resize -> PTY
    socket.on('terminal.resize', (size: { cols: number; rows: number }) => {
      try {
        if (size.cols > 0 && size.rows > 0 && size.cols < 500 && size.rows < 200) {
          pty.resize(size.cols, size.rows);
        }
      } catch {
        // PTY may have exited
      }
    });

    // Cleanup on disconnect — prevent orphaned PTY processes
    socket.on('disconnect', () => {
      console.log(`[TerminalServer] Socket ${socket.id} disconnected, killing PTY`);
      try {
        pty.kill();
      } catch {
        // already dead
      }
      activeSessions.delete(socket.id);
      // [BUG-5-10] Decrement customer session count
      const count = customerSessionCounts.get(customerId) ?? 1;
      if (count <= 1) {
        customerSessionCounts.delete(customerId);
      } else {
        customerSessionCounts.set(customerId, count - 1);
      }
    });
  });
}
