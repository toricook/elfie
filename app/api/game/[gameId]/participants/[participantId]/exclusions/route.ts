import { NextResponse } from 'next/server';
import { updateParticipantExclusion, getGame, getAllParticipants } from '@/lib/db';

export async function PUT(
  request: Request,
  context: { params: Promise<{ gameId: string; participantId: string }> }
) {
  try {
    const { gameId: gameIdRaw, participantId: participantIdRaw } = await context.params;
    const gameId = Number(gameIdRaw);
    const participantId = Number(participantIdRaw);
    
    if (!Number.isInteger(gameId) || !Number.isInteger(participantId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
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
    
    const { exclusion_email } = await request.json();
    
    // Validate exclusion_email is either null or a string
    if (exclusion_email !== null && exclusion_email !== undefined && typeof exclusion_email !== 'string') {
      return NextResponse.json(
        { error: 'Exclusion email must be a string or null' },
        { status: 400 }
      );
    }
    
    // Verify participant exists and is in this game
    const participants = await getAllParticipants(gameId);
    const participant = participants.find(p => p.id === participantId);
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    // Update exclusion
    await updateParticipantExclusion(participantId, exclusion_email || null);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating exclusions:', error);
    return NextResponse.json(
      { error: 'Failed to update exclusions' },
      { status: 500 }
    );
  }
}

