import admin from "firebase-admin";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from backend/ root (one level up from database/)
dotenv.config({ path: join(__dirname, "../.env") });

if (!admin.apps.length) {
  admin.initializeApp({
    // Reads GOOGLE_APPLICATION_CREDENTIALS env var automatically
    credential: admin.credential.applicationDefault(),
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
