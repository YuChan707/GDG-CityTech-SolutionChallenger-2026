// Matches Apify/Gemini classified output against the existing static JSON records.
// Uses word-overlap scoring on name + location — no external dependencies.
// Returns the best-matching record (event or business) or null if score is too low.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_ROOT  = join(__dirname, '../../default-data');

const eventsData   = JSON.parse(readFileSync(join(DATA_ROOT, 'events.json'),         'utf8'));
const businessData = JSON.parse(readFileSync(join(DATA_ROOT, 'local-business.json'), 'utf8'));

const MATCH_THRESHOLD = 0.4; // minimum combined score to accept a match

function normalize(str = '') {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

// Jaccard-style word overlap: intersection / union of words longer than 2 chars
function wordOverlapScore(a, b) {
  const wordsA = new Set(normalize(a).split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(normalize(b).split(/\s+/).filter(w => w.length > 2));
  if (!wordsA.size || !wordsB.size) return 0;
  const shared = [...wordsA].filter(w => wordsB.has(w)).length;
  return shared / Math.max(wordsA.size, wordsB.size);
}

function findBestIn(name, location, records, nameKey, locationKey) {
  let best = null;
  let bestScore = 0;

  for (const record of records) {
    const nameScore = wordOverlapScore(name, record[nameKey] ?? '');
    const locScore  = wordOverlapScore(location, record[locationKey] ?? '') * 0.4; // location worth 40%
    const total     = nameScore + locScore;

    if (total > bestScore) {
      bestScore = total;
      best = record;
    }
  }

  return bestScore >= MATCH_THRESHOLD ? { record: best, score: bestScore } : null;
}

/**
 * Try to match an AI-classified result against existing events.json or local-business.json.
 *
 * @param {{ type: string, name: string, location: string }} aiResult
 * @returns {Object|null} The matched record with _match_score and _match_source added, or null
 */
export function matchToExisting(aiResult) {
  const name     = aiResult.name ?? '';
  const location = aiResult.location ?? '';

  if (aiResult.type === 'event') {
    const hit = findBestIn(name, location, eventsData, 'name-event', 'location');
    if (hit) return { ...hit.record, _match_score: hit.score, _match_source: 'events.json' };
    return null;
  }

  if (aiResult.type === 'business') {
    const hit = findBestIn(name, location, businessData, 'name-business', 'location');
    if (hit) return { ...hit.record, _match_score: hit.score, _match_source: 'local-business.json' };
    return null;
  }

  // Type is ambiguous — try both and return the higher-scoring match
  const eventHit = findBestIn(name, location, eventsData,   'name-event',    'location');
  const bizHit   = findBestIn(name, location, businessData, 'name-business', 'location');

  if (!eventHit && !bizHit) return null;
  if (!eventHit) return { ...bizHit.record,   _match_score: bizHit.score,   _match_source: 'local-business.json' };
  if (!bizHit)   return { ...eventHit.record, _match_score: eventHit.score, _match_source: 'events.json' };

  return eventHit.score >= bizHit.score
    ? { ...eventHit.record, _match_score: eventHit.score, _match_source: 'events.json' }
    : { ...bizHit.record,   _match_score: bizHit.score,   _match_source: 'local-business.json' };
}
