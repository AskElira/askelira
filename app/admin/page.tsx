import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@vercel/postgres';
import { redirect } from 'next/navigation';

// Force dynamic rendering (server-side only)
export const dynamic = 'force-dynamic';

interface SystemHealth {
  totalGoals: number;
  activeBuildings: number;
  completed: number;
  blocked: number;
}

interface RevenueStats {
  activeSubscriptions: number;
  totalFloors: number;
  estimatedMRR: number;
}

interface IntelligenceStats {
  totalPatterns: number;
  provenPatterns: number;
  categories: number;
  lastScrape: string | null;
}

interface RecentLog {
  agentName: string;
  action: string;
  outputSummary: string | null;
  timestamp: string;
}

async function getSystemHealth(): Promise<SystemHealth> {
  try {
    const { rows } = await sql`
      SELECT
        COUNT(*)::int AS total_goals,
        COUNT(*) FILTER (WHERE status = 'building')::int AS active_buildings,
        COUNT(*) FILTER (WHERE status = 'goal_met')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'blocked')::int AS blocked
      FROM goals
    `;
    const r = rows[0];
    return {
      totalGoals: (r.total_goals as number) ?? 0,
      activeBuildings: (r.active_buildings as number) ?? 0,
      completed: (r.completed as number) ?? 0,
      blocked: (r.blocked as number) ?? 0,
    };
  } catch {
    return { totalGoals: 0, activeBuildings: 0, completed: 0, blocked: 0 };
  }
}

