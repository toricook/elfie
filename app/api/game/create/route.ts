import { NextResponse } from 'next/server';
import { createGame } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { admin_email } = await request.json();
    
    // Basic validation
    if (!admin_email || !admin_email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
    }
    
    const gameId = await createGame(admin_email);
    
    return NextResponse.json({ game_id: gameId });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}