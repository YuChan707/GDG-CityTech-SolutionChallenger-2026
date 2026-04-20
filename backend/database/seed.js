/**
 * Seed script — uploads backend/data/events.json into Firestore.
 *
 * Usage:
 *   node backend/database/seed.js
 *   npm run seed          (from backend/ directory)
 *
 * Safe to re-run: uses { merge: true } so existing docs are updated, not duplicated.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './firestore.js';
import { EVENT_COLLECTION, validateEvent } from './schemas/event.schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function seedEvents() {
  const raw = readFileSync(join(__dirname, '../data/events.json'), 'utf-8');
  const events = JSON.parse(raw);

  console.log(`Seeding ${events.length} events into Firestore collection "${EVENT_COLLECTION}"...`);

  const batch = db.batch();

  for (const event of events) {
    try {
      validateEvent(event);
    } catch (err) {
      console.warn(`  Skipping "${event.name || event.id}": ${err.message}`);
      continue;
    }

    const docRef = db.collection(EVENT_COLLECTION).doc(String(event.id));
    batch.set(docRef, {
      ...event,
      created_at: Date.now(),
    }, { merge: true });

    console.log(`  Queued: [${event.id}] ${event.name}`);
  }

  await batch.commit();
  console.log('\nSeed complete.');
}

seedEvents().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
