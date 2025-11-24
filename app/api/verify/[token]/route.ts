import { NextResponse } from 'next/server';
import { getParticipantByToken, verifyParticipant } from '@/lib/db';
import { participantCookieOptions, signSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.redirect(new URL('/verify', request.url));
  }

  const participant = await getParticipantByToken(token);
  if (!participant) {
    return NextResponse.redirect(new URL('/verify', request.url));
  }

  if (!participant.verified) {
    return NextResponse.redirect(new URL(`/verify?token=${token}`, request.url));
  }

  const session = await signSession({
    userId: participant.user_id,
    participantId: participant.id,
    gameId: participant.game_id,
    email: participant.email,
  });

  const response = NextResponse.redirect(new URL('/me', request.url));
  response.cookies.set('participant_session', session, participantCookieOptions());
  return response;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const displayName = formData.get('displayName') as string | null;

    if (!displayName || displayName.trim() === '') {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    const participant = await verifyParticipant(token, displayName.trim());
    if (!participant) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }
    
    // Redirect to success page
    const session = await signSession({
      userId: participant.user_id,
      participantId: participant.id,
      gameId: participant.game_id,
      email: participant.email,
    });

    const response = NextResponse.redirect(new URL(`/verify?token=${token}`, request.url));
    response.cookies.set('participant_session', session, participantCookieOptions());
    return response;
  } catch (error) {
    console.error('Error verifying participant:', error);
    return NextResponse.json(
      { error: 'Failed to verify participant' },
      { status: 500 }
    );
  }
}
