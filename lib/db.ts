import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!)

// Initialize tables
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      admin_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'setup',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      verified BOOLEAN DEFAULT FALSE,
      assigned_to_email TEXT,
      exclusion_email TEXT,
      display_name TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// Game functions
export async function createGame(adminEmail: string) {
  const result = await sql`
    INSERT INTO games (admin_email, status)
    VALUES (${adminEmail}, 'setup')
    RETURNING id
  `;
  return result[0].id;
}

export async function getGame(gameId: number) {
  const result = await sql`
    SELECT * FROM games WHERE id = ${gameId}
  `;
  return result[0];
}

// Participant functions
export async function addParticipant(
  gameId: number, 
  email: string, 
  token: string, 
  exclusionEmail?: string,
  displayName?: string
) {
  const result = await sql`
    INSERT INTO participants (game_id, email, token, exclusion_email, display_name)
    VALUES (${gameId}, ${email}, ${token}, ${exclusionEmail || null}, ${displayName || null})
    RETURNING id
  `;
  return result[0].id;
}

export async function verifyParticipant(token: string, displayName?: string) {
  if (displayName) {
    const result = await sql`
      UPDATE participants
      SET verified = TRUE, display_name = ${displayName}
      WHERE token = ${token}
      RETURNING id, email, game_id
    `;
    return result[0];
  } else {
    const result = await sql`
      UPDATE participants
      SET verified = TRUE
      WHERE token = ${token}
      RETURNING id, email, game_id
    `;
    return result[0];
  }
}

export async function getParticipantByToken(token: string) {
  const result = await sql`
    SELECT * FROM participants WHERE token = ${token}
  `;
  return result[0];
}

export async function getVerifiedParticipants(gameId: number) {
  const result = await sql`
    SELECT * FROM participants
    WHERE game_id = ${gameId} AND verified = TRUE
  `;
  return result;
}

export async function assignSecretSanta(email: string, assignedTo: string) {
  await sql`
    UPDATE participants
    SET assigned_to_email = ${assignedTo}
    WHERE email = ${email}
  `;
}

export async function updateGameStatus(gameId: number, status: string) {
  await sql`
    UPDATE games
    SET status = ${status}
    WHERE id = ${gameId}
  `;
}

export async function getAllParticipants(gameId: number) {
  const result = await sql`
    SELECT * FROM participants
    WHERE game_id = ${gameId}
    ORDER BY created_at
  `;
  return result;
}

export async function updateParticipantExclusion(participantId: number, exclusionEmail: string | null) {
  await sql`
    UPDATE participants
    SET exclusion_email = ${exclusionEmail}
    WHERE id = ${participantId}
  `;
}

export async function updateParticipantDisplayName(participantId: number, displayName: string) {
  await sql`
    UPDATE participants
    SET display_name = ${displayName}
    WHERE id = ${participantId}
  `;
}