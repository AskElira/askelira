'use client';

import { useState, useRef, useEffect } from 'react';

interface SwarmInputProps {
  onSubmit: (question: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export default function SwarmInput({
  onSubmit,
  loading = false,
  placeholder = 'Should we migrate to microservices?',
}: SwarmInputProps) {
  const [question, setQuestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
      <input
        ref={inputRef}
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        maxLength={500}
        style={{
          flex: 1,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          padding: '0.875rem 1rem',
          color: '#fff',
          fontSize: '1rem',
          outline: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      <button
        type="submit"
        disabled={loading || !question.trim()}
        style={{
          background: loading ? '#4b5563' : 'var(--accent)',
          color: '#fff',
          fontWeight: 600,
          padding: '0.875rem 1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          transition: 'background 0.15s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? 'Running...' : 'Run Swarm'}
      </button>
    </form>
  );
}
