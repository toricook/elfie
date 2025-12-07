import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { Pool } from 'pg';

// Simple signup endpoint: creates a user with email/password hash if not existing.
// Expects JSON: { email, password, displayName? }
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body?.email as string | undefined)?.toLowerCase().trim();
    const password = body?.password as string | undefined;
    const displayName = (body?.displayName as string | undefined)?.trim() || null;

    if (!email || !email.includes('@') || !password || password.length < 8) {
      return NextResponse.json({ error: 'Email and password (min 8 chars) required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const existing = await client.query('select id from users where email = $1', [email]);
      if (existing.rows[0]) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }

      const passwordHash = await hash(password, 10);
      const inserted = await client.query(
        'insert into users (email, password_hash, display_name, role) values ($1, $2, $3, $4) returning id, email, role',
        [email, passwordHash, displayName, 'member']
      );

      return NextResponse.json({ user: inserted.rows[0] }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Signup error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
