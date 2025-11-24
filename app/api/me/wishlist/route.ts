export const dynamic = 'force-dynamic'; // ensure wishlist reads bypass static caching

import { NextResponse } from 'next/server';
import { getParticipantSession } from '@/lib/server-session';
import { getWishlist, upsertWishlist } from '@/lib/db';

export async function GET() {
  const session = await getParticipantSession();
  if (!session?.participantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const wishlist = await getWishlist(session.participantId);
  return NextResponse.json({ wishlist }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  const session = await getParticipantSession();
  if (!session?.participantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const body = await request.json();
  const items = body.items;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'Items must be an array' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  // Normalize to trimmed strings and drop empty rows so the DB always stores clean data
  const normalized = items
    .map((item: unknown) => String(item || '').trim())
    .filter((item: string) => item.length > 0);

  console.log("Calling PUT wishlist with items " + items);

  await upsertWishlist(session.participantId, normalized);

  // Read back what we just saved to confirm persistence
  const saved = await getWishlist(session.participantId);

  return NextResponse.json(
    { success: true, wishlist: saved },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
