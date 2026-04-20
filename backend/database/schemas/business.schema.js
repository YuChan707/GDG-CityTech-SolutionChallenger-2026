/**
 * Firestore collection: "businesses"
 * Document ID: auto-generated or slug
 *
 * @typedef {Object} BusinessDocument
 * @property {string}   id           - Document ID
 * @property {string}   name         - Business name
 * @property {string}   category     - Type of business (restaurant | shop | venue | service)
 * @property {string}   borough      - NYC borough (Manhattan | Brooklyn | Queens | Bronx | Staten Island)
 * @property {string}   address      - Street address
 * @property {string}   [website]    - Business website URL
 * @property {string}   [phone]      - Contact phone
 * @property {number}   [rating]     - Average rating 0-5
 * @property {string[]} tags         - Searchable keyword tags
 * @property {number}   [created_at] - Unix timestamp (ms)
 */

export const BUSINESS_COLLECTION = 'businesses';

export function validateBusiness(doc) {
  const required = ['name', 'category', 'borough', 'address'];
  const missing = required.filter(k => !doc[k]);
  if (missing.length) throw new Error(`Business missing required fields: ${missing.join(', ')}`);
}
