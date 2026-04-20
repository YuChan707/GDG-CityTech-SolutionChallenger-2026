// Runs the pipeline for exactly 1 item per day to keep API costs minimal.
// Only considers events in the next 7 days; past events are discarded.
// Result is cached in Firestore under daily_picks/{YYYY-MM-DD} so the
// Apify + Gemini calls only fire once per day even if the endpoint is hit multiple times.

import { fetchInstagramPosts } from '../scrapers/apify.scraper.js';
import { classifyContent } from '../ai/gemini.service.js';
import { normalizeEvent } from '../processors/event.processor.js';
import { isRelevant } from '../processors/filter.processor.js';
import { matchToExisting } from '../processors/matcher.processor.js';
import { db, saveEvent } from '../database/firestore.js';

const DAILY_PICKS_COLLECTION = 'daily_picks';

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function offsetDateStr(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns today's pre-computed pick if it exists, otherwise runs
 * the pipeline for exactly 1 relevant post and caches the result.
 *
 * @returns {Promise<Object|null>}
 */
export async function getDailyPick() {
  const today = todayStr();
  const windowEnd = offsetDateStr(7); // only items happening within 7 days

  // Serve from cache — no API calls on subsequent hits for the same day
  const cached = await db.collection(DAILY_PICKS_COLLECTION).doc(today).get();
  if (cached.exists) return cached.data();

  const posts = await fetchInstagramPosts(); // 1 Apify dataset read

  for (const post of posts) {
    if (!isRelevant(post.text)) continue;

    const aiResult = await classifyContent(post.text); // 1 Gemini call, then stop

    if (aiResult.type === 'ignore') continue;

    // Discard events outside the 7-day window or already passed
    if (aiResult.date) {
      if (aiResult.date < today)      continue; // already happened
      if (aiResult.date > windowEnd)  continue; // too far in the future
    }

    const match = matchToExisting(aiResult);
    const normalized = normalizeEvent(aiResult);

    const pick = {
      date_picked:      today,
      type:             aiResult.type,          // "event" | "business"
      source:           'apify',
      matched_existing: match !== null,
      matched_source:   match?._match_source ?? null,
      ...normalized,
      ...(match ?? {}),
    };

    // Persist daily pick
    await db.collection(DAILY_PICKS_COLLECTION).doc(today).set(pick);

    // Save as new event only if it wasn't already in our JSON records
    if (aiResult.type === 'event' && !match) {
      await saveEvent(normalized);
    }

    return pick;
  }

  return null; // No relevant item found in today's dataset
}

/**
 * Returns all cached picks for the current rolling 7-day window.
 * Items older than today are excluded automatically.
 *
 * @returns {Promise<Object[]>}
 */
export async function getWeeklyPicks() {
  const today = todayStr();
  const windowEnd = offsetDateStr(7);

  const snapshot = await db
    .collection(DAILY_PICKS_COLLECTION)
    .where('date_picked', '>=', today)
    .where('date_picked', '<=', windowEnd)
    .get();

  return snapshot.docs.map(doc => doc.data());
}
