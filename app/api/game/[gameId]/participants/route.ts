import { NextResponse } from 'next/server';
import { getAllParticipants } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
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
    
    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}
