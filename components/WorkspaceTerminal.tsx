'use client';

/**
 * WorkspaceTerminal — Phase 3 (CLI Phase 3)
 *
 * Xterm.js terminal component connecting to the Socket.io /terminal namespace.
 * Must be loaded with dynamic import (ssr: false).
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

// ============================================================
// Props
// ============================================================

interface WorkspaceTerminalProps {
  customerId: string;
  goalId?: string;
  onClose: () => void;
}

// ============================================================
// AskElira xterm theme
// ============================================================

const XTERM_THEME = {
  background: '#07070E',
  foreground: '#e5e7eb',
  cursor: '#9D72FF',
  cursorAccent: '#07070E',
  selectionBackground: 'rgba(157, 114, 255, 0.3)',
  selectionForeground: '#ffffff',
  black: '#07070E',
  red: '#f87171',
  green: '#4ade80',
  yellow: '#facc15',
  blue: '#60a5fa',
  magenta: '#9D72FF',
  cyan: '#22d3ee',
  white: '#e5e7eb',
  brightBlack: '#6b7280',
  brightRed: '#fca5a5',
  brightGreen: '#86efac',
  brightYellow: '#fde68a',
  brightBlue: '#93c5fd',
  brightMagenta: '#c4b5fd',
  brightCyan: '#67e8f9',
  brightWhite: '#f9fafb',
};

// ============================================================
// Component
// ============================================================

export default function WorkspaceTerminal({
  customerId,
  goalId,
  onClose,
}: WorkspaceTerminalProps) {
  const termContainerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspacePath, setWorkspacePath] = useState<string>('');

  // Handle resize
  const handleResize = useCallback(() => {
    const fitAddon = fitAddonRef.current;
    const socket = socketRef.current;
    if (!fitAddon || !termRef.current) return;

    try {
      fitAddon.fit();
      if (socket?.connected) {
        socket.emit('terminal.resize', {
          cols: termRef.current.cols,
          rows: termRef.current.rows,
        });
      }
    } catch {
      // fit can fail if container not visible
    }
  }, []);

  // Initialize terminal
  useEffect(() => {
    if (!termContainerRef.current) return;

    // Create xterm instance
    const term = new Terminal({
      theme: XTERM_THEME,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.3,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(termContainerRef.current);
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Initial fit
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch {
        // ignore
      }
    });

    // Connect to Socket.io /terminal namespace
    const socket = io('/terminal', {
      path: '/api/socketio',
      auth: { customerId },
      query: { customerId, goalId: goalId || '' },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    // Terminal ready
    socket.on('terminal.ready', (data: { pid: number; workspacePath: string }) => {
      setConnected(true);
      setError(null);
      setWorkspacePath(data.workspacePath);
      term.writeln('\x1b[38;5;141mAskElira Workspace Terminal\x1b[0m');
      term.writeln(`\x1b[90mWorkspace: ${data.workspacePath}\x1b[0m`);
      term.writeln('');
    });

    // Terminal output from server
    socket.on('terminal.output', (data: string) => {
      term.write(data);
    });

    // Terminal exit
    socket.on('terminal.exit', (data: { exitCode: number }) => {
      term.writeln('');
      term.writeln(`\x1b[90mShell exited (code ${data.exitCode})\x1b[0m`);
      setConnected(false);
    });

    // Terminal error
    socket.on('terminal.error', (data: { message: string; mode?: string }) => {
      setError(data.message);
      term.writeln(`\x1b[31mError: ${data.message}\x1b[0m`);
    });

    // Connection events
    socket.on('connect_error', (err: Error) => {
      setError(`Connection failed: ${err.message}`);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Wire user input to server
    term.onData((data: string) => {
      if (socket.connected) {
        socket.emit('terminal.input', data);
      }
    });

    // Resize handler
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
          if (socket.connected && term.cols > 0 && term.rows > 0) {
            socket.emit('terminal.resize', {
              cols: term.cols,
              rows: term.rows,
            });
          }
        } catch {
          // ignore
        }
      });
    });

    if (termContainerRef.current) {
      resizeObserver.observe(termContainerRef.current);
    }

    // Window resize
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      socket.disconnect();
      socketRef.current = null;
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, [customerId, goalId, handleResize]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#07070E',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.375rem 0.75rem',
          background: 'rgba(157, 114, 255, 0.06)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {/* Status indicator */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: connected ? '#4ade80' : error ? '#f87171' : '#facc15',
              boxShadow: connected
                ? '0 0 6px rgba(74, 222, 128, 0.5)'
                : 'none',
            }}
          />
          <span
            style={{
              fontSize: '0.6875rem',
              color: '#9ca3af',
              fontFamily: 'monospace',
            }}
          >
            {workspacePath || 'Connecting...'}
          </span>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.color = '#9ca3af';
          }}
          title="Close terminal"
        >
          &#10005;
        </button>
      </div>

      {/* Terminal container */}
      <div
        ref={termContainerRef}
        style={{
          height: '320px',
          padding: '0.25rem',
          background: '#07070E',
        }}
      />
    </div>
  );
}
