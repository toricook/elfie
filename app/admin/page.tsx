'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type Participant = {
  id: number;
  email: string;
  verified: boolean;
  display_name: string | null;
  exclusion_email: string | null;
  created_at: string;
};

export default function AdminPage() {
  const searchParams = useSearchParams();
  const [gameId, setGameId] = useState<number>(() => {
    const paramId = parseInt(searchParams.get('game') || '', 10);
    return Number.isNaN(paramId) ? 1 : paramId;
  });
  const [email, setEmail] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [editingExclusionsFor, setEditingExclusionsFor] = useState<number | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [gameDrawn, setGameDrawn] = useState(false);

  const verifiedCount = participants.filter(p => p.verified).length;
  const canDraw = verifiedCount >= 3;

  useEffect(() => {
    const paramId = parseInt(searchParams.get('game') || '', 10);
    const normalizedId = Number.isNaN(paramId) ? 1 : paramId;
    setGameId(current => (current === normalizedId ? current : normalizedId));
  }, [searchParams]);

  useEffect(() => {
    loadParticipants();
  }, [gameId]);

  const loadParticipants = async () => {
    const res = await fetch(`/api/game/${gameId}/participants`);
    const data = await res.json();
    const participants = data.participants || [];
    setParticipants(participants);
    
    // Check if game has been drawn by checking if any participant has an assignment
    const hasAssignments = participants.some((p: any) => p.assigned_to_email);
    setGameDrawn(hasAssignments);
  };

  const invite = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email');
      return;
    }

    setLoading(true);
    setDrawError(null); // Clear draw error on any change
    try {
      const res = await fetch(`/api/game/${gameId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(`Invited! Send this link:\n${data.verification_link}`);
        setEmail('');
        loadParticipants();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to invite');
    } finally {
      setLoading(false);
    }
  };

  const drawNames = async () => {
    if (!confirm(`Draw names for ${verifiedCount} participants?`)) {
      return;
    }

    setDrawing(true);
    setDrawError(null);
    try {
      const res = await fetch(`/api/game/${gameId}/draw`, {
        method: 'POST',
      });

      const data = await res.json();
      
      if (res.ok) {
        // Print assignments to console
        console.log('Secret Santa Assignments:');
        if (data.assignments) {
          data.assignments.forEach((a: { giver: string; receiver: string }) => {
            console.log(`  ${a.giver} → ${a.receiver}`);
          });
        }
        setGameDrawn(true);
        loadParticipants(); // Refresh to get updated status
      } else {
        // Show error message that persists
        setDrawError(data.error || 'Failed to create assignments');
      }
    } catch (error) {
      setDrawError('Failed to draw names');
    } finally {
      setDrawing(false);
    }
  };

  const updateExclusion = async (participantId: number, exclusionEmail: string | null) => {
    // Optimistic update - update UI immediately
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, exclusion_email: exclusionEmail } : p
    ));
    setDrawError(null); // Clear draw error on any change

    try {
      const res = await fetch(`/api/game/${gameId}/participants/${participantId}/exclusions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclusion_email: exclusionEmail }),
      });

      if (res.ok) {
        // Sync with server to ensure consistency
        loadParticipants();
      } else {
        // Revert on error
        const data = await res.json();
        loadParticipants();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      // Revert on error
      loadParticipants();
      alert('Failed to update exclusion');
    }
  };

  const verifiedParticipants = participants.filter(p => p.verified);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Secret Santa Admin</h1>

        {/* Invite Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Invite Participant</h2>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && invite()}
            />
            <button
              onClick={invite}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </div>

        {/* Participants List */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Participants ({verifiedCount} verified)
          </h2>
          
          {participants.length === 0 ? (
            <p className="text-gray-500">No participants yet</p>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    {p.verified && p.display_name ? (
                      <div>
                        <span className="font-medium">{p.display_name}</span>
                        <span className="text-gray-500 text-sm ml-2">({p.email})</span>
                      </div>
                    ) : (
                      <span className="font-medium">{p.email}</span>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      p.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {p.verified ? '✓ Verified' : '⏳ Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exclusions Section */}
        {verifiedParticipants.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Exclusions</h2>
            <p className="text-gray-600 text-sm mb-4">
              Set who each player cannot give gifts to
            </p>
            
            <div className="space-y-4">
              {verifiedParticipants.map((participant) => {
                const currentExclusion = participant.exclusion_email;
                const isEditing = editingExclusionsFor === participant.id;
                
                return (
                  <div key={participant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">
                          {participant.display_name || participant.email}
                        </span>
                        {!isEditing && currentExclusion && (
                          <span className="text-gray-500 text-sm ml-2">
                            (excludes {verifiedParticipants.find(p => p.email === currentExclusion)?.display_name || currentExclusion})
                          </span>
                        )}
                        {!isEditing && !currentExclusion && (
                          <span className="text-gray-500 text-sm ml-2">
                            (no exclusion)
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingExclusionsFor(isEditing ? null : participant.id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {isEditing ? 'Done' : 'Edit'}
                      </button>
                    </div>
                    
                    {isEditing && (
                      <div className="mt-3">
                        <select
                          value={currentExclusion || ''}
                          onChange={(e) => {
                            const exclusionEmail = e.target.value || null;
                            updateExclusion(participant.id, exclusionEmail);
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">No exclusion</option>
                          {verifiedParticipants
                            .filter(p => p.id !== participant.id)
                            .map((other) => (
                              <option key={other.id} value={other.email}>
                                {other.display_name || other.email}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Draw Button */}
        {gameDrawn ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Draw Names</h2>
            <p className="text-gray-600">
              Names have already been drawn for this game.
            </p>
            <a
              href={`/admin/results?game=${gameId}`}
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              View Results →
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Draw Names</h2>
            <p className="text-gray-600 mb-4">
              {canDraw 
                ? `Ready to draw names for ${verifiedCount} participants!`
                : `Need at least 3 verified participants (currently ${verifiedCount})`
              }
            </p>
            <button
              onClick={drawNames}
              disabled={!canDraw || drawing}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-semibold"
            >
              {drawing ? 'Drawing...' : '🎁 Draw Names'}
            </button>
            {drawError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ {drawError}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
