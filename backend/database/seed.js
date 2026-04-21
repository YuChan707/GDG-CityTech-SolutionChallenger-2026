// Seed script — uploads default-data/ into Firestore.
// Run from backend/: npm run seed

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { db } from './firestore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../default-data');

function slugify(str) {
  return str.toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, '');
}

// ── Seed events ───────────────────────────────────────────────────────────────

async function seedEvents() {
  const events = JSON.parse(readFileSync(join(dataDir, 'events.json'), 'utf-8'));
  console.log(`\nSeeding ${events.length} events…`);
  const batch = db.batch();

  for (const e of events) {
    const name = e['name-event'] ?? e.name ?? 'event';
    const date = e['date-event'] ?? e.date ?? '';
    const id   = `${slugify(name)}-${date}`;

    batch.set(db.collection('events').doc(id), {
      title:          name,
      description:    e['description-event'] ?? e.description ?? '',
      date,
      time:           e['time-event']     ?? e.time     ?? '',
      location:       e.location          ?? e['location-event'] ?? '',
      coordinates:    e.coordinates       ?? null,
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
    const id   = slugify(name);

    batch.set(db.collection('businesses').doc(id), {
      name,
      description:  b.description  ?? '',
      hours:        b['hours-business']    ?? b.hours    ?? '',
      location:     b.location             ?? '',
      coordinates:  b.coordinates          ?? null,
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

// ── Seed professional events ──────────────────────────────────────────────────

async function seedProfessionalEvents() {
  const orgs = JSON.parse(readFileSync(join(dataDir, 'professional-events.json'), 'utf-8'));
  console.log(`\nSeeding ${orgs.length} professional events…`);
  const batch = db.batch();

  for (const o of orgs) {
    const name = o['name-event'] ?? o['Organization-name'] ?? 'event';
    const id   = slugify(name);

    batch.set(db.collection('professional_events').doc(id), {
      type:             'event',
      name,
      focusArea:        o['Focus-Area']    ?? o['focus-event']       ?? '',
      requirement:      o['User-requirement']                        ?? '',
      services:         (o['Program-services'] ?? '').split(',').map(s => s.trim()).filter(Boolean),
      otherCategory:    o['Other category'] ?? o['category-event']   ?? '',
      location:         o.location                                   ?? '',
      coordinates:      o.coordinates                                ?? null,
      registrationLink: o['link-registration-program'] ?? o['link-event'] ?? null,
      dueDate:          o['due-date-register-program'] ?? o['date-event']  ?? null,
      description:      o['description-event']                       ?? '',
    }, { merge: true });

    console.log(`  ✓ [event] "${name}"`);
  }

  await batch.commit();
  console.log(`  → ${orgs.length} professional events written.`);
}

// ── Seed jobs & internships ───────────────────────────────────────────────────

async function seedJobsInternships() {
  const orgs = JSON.parse(readFileSync(join(dataDir, 'jobs-internships-program.json'), 'utf-8'));
  console.log(`\nSeeding ${orgs.length} jobs & internships…`);
  const batch = db.batch();

  for (const o of orgs) {
    const name = o['Organization-name'] ?? o.name ?? 'org';
    const id   = slugify(name);

    batch.set(db.collection('jobs_internships').doc(id), {
      type:             'job',
      name,
      focusArea:        o['Focus-Area']                              ?? '',
      requirement:      o['User-requirement']                        ?? '',
      services:         (o['Program-services'] ?? '').split(',').map(s => s.trim()).filter(Boolean),
      otherCategory:    o['Other category']                          ?? '',
      location:         o.location                                   ?? '',
      coordinates:      o.coordinates                                ?? null,
      registrationLink: o['link-registration-program']              ?? null,
      dueDate:          o['due-date-register-program']              ?? null,
    }, { merge: true });

    console.log(`  ✓ [job] "${name}"`);
  }

  await batch.commit();
  console.log(`  → ${orgs.length} jobs & internships written.`);
}

// ── Run ───────────────────────────────────────────────────────────────────────

try {
  await seedEvents();
  await seedBusinesses();
  await seedProfessionalEvents();
  await seedJobsInternships();
  console.log('\n✅ Seed complete — Firestore now has events + businesses + professional_events + jobs_internships.');
} catch (err) {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
}
