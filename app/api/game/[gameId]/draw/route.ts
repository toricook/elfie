import { NextResponse } from 'next/server';
import { getVerifiedParticipants, assignSecretSanta, updateGameStatus, getGame } from '@/lib/db';
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
    
    // Convert participants to Player format
    // Use display_name if available, otherwise fall back to email
    // Create a map of email -> display_name for exclusion matching
    const emailToDisplayName = new Map<string, string>();
    participants.forEach(p => {
      const displayName = (p.display_name as string) || p.email;
      emailToDisplayName.set(p.email, displayName);
    });
    
    const players: Player[] = participants.map(p => {
      const displayName = (p.display_name as string) || p.email;
      // Convert single exclusion email to array format for assignment library
      const exclusionEmail = (p.exclusion_email as string) || null;
      const exclusionNames = exclusionEmail 
        ? [emailToDisplayName.get(exclusionEmail) || exclusionEmail]
        : [];
      
      return {
        name: displayName,
        exclusions: exclusionNames
      };
    });
    
    // Generate assignments
    const assignments = createSecretSantaAssignments(players);
    
    if (!assignments) {
      return NextResponse.json(
        { error: 'Unable to create valid assignments. Please check participant exclusions.' },
        { status: 400 }
      );
    }
    
    // Save assignments to database
    // Map display names back to emails for database storage
    const displayNameToEmail = new Map<string, string>();
    participants.forEach(p => {
      const displayName = (p.display_name as string) || p.email;
      displayNameToEmail.set(displayName, p.email);
    });
    
    for (const assignment of assignments) {
      const giverEmail = displayNameToEmail.get(assignment.giver) || assignment.giver;
      const receiverEmail = displayNameToEmail.get(assignment.receiver) || assignment.receiver;
      await assignSecretSanta(giverEmail, receiverEmail);
    }
    
    // Update game status
    await updateGameStatus(gameId, 'drawn');
    
    // Map assignments back to display names for response
    const assignmentsWithNames = assignments.map(a => ({
      giver: a.giver,
      receiver: a.receiver
    }));
    
    return NextResponse.json({ 
      success: true,
      assignments_count: assignments.length,
      assignments: assignmentsWithNames
    });
  } catch (error) {
    console.error('Error drawing names:', error);
    return NextResponse.json(
      { error: 'Failed to draw names' },
      { status: 500 }
    );
  }
}

