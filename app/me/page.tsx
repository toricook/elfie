// Force dynamic rendering so wishlist/assignment are always fresh per request
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth.config';
import { getParticipantById, getParticipantByUserAndGame, getWishlist } from '@/lib/db';
import WishlistEditor from './wishlist-editor';

export default async function MePage({ searchParams }: { searchParams: { gameId?: string } }) {
  const session = await getServerSession(authOptions);
  const userId = Number((session as any)?.user?.id);
  if (!userId) {
    redirect('/signin');
  }

  const gameIdRaw = searchParams?.gameId;
  const gameId = Number(gameIdRaw);
  if (!gameIdRaw || !Number.isInteger(gameId)) {
    redirect('/signin');
  }

  const participant = await getParticipantByUserAndGame(userId, gameId);
  if (!participant) {
    redirect('/signin');
  }

  const receiver = participant.assigned_to_participant_id
    ? await getParticipantById(participant.assigned_to_participant_id)
    : null;

  const myWishlist = (await getWishlist(participant.id)).map((item: any) => String(item));
  const receiverWishlist = receiver
    ? (await getWishlist(receiver.id)).map((item: any) => String(item))
    : [];

  const displayName = participant.display_name || participant.email;
  const receiverName = receiver ? receiver.display_name || receiver.email : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Hi {displayName}</h1>
            <p className="text-gray-600">Here&apos;s your Secret Santa info.</p>
          </div>
          <form
            action="/api/auth/signout"
            method="POST"
          >
            <button className="text-sm text-red-600 hover:underline" type="submit">
              Log out
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Your Assignment</h2>
          {receiver ? (
            <p className="text-gray-800">
              You are gifting to <span className="font-medium">{receiverName}</span>.
            </p>
          ) : (
            <p className="text-gray-600">Assignments haven&apos;t been drawn yet.</p>
          )}
        </div>

        <WishlistEditor initialItems={myWishlist} gameId={gameId} />

        {receiver && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">
              {receiverName}&apos;s Wishlist
            </h2>
            {receiverWishlist.length === 0 ? (
              <p className="text-gray-600">They haven&apos;t added anything yet.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-gray-800">
                {receiverWishlist.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
