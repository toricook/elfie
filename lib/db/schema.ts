import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uniqueIndex, foreignKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
});

export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  adminEmail: text('admin_email').notNull(),
  status: text('status').notNull().default('setup'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
});

export const participants = pgTable('participants', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  verified: boolean('verified').notNull().default(false),
  assignedToParticipantId: integer('assigned_to_participant_id'),
  exclusionParticipantId: integer('exclusion_participant_id'),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
}, (table) => {
  return {
    gameUserUnique: uniqueIndex('participants_game_id_user_id_key').on(table.gameId, table.userId),
    assignedFk: foreignKey({
      name: 'participants_assigned_to_participant_id_fkey',
      columns: [table.assignedToParticipantId],
      foreignColumns: [table.id],
    }).onDelete('set null'),
    exclusionFk: foreignKey({
      name: 'participants_exclusion_participant_id_fkey',
      columns: [table.exclusionParticipantId],
      foreignColumns: [table.id],
    }).onDelete('set null'),
  };
});

export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  participantId: integer('participant_id')
    .notNull()
    .unique()
    .references(() => participants.id, { onDelete: 'cascade' }),
  items: jsonb('items').notNull().default(JSON.stringify([])),
  updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at'),
  scope: text('scope'),
  tokenType: text('token_type'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
}, (table) => ({
  providerAccountUnique: uniqueIndex('accounts_provider_provider_account_id_key').on(
    table.provider,
    table.providerAccountId
  ),
}));

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: false }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
});

export const gameAdmins = pgTable('game_admins', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
}, (table) => ({
  gameUserUnique: uniqueIndex('game_admins_game_id_user_id_key').on(table.gameId, table.userId),
}));
