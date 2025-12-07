-- Align auth tables with NextAuth pg-adapter column names (camelCase).
ALTER TABLE accounts
  RENAME COLUMN user_id TO "userId";

ALTER TABLE accounts
  RENAME COLUMN provider_account_id TO "providerAccountId";

ALTER TABLE sessions
  RENAME COLUMN session_token TO "sessionToken";

ALTER TABLE sessions
  RENAME COLUMN user_id TO "userId";
