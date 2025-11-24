import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// Initialize tables
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

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
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      verified BOOLEAN DEFAULT FALSE,
      assigned_to_participant_id INTEGER REFERENCES participants(id) ON DELETE SET NULL,
      exclusion_participant_id INTEGER REFERENCES participants(id) ON DELETE SET NULL,
      display_name TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (game_id, user_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS wishlists (
      id SERIAL PRIMARY KEY,
      participant_id INTEGER NOT NULL UNIQUE REFERENCES participants(id) ON DELETE CASCADE,
      items JSONB DEFAULT '[]',
      updated_at TIMESTAMP DEFAULT NOW()
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

// User helpers
export async function getOrCreateUser(email: string, displayName?: string) {
  const existing = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;
  if (existing[0]) {
    return existing[0];
  }

  const created = await sql`
    INSERT INTO users (email, display_name)
    VALUES (${email}, ${displayName || null})
    RETURNING *
  `;
  return created[0];
}

export async function updateUserDisplayName(userId: number, displayName: string) {
  await sql`
    UPDATE users
    SET display_name = ${displayName}
    WHERE id = ${userId}
  `;
}

// Participant functions
export async function addParticipant(
  gameId: number,
  email: string,
  token: string,
  exclusionParticipantId?: number | null,
  displayName?: string
) {
  const user = await getOrCreateUser(email, displayName);

  const result = await sql`
    INSERT INTO participants (
      game_id,
      user_id,
      email,
      token,
      exclusion_participant_id,
      display_name
    )
    VALUES (${gameId}, ${user.id}, ${email}, ${token}, ${exclusionParticipantId || null}, ${displayName || null})
    ON CONFLICT (game_id, user_id) DO UPDATE
    SET token = EXCLUDED.token,
        exclusion_participant_id = EXCLUDED.exclusion_participant_id
    RETURNING id
  `;

  return result[0].id;
}

export async function getParticipantByToken(token: string) {
  const result = await sql`
    SELECT p.*, u.display_name as user_display_name
    FROM participants p
    JOIN users u ON p.user_id = u.id
    WHERE p.token = ${token}
  `;
  return result[0];
}

export async function getParticipantByUserAndGame(userId: number, gameId: number) {
  const result = await sql`
    SELECT * FROM participants
    WHERE user_id = ${userId} AND game_id = ${gameId}
  `;
  return result[0];
}

export async function verifyParticipant(token: string, displayName?: string) {
  const result = await sql`
    UPDATE participants
    SET verified = TRUE, display_name = COALESCE(${displayName || null}, display_name)
    WHERE token = ${token}
    RETURNING id, email, game_id, user_id
  `;

  const participant = result[0];

  if (participant && displayName) {
    await updateUserDisplayName(participant.user_id, displayName);
  }

  return participant;
}

export async function getVerifiedParticipants(gameId: number) {
  const result = await sql`
    SELECT * FROM participants
    WHERE game_id = ${gameId} AND verified = TRUE
    ORDER BY created_at
  `;
  return result;
}

export async function assignSecretSanta(giverParticipantId: number, receiverParticipantId: number) {
  await sql`
    UPDATE participants
    SET assigned_to_participant_id = ${receiverParticipantId}
    WHERE id = ${giverParticipantId}
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

export async function updateParticipantExclusion(participantId: number, exclusionParticipantId: number | null) {
  await sql`
    UPDATE participants
    SET exclusion_participant_id = ${exclusionParticipantId}
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

export async function getParticipantById(participantId: number) {
  const result = await sql`
    SELECT * FROM participants WHERE id = ${participantId}
  `;
  return result[0];
}

// Wishlist helpers
export async function getWishlist(participantId: number) {
  const result = await sql`
    SELECT items FROM wishlists WHERE participant_id = ${participantId}
  `;
  return result[0]?.items ?? [];
}

export async function upsertWishlist(participantId: number, items: string[]) {
  await sql`
    INSERT INTO wishlists (participant_id, items)
    VALUES (${participantId}, ${sql.json(items)})
    ON CONFLICT (participant_id) DO UPDATE
    SET items = EXCLUDED.items,
        updated_at = NOW()
  `;
}
