export const dynamic = 'force-dynamic'; // ensure this route is dynamic for NextAuth
export const runtime = 'nodejs'; // NextAuth requires Node runtime

import NextAuth from 'next-auth';
import { authOptions } from '@/auth.config';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