async function getRevenueStats(): Promise<RevenueStats> {
  try {
    const { rows } = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_subs,
        COALESCE(SUM(floors_active) FILTER (WHERE status = 'active'), 0)::int AS total_floors
      FROM subscriptions
    `;
    const r = rows[0];
    const activeSubs = (r.active_subs as number) ?? 0;
    const totalFloors = (r.total_floors as number) ?? 0;
    return {
      activeSubscriptions: activeSubs,
      totalFloors,
      estimatedMRR: totalFloors * 49, // $49/floor/month
    };
  } catch {
    return { activeSubscriptions: 0, totalFloors: 0, estimatedMRR: 0 };
  }
}

async function getIntelligenceStats(): Promise<IntelligenceStats> {
  try {
    const { rows } = await sql`
      SELECT
        COUNT(*)::int AS total_patterns,
        COUNT(*) FILTER (WHERE confidence >= 0.7 AND success_count > 0)::int AS proven_patterns,
        COUNT(DISTINCT category)::int AS categories
      FROM automation_patterns
    `;
    const r = rows[0];

    // Get last scrape time
    let lastScrape: string | null = null;
    try {
      const { rows: logRows } = await sql`
        SELECT timestamp FROM agent_logs
        WHERE action = 'scrape_category'
        ORDER BY timestamp DESC
        LIMIT 1
      `;
      if (logRows.length > 0) {
        lastScrape = new Date(logRows[0].timestamp as string).toISOString();
      }
    } catch {
      // no scrape logs
    }

    return {
      totalPatterns: (r.total_patterns as number) ?? 0,
      provenPatterns: (r.proven_patterns as number) ?? 0,
      categories: (r.categories as number) ?? 0,
      lastScrape,
    };
  } catch {
    return { totalPatterns: 0, provenPatterns: 0, categories: 0, lastScrape: null };
  }
}

async function getRecentActivity(): Promise<RecentLog[]> {
  try {
    const { rows } = await sql`
      SELECT agent_name, action, output_summary, timestamp
      FROM agent_logs
      ORDER BY timestamp DESC
      LIMIT 10
    `;
    return rows.map((r) => ({
      agentName: r.agent_name as string,
      action: r.action as string,
      outputSummary: (r.output_summary as string | null)?.slice(0, 120) ?? null,
      timestamp: new Date(r.timestamp as string).toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  // Auth check
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return (
      <div style={{ maxWidth: '48rem', margin: '4rem auto', padding: '0 1rem', color: '#f87171' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Admin Dashboard
        </h1>
        <p>ADMIN_EMAIL environment variable is not set. Access denied.</p>
      </div>
    );
  }

  if (!session?.user?.email || session.user.email !== adminEmail) {
    return (
      <div style={{ maxWidth: '48rem', margin: '4rem auto', padding: '0 1rem', color: '#f87171' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          403 - Forbidden
        </h1>
        <p>You do not have access to the admin dashboard.</p>
      </div>
    );
  }

  // Load all stats in parallel
  const [health, revenue, intelligence, activity] = await Promise.all([
    getSystemHealth(),
    getRevenueStats(),
    getIntelligenceStats(),
    getRecentActivity(),
  ]);

  const statCardStyle = {
    padding: '1rem',
    background: 'var(--surface, #1a1a2e)',
    border: '1px solid var(--border, #2a2a4a)',
    borderRadius: '0.5rem',
    flex: '1 1 0',
    minWidth: '140px',
  };

  const labelStyle = {
    fontSize: '0.6875rem',
    fontWeight: 600 as const,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const valueStyle = {
    fontSize: '1.5rem',
    fontWeight: 700 as const,
    color: '#fff',
    marginTop: '0.25rem',
  };

  return (
    <div
      style={{
        maxWidth: '56rem',
        margin: '0 auto',
        padding: '2rem 1rem 4rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.5rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
        Admin Dashboard
      </h1>

      {/* System Health */}
      <section>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          System Health
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={statCardStyle}>
            <div style={labelStyle}>Total Goals</div>
            <div style={valueStyle}>{health.totalGoals}</div>
          </div>
          <div style={statCardStyle}>
            <div style={labelStyle}>Active Buildings</div>
            <div style={{ ...valueStyle, color: '#2dd4bf' }}>{health.activeBuildings}</div>
          </div>
          <div style={statCardStyle}>
            <div style={labelStyle}>Completed</div>
            <div style={{ ...valueStyle, color: '#facc15' }}>{health.completed}</div>
          </div>
          <div style={statCardStyle}>
            <div style={labelStyle}>Blocked</div>
            <div style={{ ...valueStyle, color: '#f87171' }}>{health.blocked}</div>
          </div>
        </div>
      </section>

      {/* Revenue */}
      <section>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Revenue
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={statCardStyle}>
            <div style={labelStyle}>Active Subscriptions</div>
            <div style={valueStyle}>{revenue.activeSubscriptions}</div>
          </div>
          <div style={statCardStyle}>
            <div style={labelStyle}>Total Floors Billed</div>
            <div style={valueStyle}>{revenue.totalFloors}</div>
          </div>
          <div style={statCardStyle}>
            <div style={labelStyle}>Estimated MRR</div>
            <div style={{ ...valueStyle, color: '#4ade80' }}>${revenue.estimatedMRR}</div>
          </div>
        </div>
      </section>

      {/* Intelligence */}
      <section>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Intelligence
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={statCardStyle}>
            <div style={labelStyle}>Total Patterns</div>
            <div style={valueStyle}>{intelligence.totalPatterns}</div>
          </div>
          <div style={statCardStyle}>
            <div style={labelStyle}>Proven Patterns</div>
            <div style={{ ...valueStyle, color: '#4ade80' }}>{intelligence.provenPatterns}</div>
          </div>
          <div style={statCardStyle}>
            <div style={labelStyle}>Categories</div>
            <div style={valueStyle}>{intelligence.categories}</div>
          </div>
          <div style={statCardStyle}>
            <div style={labelStyle}>Last Scrape</div>
            <div style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '0.5rem' }}>
              {intelligence.lastScrape
                ? new Date(intelligence.lastScrape).toLocaleString()
                : 'Never'}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recent Activity
        </h2>
        <div
          style={{
            background: 'var(--surface, #1a1a2e)',
            border: '1px solid var(--border, #2a2a4a)',
            borderRadius: '0.5rem',
            overflow: 'hidden',
          }}
        >
          {activity.length === 0 ? (
            <div style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
              No recent activity
            </div>
          ) : (
            activity.map((log, i) => (
              <div
                key={`${log.timestamp}-${i}`}
                style={{
                  padding: '0.625rem 1rem',
                  borderBottom: i < activity.length - 1 ? '1px solid var(--border, #2a2a4a)' : 'none',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#a855f7',
                    minWidth: '4.5rem',
                    flexShrink: 0,
                  }}
                >
                  {log.agentName}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#d1d5db',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {log.action}
                  {log.outputSummary ? ` -- ${log.outputSummary}` : ''}
                </span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
