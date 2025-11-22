import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import crypto from 'crypto';
import { initDB, createGame, addParticipant, verifyParticipant, updateParticipantExclusion } from '@/lib/db';

const sql = postgres(process.env.DATABASE_URL!);

// Glee characters - 3 couples + 6 others
const characters = [
  // Couple 1
  { name: 'Rachel Berry', email: 'rachel@glee.com', exclusion: 'finn@glee.com' },
  { name: 'Finn Hudson', email: 'finn@glee.com', exclusion: 'rachel@glee.com' },
  
  // Couple 2
  { name: 'Kurt Hummel', email: 'kurt@glee.com', exclusion: 'blaine@glee.com' },
  { name: 'Blaine Anderson', email: 'blaine@glee.com', exclusion: 'kurt@glee.com' },
  
  // Couple 3
  { name: 'Santana Lopez', email: 'santana@glee.com', exclusion: 'brittany@glee.com' },
  { name: 'Brittany Pierce', email: 'brittany@glee.com', exclusion: 'santana@glee.com' },
  
  // Others
  { name: 'Will Schuester', email: 'will@glee.com', exclusion: null },
  { name: 'Sue Sylvester', email: 'sue@glee.com', exclusion: null },
  { name: 'Emma Pillsbury', email: 'emma@glee.com', exclusion: null },
  { name: 'Artie Abrams', email: 'artie@glee.com', exclusion: null },
  { name: 'Tina Cohen-Chang', email: 'tina@glee.com', exclusion: null },
  { name: 'Mercedes Jones', email: 'mercedes@glee.com', exclusion: null },
];

async function seedGlee() {
  console.log('🌱 Seeding Glee database...\n');
  
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await sql`DELETE FROM participants`;
    await sql`DELETE FROM games`;
    console.log('✓ Cleared existing data\n');
    
    // Initialize tables
    console.log('Initializing tables...');
    await initDB();
    console.log('✓ Tables initialized\n');
    
    // Create a game
    console.log('Creating game...');
    const gameId = await createGame('admin@glee.com');
    console.log(`✓ Created game with ID: ${gameId}\n`);
    
    // Add, verify, and set exclusions for all participants
    console.log('Adding participants...');
    const participantIds: { [email: string]: number } = {};
    const participantTokens: { [email: string]: string } = {};
    
    for (const character of characters) {
      const token = crypto.randomBytes(32).toString('hex');
      const participantId = await addParticipant(
        gameId,
        character.email,
        token,
        undefined, // no exclusion yet
        character.name
      );
      participantIds[character.email] = participantId;
      participantTokens[character.email] = token;
      console.log(`  ✓ Added ${character.name} (${character.email})`);
    }
    console.log('');
    
    // Verify all participants
    console.log('Verifying participants...');
    for (const character of characters) {
      const token = participantTokens[character.email];
      await verifyParticipant(token, character.name);
      console.log(`  ✓ Verified ${character.name}`);
    }
    console.log('');
    
    // Set exclusions for couples
    console.log('Setting exclusions for couples...');
    for (const character of characters) {
      if (character.exclusion) {
        await updateParticipantExclusion(participantIds[character.email], character.exclusion);
        const excludedName = characters.find(c => c.email === character.exclusion)?.name || character.exclusion;
        console.log(`  ✓ ${character.name} excludes ${excludedName}`);
      }
    }
    console.log('');
    
    console.log('✅ Database seeded successfully!');
    console.log(`\nGame ID: ${gameId}`);
    console.log(`Total participants: ${characters.length}`);
    console.log(`Verified participants: ${characters.length}`);
    console.log(`Couples with exclusions: 3`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

seedGlee();

