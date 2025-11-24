import { NextResponse } from 'next/server';
import { participantCookieOptions, signSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    let secret = '';
    try {
      const body = await request.json();
      secret = body?.secret;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return NextResponse.json(
        { error: 'ADMIN_SECRET not configured' },
        { status: 500 }
      );
    }

    if (!secret || secret !== adminSecret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    const session = await signSession({ admin: true }, 60 * 60 * 24 * 7);
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', session, participantCookieOptions(60 * 60 * 24 * 7));
    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Server error, check AUTH_SECRET/ADMIN_SECRET env vars' },
      { status: 500 }
    );
  }
}
