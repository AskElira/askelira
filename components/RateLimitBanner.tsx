'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface UsageData {
  count: number;
  limit: number | 'unlimited';
  tier: string;
  remaining: number | 'unlimited';
}

export default function RateLimitBanner() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/usage?email=${encodeURIComponent(session.user.email)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) {
            setUsage(data);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  if (!usage || usage.limit === 'unlimited') return null;

  const atLimit = usage.count >= (usage.limit as number);
  const nearLimit = usage.count >= (usage.limit as number) * 0.75;

  return (
    <div
      style={{
        padding: '0.625rem 1.25rem',
        fontSize: '0.8125rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        background: atLimit
          ? 'rgba(248, 113, 113, 0.1)'
          : nearLimit
            ? 'rgba(250, 204, 21, 0.1)'
            : 'rgba(99, 102, 241, 0.08)',
        borderBottom: `1px solid ${atLimit ? 'rgba(248, 113, 113, 0.3)' : nearLimit ? 'rgba(250, 204, 21, 0.3)' : 'var(--border)'}`,
        color: atLimit ? 'var(--red)' : nearLimit ? 'var(--yellow)' : '#9ca3af',
      }}
    >
      <span>
        {usage.count} of {usage.limit} debates used this month
      </span>
      {(atLimit || nearLimit) && (
        <a
          href="/upgrade"
          style={{
            color: 'var(--accent)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Upgrade to Pro &rarr;
        </a>
      )}
    </div>
  );
}
