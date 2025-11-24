import { cookies, headers } from 'next/headers';
import { participantCookieOptions as baseCookieOptions, verifySession, signSession } from './auth';

export const participantCookieOptions = baseCookieOptions;

export async function getParticipantSession() {
  // Next 16+ dynamic API returns a promise; unwrap it
  const cookieStore = await cookies();
  const token = cookieStore.get('participant_session')?.value;
  if (token) return verifySession(token);

  const hdrs = await headers();
  const rawCookie = hdrs.get('cookie') || '';
  const fallback = parseCookieHeader(rawCookie)['participant_session'];
  if (!fallback) return null;
  return verifySession(fallback);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (token) return verifySession(token);

  const hdrs = await headers();
  const rawCookie = hdrs.get('cookie') || '';
  const fallback = parseCookieHeader(rawCookie)['admin_session'];
  if (!fallback) return null;
  return verifySession(fallback);
}

export async function setParticipantSession(payload: {
  userId: number;
  participantId: number;
  gameId: number;
  email: string;
}) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set('participant_session', token, participantCookieOptions());
}

export async function setAdminSession() {
  const token = await signSession({ admin: true }, 60 * 60 * 24 * 7);
  const store = await cookies();
  store.set('admin_session', token, participantCookieOptions(60 * 60 * 24 * 7));
}

export function clearSessionCookies() {
  cookies().then((store) => {
    store.set('participant_session', '', { maxAge: 0, path: '/' });
    store.set('admin_session', '', { maxAge: 0, path: '/' });
  });
}

function parseCookieHeader(header: string): Record<string, string> {
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const eqIndex = part.indexOf('=');
      if (eqIndex === -1) return acc;
      const key = decodeURIComponent(part.slice(0, eqIndex).trim());
      const value = decodeURIComponent(part.slice(eqIndex + 1).trim());
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
}
