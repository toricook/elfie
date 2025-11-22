import { initDB } from '@/lib/db';

async function setup() {
  console.log('Creating tables...');
  await initDB();
  console.log('✅ Database ready!');
  process.exit(0);
}

setup();