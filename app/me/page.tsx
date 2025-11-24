// Force dynamic rendering so wishlist/assignment are always fresh per request
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getParticipantById, getWishlist } from '@/lib/db';
import { getParticipantSession } from '@/lib/server-session';
import WishlistEditor from './wishlist-editor';

export default async function MePage() {
  const session = await getParticipantSession();
  if (!session?.participantId) {
    redirect('/verify');
  }

  const participant = session.participantId
    ? await getParticipantById(session.participantId)
    : null;

  if (!participant) {
    redirect('/verify');
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
          <form action="/api/auth/logout" method="POST">
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

        <WishlistEditor initialItems={myWishlist} />

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
