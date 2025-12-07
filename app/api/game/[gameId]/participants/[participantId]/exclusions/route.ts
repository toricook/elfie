import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth.config';
import { updateParticipantExclusion, getGame, getAllParticipants, isGameAdmin } from '@/lib/db';

export async function PUT(
  request: Request,
  context: { params: Promise<{ gameId: string; participantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = Number((session as any)?.user?.id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId: gameIdRaw, participantId: participantIdRaw } = await context.params;
    const gameId = Number(gameIdRaw);
    const participantId = Number(participantIdRaw);
    
    if (!Number.isInteger(gameId) || !Number.isInteger(participantId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    const isSuperAdmin = ((session as any).user as any)?.role === 'superadmin';
    const allowed = isSuperAdmin || (await isGameAdmin(userId, gameId));
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Check game exists
    const game = await getGame(gameId);
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // Check game hasn't been drawn yet
    if (game.status !== 'setup') {
      return NextResponse.json(
        { error: 'Cannot modify exclusions after draw' },
        { status: 400 }
      );
    }
    
    const { exclusion_participant_id } = await request.json();

    // Verify participant exists and is in this game
    const participants = await getAllParticipants(gameId);
    const participant = participants.find((p) => p.id === participantId);

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    if (
      exclusion_participant_id !== null &&
      exclusion_participant_id !== undefined &&
      typeof exclusion_participant_id !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Exclusion participant id must be a number or null' },
        { status: 400 }
      );
    }

    if (exclusion_participant_id) {
      const target = participants.find((p) => p.id === exclusion_participant_id);
      if (!target) {
        return NextResponse.json(
          { error: 'Exclusion participant not in this game' },
          { status: 400 }
        );
      }
      if (target.id === participantId) {
        return NextResponse.json(
          { error: 'Cannot exclude self' },
          { status: 400 }
        );
      }
    }

    await updateParticipantExclusion(participantId, exclusion_participant_id ?? null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating exclusions:', error);
    return NextResponse.json(
      { error: 'Failed to update exclusions' },
      { status: 500 }
    );
  }
}
