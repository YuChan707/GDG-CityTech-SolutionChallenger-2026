import admin from "firebase-admin";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join, resolve, isAbsolute } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from backend/ root (one level up from database/)
dotenv.config({ path: join(__dirname, "../.env"), override: true });

if (!admin.apps.length) {
  // GOOGLE_APPLICATION_CREDENTIALS in .env is a relative path like ./database/file.json.
  // Firebase Admin SDK requires an absolute path — resolve it from backend/ root.
  const rawCred = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '';
  const credPath = isAbsolute(rawCred)
    ? rawCred
    : resolve(join(__dirname, '..'), rawCred);

  admin.initializeApp({
    credential: admin.credential.cert(credPath),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const db = admin.firestore();

/**
 * Save an event document to Firestore.
 * Uses the event's name+date as a deterministic ID to avoid duplicates.
 * @param {Object} event
 */
export async function saveEvent(event) {
  const id = `${(event.title ?? 'event').replace(/\s+/g, '-').toLowerCase()}-${event.date ?? 'no-date'}`;
  await db.collection('events').doc(id).set(event, { merge: true });
}
