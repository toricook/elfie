import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function clearDB() {
  console.log('Dropping all tables from database...');
  
  try {
    // Drop tables (CASCADE handles foreign key constraints)
    await sql`DROP TABLE IF EXISTS participants CASCADE`;
    console.log('✓ Dropped participants table');
    
    await sql`DROP TABLE IF EXISTS games CASCADE`;
    console.log('✓ Dropped games table');
    
    console.log('✅ All tables dropped! Run "npm run setup-db" or similar to recreate them.');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

clearDB();

