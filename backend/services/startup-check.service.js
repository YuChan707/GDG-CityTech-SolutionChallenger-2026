// Runs once at server boot (fire-and-forget, never blocks startup).
//
// 1. Delete any events whose date has already passed.
// 2. For remaining events without a legitimacy stamp, ask Gemini if they're real.
//    → marks is_legitimate: false → hidden from queries.
// 3. For local businesses, ask Gemini if they're still operating.
//    → updates is_active on the Firestore doc.
//
// Cost guardrails:
//   - Events are only sent to Gemini once (gemini_checked flag).
//   - Businesses are re-checked only if last_checked is > 24 hours ago.

import { db } from '../database/firestore.js';
import { validateLegitimacyBatch } from '../ai/gemini.service.js';

const EVENTS_COL        = 'events';
const BUSINESSES_COL    = 'businesses';
const CONFIG_COL        = 'config';
const RECHECK_MS        = 24 * 60 * 60 * 1000; // 24 hours
const GEMINI_COOLDOWN_MS = 60 * 1000;          // 1 min cooldown (paid: 2000 RPM — just guards rapid restarts)
const MAX_PER_STARTUP   = 20;                   // validate up to 20 items per startup batch

// ── 1. Remove expired events ──────────────────────────────────────────────────

async function pruneExpiredEvents() {
  const nowISO = new Date().toISOString(); // full datetime for precision
  const today  = nowISO.slice(0, 10);

  const snap = await db.collection(EVENTS_COL)
    .where('date', '<', today)
    .get();

  if (snap.empty) {
    console.log('[startup] No expired events to remove.');
    return 0;
  }

  const batch = db.batch();
  snap.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log(`[startup] Removed ${snap.size} expired event(s).`);
  return snap.size;
}

// ── 2. Gemini-validate events not yet checked ─────────────────────────────────

async function validateEvents() {
  const snap = await db.collection(EVENTS_COL)
    .where('gemini_checked', '==', false)
    .get();

  if (snap.empty) {
    // Also handle docs that simply lack the field
    const snap2 = await db.collection(EVENTS_COL).get();
    const unchecked = snap2.docs.filter(d => d.data().gemini_checked === undefined);
    if (!unchecked.length) {
      console.log('[startup] All events already validated.');
      return;
    }
    await _validateEventDocs(unchecked.slice(0, MAX_PER_STARTUP));
    return;
  }

  await _validateEventDocs(snap.docs.slice(0, MAX_PER_STARTUP));
}

async function _validateEventDocs(docs) {
  // One Gemini call for all docs — saves N-1 requests vs. per-doc loop.
  const items = docs.map(doc => {
    const e = doc.data();
    return { type: 'event', name: e.title ?? e.name ?? '', location: e.location ?? '', category: e.category ?? '', date: e.date ?? '' };
  });

  let results;
  try {
    results = await validateLegitimacyBatch(items);
  } catch (err) {
    if (err.message.includes('429')) {
      console.warn('[startup] Gemini quota reached — will retry next startup (cooldown resets in 10 min).');
    } else {
      console.warn('[startup] Batch event validation failed:', err.message);
    }
    return;
  }

  let flagged = 0;
  for (let i = 0; i < docs.length; i++) {
    const result = results[i] ?? { is_legitimate: true, confidence: 'low', reason: 'no result' };
    const e = docs[i].data();
    await docs[i].ref.update({
      gemini_checked:    true,
      is_legitimate:     result.is_legitimate,
      gemini_confidence: result.confidence,
      gemini_reason:     result.reason,
    });
    if (!result.is_legitimate) {
      flagged++;
      console.log(`[startup] Flagged: "${e.title ?? e.name}" — ${result.reason}`);
    }
  }
  console.log(`[startup] Event validation done — ${flagged}/${docs.length} flagged as illegitimate.`);
}

// ── 3. Re-check business is_active ────────────────────────────────────────────

async function revalidateBusinesses() {
  const snap = await db.collection(BUSINESSES_COL).get();
  if (snap.empty) {
    console.log('[startup] No businesses in Firestore to check.');
    return;
  }

  const cutoff = new Date(Date.now() - RECHECK_MS).toISOString();
  const toCheck = snap.docs
    .filter(d => { const b = d.data(); return !b.last_checked || b.last_checked <= cutoff; })
    .slice(0, MAX_PER_STARTUP);

  // One Gemini call for all businesses.
  const items = toCheck.map(doc => {
    const b = doc.data();
    return { type: 'business', name: b.name ?? b.title ?? '', location: b.location ?? b.neighborhood ?? 'NYC', category: b.category ?? '', date: null };
  });

  let results;
  try {
    results = await validateLegitimacyBatch(items);
  } catch (err) {
    if (err.message.includes('429')) {
      console.warn('[startup] Gemini quota reached — business check skipped.');
    } else {
      console.warn('[startup] Batch business validation failed:', err.message);
    }
    return;
  }

  let updated = 0;
  const checkedAt = new Date().toISOString();
  for (let i = 0; i < toCheck.length; i++) {
    const result = results[i] ?? { is_legitimate: true, confidence: 'low', reason: 'no result' };
    const b = toCheck[i].data();
    await toCheck[i].ref.update({
      is_active:         result.is_legitimate,
      gemini_confidence: result.confidence,
      gemini_reason:     result.reason,
      last_checked:      checkedAt,
    });
    updated++;
    if (!result.is_legitimate) {
      console.log(`[startup] Business marked inactive: "${b.name ?? b.title}" — ${result.reason}`);
    }
  }

  console.log(`[startup] Business check done — ${updated} record(s) updated.`);
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function runStartupChecks() {
  console.log('[startup] Running health checks…');
  try {
    // Always prune expired events — no Gemini cost.
    await pruneExpiredEvents();

    // Guard: skip Gemini calls if we ran recently (protects against dev restarts).
    const configRef  = db.collection(CONFIG_COL).doc('startup');
    const configSnap = await configRef.get();
    const lastRan    = configSnap.exists ? configSnap.data().last_gemini_check ?? 0 : 0;
    const msSince    = Date.now() - new Date(lastRan).getTime();

    if (msSince < GEMINI_COOLDOWN_MS) {
      const waitMin = Math.ceil((GEMINI_COOLDOWN_MS - msSince) / 60_000);
      console.log(`[startup] Gemini checks skipped — ran ${Math.floor(msSince / 60_000)}m ago. Next in ~${waitMin}m.`);
      return;
    }

    // Save timestamp before calling Gemini so a crash doesn't loop.
    await configRef.set({ last_gemini_check: new Date().toISOString() }, { merge: true });

    await validateEvents();
    await revalidateBusinesses();
    console.log('[startup] Health checks complete.');
  } catch (err) {
    console.error('[startup] Health check error:', err.message);
  }
}
