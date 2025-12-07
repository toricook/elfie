// NextAuth v4 configuration: defines providers, adapters, and session shaping.
import { type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Shared Postgres pool for the adapter and credential checks.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export const authOptions: NextAuthOptions = {
  adapter: PostgresAdapter(pool),
  session: { strategy: 'database' },
  providers: (() => {
    const providers: NextAuthOptions['providers'] = [
      Credentials({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;
          const client = await pool.connect();
          try {
            const result = await client.query(
              'select id, email, password_hash, role from users where email = $1 limit 1',
              [credentials.email.toLowerCase()]
            );
            const user = result.rows[0];
            if (!user?.password_hash) return null;
            const valid = await bcrypt.compare(credentials.password, user.password_hash);
            if (!valid) return null;
            return { id: String(user.id), email: user.email, role: user.role };
          } finally {
            client.release();
          }
        },
      }),
    ];

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      providers.push(
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          // Allow linking to an existing account when emails match.
          allowDangerousEmailAccountLinking: true,
        })
      );
    }

    return providers;
  })(),
  callbacks: {
    async signIn({ user, account, profile }) {
      // Auto-link Google logins to existing users by email if not already linked.
      if (account?.provider === 'google' && profile?.email) {
        const email = (profile.email as string).toLowerCase();
        const client = await pool.connect();
        try {
          const existingUser = await client.query('select id from users where email = $1 limit 1', [email]);
          if (existingUser.rows[0]) {
            // Check if an account row already exists; if not, insert one.
            const existingAccount = await client.query(
              'select 1 from accounts where provider = $1 and "providerAccountId" = $2 limit 1',
              [account.provider, account.providerAccountId]
            );
            if (!existingAccount.rows[0]) {
              await client.query(
                `insert into accounts
                  ("userId", provider, "providerAccountId", access_token, refresh_token, expires_at, scope, token_type)
                  values ($1, $2, $3, $4, $5, $6, $7, $8)
                  on conflict do nothing`,
                [
                  existingUser.rows[0].id,
                  account.provider,
                  account.providerAccountId,
                  (account as any).access_token ?? null,
                  (account as any).refresh_token ?? null,
                  (account as any).expires_at ?? null,
                  (account as any).scope ?? null,
                  (account as any).token_type ?? null,
                ]
              );
            }
            // Force NextAuth to use the existing user id for the session.
            (user as any).id = existingUser.rows[0].id;
          }
        } finally {
          client.release();
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (user) {
        (session as any).user.id = String((user as any).id);
        (session as any).user.role = (user as any).role ?? 'member';
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};
