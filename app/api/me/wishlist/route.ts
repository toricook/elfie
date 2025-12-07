export const dynamic = 'force-dynamic'; // ensure wishlist reads bypass static caching

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth.config';
import { getParticipantByUserAndGame, getWishlist, upsertWishlist } from '@/lib/db';

const noStoreHeaders = { 'Cache-Control': 'no-store' as const };

function invalidGameResponse() {
  return NextResponse.json({ error: 'Missing or invalid gameId' }, { status: 400, headers: noStoreHeaders });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = Number((session as any)?.user?.id);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders });
  }

  const url = new URL(request.url);
  const gameIdString = url.searchParams.get('gameId');
  const gameId = Number(gameIdString);
  if (!gameIdString || !Number.isInteger(gameId)) {
    return invalidGameResponse();
  }

  const participant = await getParticipantByUserAndGame(userId, gameId);
  if (!participant) {
    return NextResponse.json({ error: 'Participant not found for this game' }, { status: 404, headers: noStoreHeaders });
  }

  const wishlist = await getWishlist(participant.id);
  return NextResponse.json({ wishlist }, { headers: noStoreHeaders });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = Number((session as any)?.user?.id);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders });
  }

  const url = new URL(request.url);
  const gameIdString = url.searchParams.get('gameId');
  const gameId = Number(gameIdString);
  if (!gameIdString || !Number.isInteger(gameId)) {
    return invalidGameResponse();
  }

  const participant = await getParticipantByUserAndGame(userId, gameId);
  if (!participant) {
    return NextResponse.json({ error: 'Participant not found for this game' }, { status: 404, headers: noStoreHeaders });
  }

  const body = await request.json();
  const items = body.items;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'Items must be an array' }, { status: 400, headers: noStoreHeaders });
  }

  // Normalize to trimmed strings and drop empty rows so the DB always stores clean data
  const normalized = items
    .map((item: unknown) => String(item || '').trim())
    .filter((item: string) => item.length > 0);

  await upsertWishlist(participant.id, normalized);

  // Read back what we just saved to confirm persistence
  const saved = await getWishlist(participant.id);

  return NextResponse.json(
    { success: true, wishlist: saved },
    { headers: noStoreHeaders }
  );
}
