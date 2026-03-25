'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SignIn from './SignIn';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (status === 'loading') {
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--border)',
        }}
      />
    );
  }

  if (!session?.user) {
    return <SignIn />;
  }

  const { name, email, image } = session.user;

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          borderRadius: '0.375rem',
        }}
      >
        {image ? (
          <img
            src={image}
            alt={name || 'User'}
            width={32}
            height={32}
            style={{ borderRadius: '50%' }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {(name || email || '?')[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '0.5rem',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            minWidth: '200px',
            zIndex: 50,
          }}
        >
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
            {name || 'User'}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>
            {email}
          </p>

          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.125rem',
            }}
          >
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: '#9ca3af',
                fontSize: '0.8rem',
                padding: '0.375rem 0',
              }}
            >
              Settings
            </Link>
            <button
              onClick={() => signOut()}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '0.375rem 0',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
