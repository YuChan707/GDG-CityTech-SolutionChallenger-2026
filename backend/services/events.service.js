import { db } from '../database/firestore.js';
import { EVENT_COLLECTION } from '../database/schemas/event.schema.js';

// Push at most one equality filter to Firestore (single-field index limit on free tier).
// Returns the narrowed CollectionReference.
function applyFirestoreEqFilter(ref, { category, is_free, date }) {
  if (category)              return ref.where('category', '==', category);
  if (is_free !== undefined) return ref.where('is_free', '==', is_free === 'true');
  if (date)                  return ref.where('date', '==', date);
  return ref;
}

// In-memory filters applied after Firestore fetch.
function applyMemoryFilters(events, { category, is_free, date, time, search }) {
  if (category)              events = events.filter(e => e.category === category);
  if (is_free !== undefined) events = events.filter(e => e.is_free === (is_free === 'true'));
  if (date)                  events = events.filter(e => e.date === date);
  if (time)                  events = events.filter(e => e.time >= time);
  if (search) {
    const q = search.toLowerCase();
    events = events.filter(e =>
      `${e.name} ${e.description} ${e.location} ${(e.tags || []).join(' ')}`
        .toLowerCase()
        .includes(q)
    );
  }
  return events;
}

/**
 * Fetch upcoming events (today or later) and apply optional filters.
 * Firestore free-tier has no full-text search, so text search stays in JS.
 *
 * @param {{ search?: string, date?: string, time?: string, category?: string, is_free?: string }} filters
 * @returns {Promise<Object[]>}
 */
export async function queryEvents(filters = {}) {
  const { category, is_free, date } = filters;

  const today = new Date().toISOString().slice(0, 10);
  let ref = db.collection(EVENT_COLLECTION).where('date', '>=', today);

  const eqCount = [category, is_free, date].filter(v => v !== undefined).length;

  // Push exactly one equality filter to Firestore; apply the rest in memory.
  if (eqCount === 1) ref = applyFirestoreEqFilter(ref, { category, is_free, date });

  const snapshot = await ref.get();
  let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // When one equality filter was pushed to Firestore, strip it from memory filters to avoid double-filtering.
  const memoryFilters = eqCount === 1
    ? { ...filters, category: undefined, is_free: undefined, date: undefined }
    : filters;
  events = applyMemoryFilters(events, memoryFilters);

  return events;
}

/**
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getEventById(id) {
  const doc = await db.collection(EVENT_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Fetch every event document — used by the recommendations engine.
 * @returns {Promise<Object[]>}
 */
export async function getAllEvents() {
  const snapshot = await db.collection(EVENT_COLLECTION).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
