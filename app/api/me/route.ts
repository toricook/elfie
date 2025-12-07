export const dynamic = 'force-dynamic'; // always read fresh data for /api/me

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth.config';
import { getParticipantById, getParticipantByUserAndGame, getWishlist } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = Number((session as any)?.user?.id);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const url = new URL(request.url);
  const gameIdString = url.searchParams.get('gameId');
  const gameId = Number(gameIdString);

  if (!gameIdString || !Number.isInteger(gameId)) {
    return NextResponse.json({ error: 'Missing or invalid gameId' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const participant = await getParticipantByUserAndGame(userId, gameId);
  if (!participant) {
    return NextResponse.json({ error: 'Participant not found for this game' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const receiver = participant.assigned_to_participant_id
    ? await getParticipantById(participant.assigned_to_participant_id)
    : null;

  const wishlist = await getWishlist(participant.id);

  const sanitize = (p: any) =>
    p && {
      id: p.id,
      email: p.email,
      display_name: p.display_name,
      verified: p.verified,
      assigned_to_participant_id: p.assigned_to_participant_id,
      exclusion_participant_id: p.exclusion_participant_id,
      game_id: p.game_id,
    };

  return NextResponse.json(
    {
      participant: sanitize(participant),
      receiver: sanitize(receiver),
      wishlist,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
