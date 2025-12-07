-- Baseline migration for existing schema: adds auth columns/tables without recreating existing tables.

-- Users: add password_hash and role if missing, then enforce default/not-null for role.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text;
UPDATE "users" SET "role" = 'member' WHERE "role" IS NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member';
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;

-- New tables for OAuth/local sessions.
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" integer,
	"scope" text,
	"token_type" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);

CREATE TABLE IF NOT EXISTS "game_admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL REFERENCES "games"("id") ON DELETE cascade,
	"user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Indexes/uniques for new tables.
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_provider_account_id_key" ON "accounts" USING btree ("provider","provider_account_id");
CREATE UNIQUE INDEX IF NOT EXISTS "game_admins_game_id_user_id_key" ON "game_admins" USING btree ("game_id","user_id");
