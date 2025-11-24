import { NextResponse } from 'next/server';
import { addParticipant, getGame } from '@/lib/db';
import { buildMagicLink, sendMagicLinkEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(
  request: Request,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId: gameIdRaw } = await context.params;
    const { email } = await request.json();

    const gameId = Number(gameIdRaw);
    if (!Number.isInteger(gameId)) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 });
    }
    
    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
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
        { error: 'Cannot add participants after draw' },
        { status: 400 }
      );
    }
    
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Add participant
    const participantId = await addParticipant(gameId, email, token);
    
    // Send email with verification link
    const verificationLink = buildMagicLink(token);
    try {
      await sendMagicLinkEmail(email, token);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return NextResponse.json(
        { error: 'Failed to send invitation email', verification_link: verificationLink },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      participant_id: participantId,
      verification_link: verificationLink // For testing
    });
  } catch (error) {
    console.error('Error inviting participant:', error);
    return NextResponse.json(
      { error: 'Failed to invite participant' },
      { status: 500 }
    );
  }
}
