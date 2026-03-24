'use client';

/**
 * WorkspaceFileBrowser — Phase 3 (CLI Phase 3)
 *
 * Simple file tree using workspace API routes.
 * Fallback when node-pty is not available (readonly mode).
 * Must be loaded with dynamic import (ssr: false).
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================
// Props
// ============================================================

interface WorkspaceFileBrowserProps {
  customerId: string;
  onClose: () => void;
}

// ============================================================
// Component
// ============================================================

export default function WorkspaceFileBrowser({
  customerId,
  onClose,
}: WorkspaceFileBrowserProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load file list
  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${encodeURIComponent(customerId)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load files';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Load file content
  const loadFile = useCallback(
    async (filePath: string) => {
      if (filePath.endsWith('/')) return; // directory, not file

      setSelectedFile(filePath);
      setFileContent(null);

      try {
        const res = await fetch(
          `/api/workspaces/${encodeURIComponent(customerId)}/${filePath}`,
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Not found' }));
          setFileContent(`Error: ${body.error || `HTTP ${res.status}`}`);
          return;
        }
        const data = await res.json();
        setFileContent(data.content ?? 'Empty file');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to read file';
        setFileContent(`Error: ${msg}`);
      }
    },
    [customerId],
  );

  // Determine if an entry is a directory
  const isDir = (f: string) => f.endsWith('/');

  // Get indent level
  const getIndent = (f: string) => {
    const parts = f.replace(/\/$/, '').split('/');
    return parts.length - 1;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#07070E',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        maxHeight: '400px',
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
        <span
          style={{
            fontSize: '0.6875rem',
            color: '#9ca3af',
            fontFamily: 'monospace',
          }}
        >
          Workspace Files
          {selectedFile && (
            <span style={{ color: '#9D72FF' }}> / {selectedFile}</span>
          )}
        </span>
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
          }}
          title="Close file browser"
        >
          &#10005;
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* File tree panel */}
        <div
          style={{
            width: selectedFile ? '35%' : '100%',
            overflowY: 'auto',
            borderRight: selectedFile ? '1px solid var(--border)' : 'none',
            padding: '0.375rem 0',
          }}
        >
          {loading && (
            <div
              style={{
                padding: '1rem',
                color: '#6b7280',
                fontSize: '0.75rem',
                textAlign: 'center',
              }}
            >
              Loading files...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '0.75rem',
                color: '#f87171',
                fontSize: '0.75rem',
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <div
              style={{
                padding: '1rem',
                color: '#6b7280',
                fontSize: '0.75rem',
                textAlign: 'center',
              }}
            >
              No files in workspace
            </div>
          )}

          {files.map((file) => (
            <button
              key={file}
              onClick={() => loadFile(file)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.25rem 0.5rem',
                paddingLeft: `${0.5 + getIndent(file) * 0.75}rem`,
                background:
                  selectedFile === file
                    ? 'rgba(157, 114, 255, 0.12)'
                    : 'transparent',
                border: 'none',
                color: isDir(file) ? '#9D72FF' : '#d1d5db',
                fontSize: '0.6875rem',
                fontFamily: 'monospace',
                cursor: isDir(file) ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span style={{ marginRight: '0.375rem', opacity: 0.6 }}>
                {isDir(file) ? '\u{1F4C1}' : '\u{1F4C4}'}
              </span>
              {file.replace(/\/$/, '').split('/').pop()}
            </button>
          ))}
        </div>

        {/* File content panel */}
        {selectedFile && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.5rem',
            }}
          >
            {fileContent === null ? (
              <div
                style={{
                  color: '#6b7280',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  paddingTop: '1rem',
                }}
              >
                Loading...
              </div>
            ) : (
              <pre
                style={{
                  margin: 0,
                  padding: 0,
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace",
                  fontSize: '0.6875rem',
                  lineHeight: 1.5,
                  color: '#e5e7eb',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {fileContent}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
