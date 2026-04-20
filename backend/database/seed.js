// Seed script — uploads default-data/ events + businesses into Firestore.
// Run from backend/: npm run seed

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { db } from './firestore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Source files live two levels up at project root / default-data/
const dataDir = join(__dirname, '../../default-data');

// ── Seed events ───────────────────────────────────────────────────────────────

async function seedEvents() {
  const events = JSON.parse(readFileSync(join(dataDir, 'events.json'), 'utf-8'));
  console.log(`\nSeeding ${events.length} events…`);
  const batch = db.batch();

  for (const e of events) {
    const name = e['name-event'] ?? e.name ?? 'event';
    const date = e['date-event'] ?? e.date ?? '';
    const id   = `${name.toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, '')}-${date}`;

    batch.set(db.collection('events').doc(id), {
      title:          name,
      description:    e['description-event'] ?? e.description ?? '',
      date,
      time:           e['time-event']     ?? e.time     ?? '',
      location:       e.location          ?? e['location-event'] ?? '',
      category:       e['category-event'] ?? e.category ?? 'other',
      focus:          e['focus-event']    ?? '',
      is_free:        e['is-free']        ?? e.is_free  ?? false,
      min_price:      e['min-price']      ?? null,
      max_price:      e['max-price']      ?? null,
      tags:           e.tags              ?? [],
      link:           e['link-event']     ?? e.link ?? '',
      hosted_by:      e['company-hosted'] ?? '',
      is_legitimate:  true,
      gemini_checked: false,
    }, { merge: true });

    console.log(`  ✓ "${name}"  ${date}`);
  }

  await batch.commit();
  console.log(`  → ${events.length} events written.`);
}

// ── Seed businesses ───────────────────────────────────────────────────────────

async function seedBusinesses() {
  const businesses = JSON.parse(readFileSync(join(dataDir, 'local-business.json'), 'utf-8'));
  console.log(`\nSeeding ${businesses.length} businesses…`);
  const batch = db.batch();

  for (const b of businesses) {
    const name = b['name-business'] ?? b.name ?? 'business';
    const id   = name.toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, '');

    batch.set(db.collection('businesses').doc(id), {
      name,
      description:  b.description  ?? '',
      hours:        b['hours-business']    ?? b.hours    ?? '',
      location:     b.location             ?? '',
      category:     b['category-business'] ?? b.category ?? 'other',
      focus:        b['focus-business']    ?? '',
      link:         b.link                 ?? '',
      owner_labels: b['owner-labels']      ?? '',
      is_active:    b.is_active            ?? true,
      last_checked: null,
    }, { merge: true });

    console.log(`  ✓ "${name}"  ${b.location ?? ''}`);
  }

  await batch.commit();
  console.log(`  → ${businesses.length} businesses written.`);
}

// ── Run ───────────────────────────────────────────────────────────────────────

try {
  await seedEvents();
  await seedBusinesses();
  console.log('\n✅ Seed complete — Firestore now has events + businesses.');
} catch (err) {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
}
