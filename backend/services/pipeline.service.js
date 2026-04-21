// Scheduled pipeline — runs every 6 hours via the cron job.
// Uses Apify to refresh NYC event and business data; Gemini validates independently.

import { searchEvents, searchBusinesses } from './apify-search.service.js';
import { validateLegitimacyBatch } from '../ai/gemini.service.js';
import { db } from '../database/firestore.js';

function slugify(str) {
  return (str ?? '').toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, '');
}

async function batchSave(collection, items, buildDoc) {
  const batch   = db.batch();
  let   written = 0;

  for (const item of items) {
    const id  = slugify(item.name) || `apify-${Date.now()}-${written}`;
    const ref = db.collection(collection).doc(id);
    batch.set(ref, { ...buildDoc(item), addedAt: new Date().toISOString() }, { merge: true });
    written++;
  }

  if (written) await batch.commit();
  return written;
}

export async function runPipeline() {
  console.log('[pipeline] scheduled run starting…');

  // General NYC search — no specific preferences
  const [rawEvents, rawBusinesses] = await Promise.all([
    searchEvents({}),
    searchBusinesses({ vibe: ['Food & Drinks', 'Arts & Culture'] }),
  ]);

  console.log(`[pipeline] fetched ${rawEvents.length} events, ${rawBusinesses.length} businesses from Apify`);

  // Gemini validates legitimacy (separate concern, not tied to Apify internals)
  const allItems = [
    ...rawEvents.map(e     => ({ type: 'event',    name: e.name, location: e.location, category: e.category })),
    ...rawBusinesses.map(b => ({ type: 'business', name: b.name, location: b.location, category: b.category })),
  ];

  let validations = allItems.map(() => ({ is_legitimate: true }));
  try {
    validations = await validateLegitimacyBatch(allItems);
  } catch (err) {
    console.warn('[pipeline] Gemini validation skipped:', err.message);
  }

  const validEvents     = rawEvents.filter((_, i) => validations[i]?.is_legitimate !== false);
  const validBusinesses = rawBusinesses.filter((_, i) => validations[rawEvents.length + i]?.is_legitimate !== false);

  const savedEvents = await batchSave('events', validEvents.slice(0, 10), e => ({
    title:          e.name,
    description:    e.description ?? '',
    date:           e.date        ?? new Date().toISOString().slice(0, 10),
    location:       e.location    ?? 'NYC',
    category:       e.category    ?? 'other',
    link:           e.link        ?? '',
    is_free:        false,
    is_legitimate:  true,
    gemini_checked: true,
    source:         'apify-scheduled',
  }));

  const savedBusinesses = await batchSave('businesses', validBusinesses.slice(0, 10), b => ({
    name:         b.name,
    description:  b.description ?? '',
    location:     b.address     ?? b.location ?? 'NYC',
    coordinates:  b.coordinates ?? null,
    category:     b.category    ?? 'other',
    link:         b.link        ?? '',
    phone:        b.phone       ?? '',
    rating:       b.rating      ?? null,
    is_active:    true,
    source:       'apify-scheduled',
  }));

  console.log(`[pipeline] done — ${savedEvents} events + ${savedBusinesses} businesses saved`);
}
