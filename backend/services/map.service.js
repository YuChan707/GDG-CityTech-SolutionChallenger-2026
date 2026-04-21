import { createRequire } from 'module';
import { db } from '../database/firestore.js';

const require = createRequire(import.meta.url);

function extractPins(items, type, nameKey) {
  return items
    .filter(d => d.coordinates?.lat && d.coordinates?.lng)
    .map(d => ({ type, name: d[nameKey] ?? '', coordinates: d.coordinates }));
}

function loadStaticPins() {
  const events = require('../../default-data/events.json');
  const biz    = require('../../default-data/local-business.json');
  const proEvs = require('../../default-data/professional-events.json');
  const jobs   = require('../../default-data/jobs-internships-program.json');

  return [
    ...extractPins(events, 'event',             'name-event'),
    ...extractPins(biz,    'business',           'name-business'),
    ...extractPins(proEvs, 'professional-event', 'name-event'),
    ...extractPins(jobs,   'job',                'Organization-name'),
  ];
}

/**
 * Fetch every document with coordinates from all four collections.
 * Falls back to static JSON files when Firestore has no coordinate data.
 */
export async function getAllMapPins() {
  try {
    const [evSnap, bizSnap, proEvSnap, jobSnap] = await Promise.all([
      db.collection('events').get(),
      db.collection('businesses').get(),
      db.collection('professional_events').get(),
      db.collection('jobs_internships').get(),
    ]);

    const pins = [];

    for (const doc of evSnap.docs) {
      const d = doc.data();
      if (d.coordinates?.lat && d.coordinates?.lng)
        pins.push({ type: 'event', name: d['name-event'] ?? d.title ?? d.name ?? '', coordinates: d.coordinates });
    }
    for (const doc of bizSnap.docs) {
      const d = doc.data();
      if (d.coordinates?.lat && d.coordinates?.lng)
        pins.push({ type: 'business', name: d['name-business'] ?? d.name ?? '', coordinates: d.coordinates });
    }
    for (const doc of proEvSnap.docs) {
      const d = doc.data();
      if (d.coordinates?.lat && d.coordinates?.lng)
        pins.push({ type: 'professional-event', name: d['name-event'] ?? d.name ?? '', coordinates: d.coordinates });
    }
    for (const doc of jobSnap.docs) {
      const d = doc.data();
      if (d.coordinates?.lat && d.coordinates?.lng)
        pins.push({ type: 'job', name: d['Organization-name'] ?? d.name ?? '', coordinates: d.coordinates });
    }

    if (pins.length > 0) return pins;
  } catch (err) {
    console.warn('[map.service] Firestore unavailable, using static fallback:', err.message);
  }

  return loadStaticPins();
}
