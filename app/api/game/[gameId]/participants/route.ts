import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth.config';
import { getAllParticipants, isGameAdmin } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = Number((session as any)?.user?.id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const isSuperAdmin = ((session as any).user as any)?.role === 'superadmin';
    const allowed = isSuperAdmin || (await isGameAdmin(userId, gameId));
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
