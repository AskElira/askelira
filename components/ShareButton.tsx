'use client';

import { useState } from 'react';

export default function ShareButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/results/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyLink}
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        color: '#e5e7eb',
        borderRadius: '0.5rem',
        padding: '0.625rem 1.25rem',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'border-color 0.15s ease',
      }}
    >
      {copied ? 'Copied!' : 'Share Link'}
    </button>
  );
}
