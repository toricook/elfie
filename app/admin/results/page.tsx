import { getAllParticipants } from '@/lib/db';

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const params = await searchParams;
  const gameId = parseInt(params.game || '', 10) || 1;
  const participants = await getAllParticipants(gameId);

  const assignments = participants.filter((p) => p.assigned_to_email);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Secret Santa Assignments</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <p className="text-red-600 font-semibold mb-4">
            Psst! Keep this page secret! Don&apos;t show participants!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Assignments ({assignments.length})
          </h2>

          <div className="space-y-3">
            {assignments.map((p) => {
              // Find the receiver's display name
              const receiver = participants.find(part => part.email === p.assigned_to_email);
              const receiverName = receiver?.display_name || p.assigned_to_email;
              const giverName = p.display_name || p.email;
              
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{giverName}</span>
                  <span className="text-gray-400">-&gt;</span>
                  <span className="font-medium text-green-600">
                    {receiverName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href={`/admin?game=${gameId}`}
            className="text-blue-600 hover:underline"
          >
            Back to Admin
          </a>
        </div>
      </div>
    </div>
  );
}
