import { getParticipantByToken } from '@/lib/db';

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
          <p>No verification token provided.</p>
        </div>
      </div>
    );
  }

  const participant = await getParticipantByToken(token);

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Token</h1>
          <p>This verification link is invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (participant.verified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verified</h1>
          <p>You're signed up for Secret Santa!</p>
          <p className="mt-2 text-gray-600">
            You'll receive an email with your assignment after the draw.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Join Secret Santa?</h1>
        <p className="mb-2">You've been invited to participate!</p>
        <p className="text-gray-600 mb-6">Email: {participant.email}</p>

        <form action={`/api/verify/${token}`} method="POST" className="space-y-4">
          <div className="text-left">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              required
              placeholder="Enter your name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be your display name for the Secret Santa game
            </p>
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition w-full"
          >
            Yes, I'm In!
          </button>
        </form>
      </div>
    </div>
  );
}
