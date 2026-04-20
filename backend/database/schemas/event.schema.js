/**
 * Firestore collection: "events"
 * Document ID: string (e.g. "1", "2", auto-generated)
 *
 * @typedef {Object} EventDocument
 * @property {string}   id            - Document ID (mirrored into the doc)
 * @property {string}   name          - Display name of the event
 * @property {string}   date          - ISO date string "YYYY-MM-DD"
 * @property {string}   time          - Start time "HH:MM" (24-hour)
 * @property {string}   description   - Full description
 * @property {string}   category      - One of: pop-up | educational | wellness | sports | festival | gaming
 * @property {string}   focus         - Target audience (e.g. "young adults", "all ages")
 * @property {boolean}  is_free       - Whether the event is free
 * @property {number}   [min_price]   - Minimum ticket price (omit when free)
 * @property {number}   [max_price]   - Maximum ticket price (omit when free)
 * @property {string[]} group_type    - Audience tags (e.g. ["friends", "foodies"])
 * @property {string}   location      - Human-readable venue + borough
 * @property {string}   link          - External event URL
 * @property {string[]} tags          - Searchable keyword tags
 * @property {number}   [created_at]  - Unix timestamp (ms) when seeded / created
 */

export const EVENT_COLLECTION = 'events';

/** Validate a raw object conforms to the event shape (lightweight, no deps). */
export function validateEvent(doc) {
  const required = ['name', 'date', 'time', 'description', 'category', 'is_free', 'location', 'link'];
  const missing = required.filter(k => doc[k] === undefined || doc[k] === null);
  if (missing.length) throw new Error(`Event missing required fields: ${missing.join(', ')}`);
  if (typeof doc.is_free !== 'boolean') throw new Error('is_free must be a boolean');
  if (!Array.isArray(doc.tags)) throw new Error('tags must be an array');
  if (!Array.isArray(doc.group_type)) throw new Error('group_type must be an array');
}
