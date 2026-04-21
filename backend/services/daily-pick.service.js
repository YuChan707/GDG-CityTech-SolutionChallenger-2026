// Generates one featured item per day — cached in Firestore so Apify only
// runs once per day even if the endpoint is hit multiple times.
// Flow: Apify searches NYC events → Gemini structures the top result → cache.

import { searchEvents } from './apify-search.service.js';
import { structureSearchResult } from '../ai/gemini.service.js';
import { db } from '../database/firestore.js';

const DAILY_PICKS_COLLECTION = 'daily_picks';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDateStr(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns today's pre-computed pick from cache, or runs an Apify search
 * to find a new one, structures it with Gemini, and caches the result.
 *
 * @returns {Promise<Object|null>}
 */
export async function getDailyPick() {
  const today     = todayStr();
  const windowEnd = offsetDateStr(7);

  // Serve from cache — no API calls on subsequent hits for the same day
  const cached = await db.collection(DAILY_PICKS_COLLECTION).doc(today).get();
  if (cached.exists) return cached.data();

  // 1. Apify: search for today's NYC events
  const results = await searchEvents({});
  if (!results.length) return null;

  // 2. Gemini: structure the raw search snippet into a clean event object
  for (const item of results) {
    let structured;
    try {
      structured = await structureSearchResult(item);
    } catch {
      structured = { name: item.name, date: '', location: 'NYC', category: 'other', is_legitimate: true };
    }

    if (!structured.is_legitimate) continue;

    // Skip events outside the 7-day window
    if (structured.date) {
      if (structured.date < today)     continue;
      if (structured.date > windowEnd) continue;
    }

    const pick = {
      date_picked:      today,
      type:             'event',
      source:           'apify-google-search',
      matched_existing: false,
      matched_source:   null,
      title:            structured.name  || item.name,
      date:             structured.date  || '',
      category:         structured.category || 'other',
      location:         structured.location || 'NYC',
      link:             item.link         || '',
      description:      item.description  || '',
    };

    await db.collection(DAILY_PICKS_COLLECTION).doc(today).set(pick);
    return pick;
  }

  return null;
}

/**
 * Returns all cached picks for the current rolling 7-day window.
 *
 * @returns {Promise<Object[]>}
 */
export async function getWeeklyPicks() {
  const today     = todayStr();
  const windowEnd = offsetDateStr(7);

  const snapshot = await db
    .collection(DAILY_PICKS_COLLECTION)
    .where('date_picked', '>=', today)
    .where('date_picked', '<=', windowEnd)
    .get();

  return snapshot.docs.map(doc => doc.data());
}
