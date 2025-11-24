import { NextResponse } from 'next/server';
import { getAllParticipants } from '@/lib/db';
import { getAdminSession } from '@/lib/server-session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession?.admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { gameId: gameIdParam } = await params;
    if (!gameIdParam) {
      return NextResponse.json(
        { error: 'Missing game ID' },
        { status: 400 }
      );
    }

    const gameId = parseInt(gameIdParam);
    if (isNaN(gameId)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      );
    }
    const participants = await getAllParticipants(gameId);

    // Strip sensitive fields like verification tokens before returning
    const sanitized = participants.map((p: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { token, ...rest } = p;
      return rest;
    });

    return NextResponse.json({ participants: sanitized });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}
