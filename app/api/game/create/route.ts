import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth.config';
import { addGameAdmin, createGame } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = Number((session as any)?.user?.id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const emailFromBody = (body as any)?.admin_email as string | undefined;
    const adminEmail =
      ((session as any)?.user as any)?.email ||
      (typeof emailFromBody === 'string' ? emailFromBody : undefined);

    // Basic validation
    if (!adminEmail || !adminEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
    }
    
    const gameId = await createGame(adminEmail);
    await addGameAdmin(gameId, userId, 'admin');

    return NextResponse.json({ game_id: gameId });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}
