# Elfie Secret Santa

Secret Santa organizer built on Next.js where an admin invites players with magic links, collects wishlists, enforces optional exclusions, and runs the draw that assigns gifters to recipients.

## Architecture
- **App Router UI**: `app/admin` (invite, exclusions, draw), `app/admin/results` (assignment matrix), `app/admin/login` (admin cookie), `app/verify` (magic link join flow), and `app/me` + `app/me/wishlist-editor` (participant portal and wishlist CRUD). Global styles live in `app/globals.css` using Tailwind v4.
- **API surface** (Next route handlers): `/api/admin/login` issues the admin session; `/api/game/[gameId]/invite` adds a participant + emails a magic link; `/api/game/[gameId]/participants` and `/api/game/[gameId]/participants/[participantId]/exclusions` read/update roster and exclusions; `/api/game/[gameId]/draw` runs the Secret Santa algorithm and notifies players; `/api/verify/[token]` verifies a participant and sets the session cookie; `/api/me` and `/api/me/wishlist` power the participant dashboard; `/api/auth/logout` clears cookies.
- **Data model** (`lib/db.ts`): Postgres tables for `users` (email + display name), `games` (admin-owned game with status), `participants` (per-game user membership with verification token, exclusions, and assignments), and `wishlists` (JSONB array per participant). Helper functions wrap inserts/updates and enforce uniqueness per game.
- **Auth/session**: `lib/auth.ts` signs and verifies HMAC-based session tokens; `lib/server-session.ts` reads/writes the `admin_session` and `participant_session` cookies in server context; `middleware.ts` protects admin and participant routes.
- **Email + magic links**: `lib/email.ts` configures Nodemailer (SMTP or JSON dev transport), builds magic links, and sends invite/draw-complete messages.
- **Draw engine**: `lib/assignment.ts` generates valid giver->receiver pairs with backtracking + validation of exclusions/self-matches. `/api/game/[gameId]/draw` maps participant IDs to assignments, persists them with `assignSecretSanta`, updates game status, and triggers notifications.

## Tech Stack
- Next.js 16 App Router with React 19 and TypeScript 5.
- Postgres via `postgres` client and `@vercel/postgres`; env loading with `dotenv`.
- Nodemailer for email delivery; Node `crypto` for tokens.
- Styling with Tailwind CSS v4 (via `@import "tailwindcss"`) plus custom CSS in `app/globals.css`.
- Tooling: `eslint` 9 config, scripts run with `tsx` (`setup-db`, `clear-db`, `seed-glee`).

## Key Modules
- `lib/db.ts`: initializes schema, creates games/participants, verifies players, stores exclusions and wishlists, and persists draw results.
- `lib/assignment.ts`: pure algorithm for Secret Santa pairings with shuffle/backtracking and validation helpers.
- `lib/auth.ts` / `lib/server-session.ts`: HMAC cookie sessions and helpers to read/set them inside Next server components/handlers.
- `lib/email.ts`: transport factory, magic link builder, and invite/draw email senders.
- `middleware.ts`: route protection for admin and participant areas.
- API handlers under `app/api/*`: encapsulate admin actions (login, invite, exclusions, draw), participant verification, wishlist CRUD, and logout.
- UI components/pages under `app/`: admin console (client component), participant dashboard with wishlist editor, verification page, and results view.
- `scripts/*.ts`: database setup/clear/seed utilities and `test-assignments.ts` to exercise the pairing algorithm.

