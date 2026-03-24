'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';

// ---------------------------------------------------------------------------
// Nav links
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { href: '/buildings', label: 'My Buildings' },
  { href: '/onboard', label: 'New Building' },
  { href: '/billing', label: 'Billing' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Nav() {
  const pathname = usePathname();

  // Hide nav on the main swarm page (has its own header)
  if (pathname === '/') return null;

  return (
    <header
      style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>
          AskElira <span style={{ color: 'var(--accent)' }}>2.1</span>
        </h1>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {NAV_LINKS.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + '/');

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: isActive ? '#fff' : '#9ca3af',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
            >
              {link.label}
            </Link>
          );
        })}
        <UserMenu />
      </div>
    </header>
  );
}
