'use client';

import { useState, useEffect } from 'react';

type Tab = 'SOUL' | 'AGENTS' | 'TOOLS';

interface Workspace {
  soul: string;
  agents: string;
  tools: string;
}

export default function WorkspaceEditor() {
  const [activeTab, setActiveTab] = useState<Tab>('AGENTS');
  const [workspace, setWorkspace] = useState<Workspace>({ soul: '', agents: '', tools: '' });
  const [editedAgents, setEditedAgents] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    fetch('/api/workspace')
      .then((r) => r.json())
      .then((data) => {
        if (data.workspace) {
          setWorkspace(data.workspace);
          setEditedAgents(data.workspace.agents || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSavedMsg('');
    try {
      await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents: editedAgents }),
      });
      setWorkspace((prev) => ({ ...prev, agents: editedAgents }));
      setSavedMsg('Saved!');
      setTimeout(() => setSavedMsg(''), 2000);
    } catch {
      setSavedMsg('Error saving');
    } finally {
      setSaving(false);
    }
  }

  const tabs: Tab[] = ['SOUL', 'AGENTS', 'TOOLS'];

  const currentContent =
    activeTab === 'SOUL' ? workspace.soul :
    activeTab === 'AGENTS' ? editedAgents :
    workspace.tools;

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
        Loading workspace...
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--panel, #111827)',
        border: '1px solid var(--border, #1f2937)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem 0',
          borderBottom: '1px solid var(--border, #1f2937)',
        }}
      >
        <h3 style={{ color: '#fff', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
          Workspace Files
        </h3>
        <div style={{ display: 'flex', gap: '0' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                color: activeTab === tab ? '#fff' : '#6b7280',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab ? 600 : 400,
                transition: 'color 0.15s',
              }}
            >
              {tab}.md
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem 1.25rem' }}>
        <textarea
          value={currentContent}
          readOnly={activeTab !== 'AGENTS'}
          onChange={(e) => activeTab === 'AGENTS' && setEditedAgents(e.target.value)}
          rows={12}
          style={{
            width: '100%',
            background: '#0d1117',
            border: '1px solid var(--border, #1f2937)',
            borderRadius: '0.5rem',
            color: '#e5e7eb',
            fontFamily: 'monospace',
            fontSize: '0.8125rem',
            lineHeight: 1.6,
            padding: '0.875rem',
            resize: 'vertical',
            outline: 'none',
            cursor: activeTab !== 'AGENTS' ? 'default' : 'text',
            opacity: activeTab !== 'AGENTS' ? 0.7 : 1,
            boxSizing: 'border-box',
          }}
        />

        {activeTab === 'AGENTS' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '0.75rem',
            }}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#6366f1',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.5rem 1.25rem',
                opacity: saving ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {saving ? 'Saving...' : 'Save AGENTS.md'}
            </button>
            {savedMsg && (
              <span style={{ color: savedMsg.startsWith('Error') ? '#ef4444' : '#10b981', fontSize: '0.875rem' }}>
                {savedMsg}
              </span>
            )}
          </div>
        )}

        {activeTab !== 'AGENTS' && (
          <p style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Read-only. Edit directly in ~/askelira/{activeTab}.md
          </p>
        )}
      </div>
    </div>
  );
}
