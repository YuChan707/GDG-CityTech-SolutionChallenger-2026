/**
 * Firestore collection: "reviews"
 * Document ID: auto-generated
 *
 * @typedef {Object} ReviewDocument
 * @property {string}  id          - Document ID
 * @property {string}  event_id    - Reference to events/{id}
 * @property {string}  [user_id]   - Reference to users/{id} (future auth integration)
 * @property {string}  author      - Display name of reviewer
 * @property {number}  rating      - 1-5 star rating
 * @property {string}  body        - Review text
 * @property {number}  created_at  - Unix timestamp (ms)
 */

export const REVIEW_COLLECTION = 'reviews';

export function validateReview(doc) {
  const required = ['event_id', 'author', 'rating', 'body'];
  const missing = required.filter(k => doc[k] === undefined || doc[k] === null);
  if (missing.length) throw new Error(`Review missing required fields: ${missing.join(', ')}`);
  if (doc.rating < 1 || doc.rating > 5) throw new Error('rating must be between 1 and 5');
}
