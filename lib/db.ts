import { sql } from '@vercel/postgres';

export interface UserUsage {
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  debatesUsed: number;
}

export async function getUserUsage(email: string): Promise<UserUsage> {
  const { rows } = await sql`
    SELECT email, plan, debates_used
    FROM users
    WHERE email = ${email}
  `;

  if (rows.length === 0) {
    // Auto-create free tier user on first lookup
    await sql`
      INSERT INTO users (email, plan, debates_used)
      VALUES (${email}, 'free', 0)
    `;
    return { email, plan: 'free', debatesUsed: 0 };
  }

  return {
    email: rows[0].email,
    plan: rows[0].plan,
    debatesUsed: rows[0].debates_used,
  };
}

export async function incrementDebateCount(email: string): Promise<void> {
  await sql`
    UPDATE users
    SET debates_used = debates_used + 1
    WHERE email = ${email}
  `;
}
