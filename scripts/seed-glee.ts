import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import crypto from 'crypto';
import {
  initDB,
  createGame,
  addParticipant,
  verifyParticipant,
  updateParticipantExclusion,
  upsertWishlist,
} from '@/lib/db';

const sql = postgres(process.env.DATABASE_URL!);

const characters = [
  { name: 'Rachel Berry', email: 'rachel@glee.com', exclusion: 'finn@glee.com' },
  { name: 'Finn Hudson', email: 'finn@glee.com', exclusion: 'rachel@glee.com' },
  { name: 'Kurt Hummel', email: 'kurt@glee.com', exclusion: 'blaine@glee.com' },
  { name: 'Blaine Anderson', email: 'blaine@glee.com', exclusion: 'kurt@glee.com' },
  { name: 'Santana Lopez', email: 'santana@glee.com', exclusion: 'brittany@glee.com' },
  { name: 'Brittany Pierce', email: 'brittany@glee.com', exclusion: 'santana@glee.com' },
  { name: 'Will Schuester', email: 'will@glee.com', exclusion: null },
  { name: 'Sue Sylvester', email: 'sue@glee.com', exclusion: null },
  { name: 'Emma Pillsbury', email: 'emma@glee.com', exclusion: null },
  { name: 'Artie Abrams', email: 'artie@glee.com', exclusion: null },
  { name: 'Tina Cohen-Chang', email: 'tina@glee.com', exclusion: null },
  { name: 'Mercedes Jones', email: 'mercedes@glee.com', exclusion: null },
];

const wishlists: Record<string, string[]> = {
  'rachel@glee.com': ['Broadway cast recording', 'Vintage dress'],
  'finn@glee.com': ['Drum sticks', 'Letterman jacket patch'],
  'kurt@glee.com': ['Designer scarf', 'Moisturizer'],
  'blaine@glee.com': ['Bow ties', 'Sheet music'],
  'santana@glee.com': ['Statement heels'],
  'brittany@glee.com': ['Cat toys'],
  'will@glee.com': ['Hair gel'],
  'sue@glee.com': ['Tracksuit', 'Stopwatches'],
  'emma@glee.com': ['Hand sanitizer', 'Color-coded folders'],
  'artie@glee.com': ['Headphones'],
  'tina@glee.com': ['Black eyeliner', 'Goth band tee'],
  'mercedes@glee.com': ['Vocal mic'],
};

async function seedGlee() {
  console.log('Seeding Glee database...\n');

  try {
    await sql`DELETE FROM wishlists`;
    await sql`DELETE FROM participants`;
    await sql`DELETE FROM games`;
    await sql`DELETE FROM users`;

    await initDB();

    const gameId = await createGame('admin@glee.com');
    console.log(`Created game with ID: ${gameId}`);

    const participantIds: Record<string, number> = {};
    const tokens: Record<string, string> = {};

    for (const character of characters) {
      const token = crypto.randomBytes(32).toString('hex');
      const participantId = await addParticipant(
        gameId,
        character.email,
        token,
        null,
        character.name
      );
      participantIds[character.email] = participantId;
      tokens[character.email] = token;
      console.log(`  Added ${character.name}`);
    }

    for (const character of characters) {
      await verifyParticipant(tokens[character.email], character.name);
    }
    console.log('Verified all participants.');

    for (const character of characters) {
      if (character.exclusion) {
        const excludeId = participantIds[character.exclusion];
        await updateParticipantExclusion(participantIds[character.email], excludeId);
      }
    }
    console.log('Set exclusions for couples.');

    for (const [email, items] of Object.entries(wishlists)) {
      const participantId = participantIds[email];
      await upsertWishlist(participantId, items);
    }
    console.log('Seeded wishlists.');

    console.log('\nDatabase seeded successfully.\nMagic links (dev only):');
    for (const [email, token] of Object.entries(tokens)) {
      const link = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/verify?token=${token}`;
      console.log(`  ${email}: ${link}`);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

seedGlee();
