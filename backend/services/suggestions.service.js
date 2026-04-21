import { db } from '../database/firestore.js';

const COLLECTION = 'Suggestions';

/**
 * Save a user suggestion to Firestore.
 * @param {{ type: string, name: string, link: string }} payload
 * @returns {Promise<string>} The new document ID
 */
export async function saveSuggestion({ type, name, link }) {
  const doc = await db.collection(COLLECTION).add({
    type,
    name,
    link,
    submittedAt: new Date().toISOString(),
    reviewed: false,
  });
  return doc.id;
}
