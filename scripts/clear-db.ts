import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function clearDB() {
  console.log('Dropping all tables from database...');

  try {
    await sql`DROP TABLE IF EXISTS wishlists CASCADE`;
    await sql`DROP TABLE IF EXISTS participants CASCADE`;
    await sql`DROP TABLE IF EXISTS games CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    console.log('Dropped tables: wishlists, participants, games, users.');
    console.log('All tables dropped! Run "npm run setup-db" to recreate them.');
  } catch (error) {
    console.error('Error dropping tables:', error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

clearDB();
