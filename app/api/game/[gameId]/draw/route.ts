import { NextResponse } from 'next/server';
import { getVerifiedParticipants, assignSecretSanta, updateGameStatus, getGame } from '@/lib/db';
import { sendDrawNotificationEmail } from '@/lib/email';
import { createSecretSantaAssignments, type Player } from '@/lib/assignment';

export async function POST(
  request: Request,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId: gameIdRaw } = await context.params;
    const gameId = Number(gameIdRaw);
    
    if (!Number.isInteger(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
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
        { error: 'Game has already been drawn' },
        { status: 400 }
      );
    }
    
    // Get verified participants
    const participants = await getVerifiedParticipants(gameId);
    
    // Need at least 2 participants (assignment library requirement)
    if (participants.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 verified participants to draw' },
        { status: 400 }
      );
    }
    
    // Convert participants to Player format using participant IDs to keep uniqueness
    const players: Player[] = participants.map((p) => ({
      name: String(p.id),
      exclusions: p.exclusion_participant_id ? [String(p.exclusion_participant_id)] : [],
    }));

    // Generate assignments
    const assignments = createSecretSantaAssignments(players);
    
    if (!assignments) {
      return NextResponse.json(
        { error: 'Unable to create valid assignments. Please check participant exclusions.' },
        { status: 400 }
      );
    }
    
    // Save assignments to database
    for (const assignment of assignments) {
      const giverId = Number(assignment.giver);
      const receiverId = Number(assignment.receiver);
      await assignSecretSanta(giverId, receiverId);
    }
    
    // Update game status
    await updateGameStatus(gameId, 'drawn');

    // Notify participants that the draw is complete and re-send their magic links
    const notifications = await Promise.allSettled(
      participants.map((p) =>
        sendDrawNotificationEmail(
          p.email as string,
          p.token as string,
          (p.display_name as string) || (p.email as string)
        )
      )
    );
    
    // Map assignments back to display names for response
    const idToDisplayName = new Map<number, string>();
    participants.forEach((p) => {
      const name = (p.display_name as string) || p.email;
      idToDisplayName.set(p.id as number, name);
    });

    const assignmentsWithNames = assignments.map((a) => {
      const giverName = idToDisplayName.get(Number(a.giver)) || a.giver;
      const receiverName = idToDisplayName.get(Number(a.receiver)) || a.receiver;
      return { giver: giverName, receiver: receiverName };
    });

    const failedNotifications = notifications
      .map((result, idx) => (result.status === 'rejected' ? participants[idx].email : null))
      .filter((email): email is string => Boolean(email));

    return NextResponse.json({ 
      success: true,
      assignments_count: assignments.length,
      assignments: assignmentsWithNames,
      notification_errors: failedNotifications.length ? failedNotifications : undefined
    });
  } catch (error) {
    console.error('Error drawing names:', error);
    return NextResponse.json(
      { error: 'Failed to draw names' },
      { status: 500 }
    );
  }
}

