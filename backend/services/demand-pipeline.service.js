// Triggered when a user submits the questionnaire (fire-and-forget).
// New flow: preferences → Apify search (Google Search / Google Maps) → Gemini validation → Firestore
// Gemini and Apify are fully independent services.

import { searchEvents, searchBusinesses } from './apify-search.service.js';
import { validateLegitimacyBatch, rankResultsForUser } from '../ai/gemini.service.js';
import { db } from '../database/firestore.js';

const SAVE_LIMIT = 5; // max new items to write per pipeline run

function slugify(str) {
  return (str ?? '').toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, '');
}

// ── Save helpers ──────────────────────────────────────────────────────────────

async function saveNewEvents(items) {
  const today   = new Date().toISOString().slice(0, 10);
  const batch   = db.batch();
  let   written = 0;

  for (const item of items) {
    if (written >= SAVE_LIMIT) break;
    const id = slugify(item.name) || `apify-event-${Date.now()}`;
    const ref = db.collection('events').doc(id);
    const existing = await ref.get();
    if (existing.exists) continue;

    batch.set(ref, {
      title:          item.name,
      description:    item.description ?? '',
      date:           item.date        ?? today,
      location:       item.location    ?? 'NYC',
      category:       item.category    ?? 'other',
      link:           item.link        ?? '',
      is_free:        false,
      is_legitimate:  item.is_legitimate ?? true,
      gemini_checked: true,
      source:         item.source      ?? 'apify',
      addedAt:        new Date().toISOString(),
    }, { merge: false });

    written++;
    console.log(`[demand-pipeline] queued event: "${item.name}"`);
  }

  if (written > 0) await batch.commit();
  return written;
}

async function saveNewBusinesses(items) {
  const batch   = db.batch();
  let   written = 0;

  for (const item of items) {
    if (written >= SAVE_LIMIT) break;
    const id = slugify(item.name) || `apify-biz-${Date.now()}`;
    const ref = db.collection('businesses').doc(id);
    const existing = await ref.get();
    if (existing.exists) continue;

    batch.set(ref, {
      name:         item.name,
      description:  item.description ?? '',
      location:     item.address     ?? item.location ?? 'NYC',
      coordinates:  item.coordinates ?? null,
      category:     item.category    ?? 'other',
      link:         item.link        ?? '',
      phone:        item.phone       ?? '',
      rating:       item.rating      ?? null,
      is_active:    true,
      source:       item.source      ?? 'apify',
      addedAt:      new Date().toISOString(),
    }, { merge: false });

    written++;
    console.log(`[demand-pipeline] queued business: "${item.name}"`);
  }

  if (written > 0) await batch.commit();
  return written;
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function triggerDemandPipeline(preferences) {
  console.log('[demand-pipeline] starting — preferences:', JSON.stringify(preferences));

  try {
    // 1. Apify searches (run in parallel, independent of Gemini)
    const [rawEvents, rawBusinesses] = await Promise.all([
      searchEvents(preferences),
      searchBusinesses(preferences),
    ]);

    console.log(`[demand-pipeline] Apify returned ${rawEvents.length} events, ${rawBusinesses.length} businesses`);

    if (!rawEvents.length && !rawBusinesses.length) return;

    // 2. Gemini ranks results against preferences (independent call, not tied to Apify)
    const rankedEvents     = await rankResultsForUser(rawEvents,     preferences).catch(() => rawEvents);
    const rankedBusinesses = await rankResultsForUser(rawBusinesses, preferences).catch(() => rawBusinesses);

    // 3. Gemini validates the top candidates
    const topEvents = rankedEvents
      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
      .slice(0, SAVE_LIMIT);

    const topBusinesses = rankedBusinesses
      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
      .slice(0, SAVE_LIMIT);

    const validationInput = [
      ...topEvents.map(e     => ({ type: 'event',    name: e.name, location: e.location, category: e.category })),
      ...topBusinesses.map(b => ({ type: 'business', name: b.name, location: b.location, category: b.category })),
    ];

    const validations = await validateLegitimacyBatch(validationInput).catch(() =>
      validationInput.map(() => ({ is_legitimate: true }))
    );

    const validEvents     = topEvents.map((e, i) => ({ ...e, is_legitimate: validations[i]?.is_legitimate ?? true }))
                                     .filter(e => e.is_legitimate);
    const validBusinesses = topBusinesses.map((b, i) => ({ ...b, is_legitimate: validations[topEvents.length + i]?.is_legitimate ?? true }))
                                         .filter(b => b.is_legitimate);

    // 4. Save to Firestore
    const savedEvents     = await saveNewEvents(validEvents);
    const savedBusinesses = await saveNewBusinesses(validBusinesses);

    console.log(`[demand-pipeline] done — saved ${savedEvents} events + ${savedBusinesses} businesses`);
  } catch (err) {
    console.error('[demand-pipeline] error:', err.message);
  }
}
