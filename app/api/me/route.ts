export const dynamic = 'force-dynamic'; // always read fresh data for /api/me

import { NextResponse } from 'next/server';
import { getParticipantById, getWishlist } from '@/lib/db';
import { getParticipantSession } from '@/lib/server-session';

export async function GET() {
  const session = await getParticipantSession();
  if (!session?.participantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const participant = await getParticipantById(session.participantId);
  if (!participant) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
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
