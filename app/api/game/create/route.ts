import { NextResponse } from 'next/server';
import { createGame } from '@/lib/db';
import { getAdminSession } from '@/lib/server-session';

export async function POST(request: Request) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
