// Checks whether a local business is still actively operating.
//
// Two-step verification:
//   Step 1 — Apify (Google Maps): search for the business by name → confirms it
//             still appears in Google Maps listings with an active presence.
//   Step 2 — Gemini: given the business name and location, uses AI knowledge
//             to confirm whether the business is likely still open.
//
// is_active = true only when BOTH steps agree the business is operating.

import { searchBusinesses } from './apify-search.service.js';
import { db } from '../database/firestore.js';

const STALE_THRESHOLD_DAYS  = 60;
const BUSINESSES_COLLECTION = 'businesses';

function daysSince(isoTimestamp) {
  return Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 86_400_000);
}

// Step 1: confirm the business appears in Google Maps results via Apify
async function checkViaApify(businessName, location) {
  const results = await searchBusinesses({ category: businessName });

  const match = results.find(r =>
    r.name.toLowerCase().includes(businessName.toLowerCase().split(' ')[0])
  );

  if (!match) {
    return { active: false, reason: 'Business not found in Google Maps results', detail: null };
  }

  return {
    active: true,
    reason: `Found in Google Maps: "${match.name}" at ${match.address || location}`,
    detail: match,
  };
}

// Step 2: ask Gemini to verify using its training knowledge
async function checkViaGemini(businessName, location, mapsDetail) {
  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY in .env');

  const context = mapsDetail
    ? `Google Maps found: "${mapsDetail.name}" at ${mapsDetail.address ?? location}, rating ${mapsDetail.rating ?? 'unknown'}.`
    : 'No Google Maps listing was found for this business.';

  const prompt = `You are verifying whether a local business is still actively operating in NYC.

Business name: "${businessName}"
Location: "${location}"
${context}

Return ONLY valid JSON, no markdown:
{
  "is_active": true or false,
  "confidence": "high | medium | low",
  "reason": "one sentence"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 150 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${res.statusText}`);

  const data    = await res.json();
  const raw     = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Check if a business is active (Apify Google Maps + Gemini double-check).
 * Optionally updates the Firestore document with the result.
 *
 * @param {string} businessName
 * @param {string} [location]
 * @param {string|null} [firestoreDocId]
 */
export async function checkBusinessActive(businessName, location = 'NYC', firestoreDocId = null) {
  const apify  = await checkViaApify(businessName, location);
  const gemini = await checkViaGemini(businessName, location, apify.detail);

  const is_active = apify.active && gemini.is_active;

  const result = {
    is_active,
    apify_active:  apify.active,
    gemini_active: gemini.is_active,
    confidence:    gemini.confidence,
    reason:        `Apify: ${apify.reason} | Gemini: ${gemini.reason}`,
    checked_at:    new Date().toISOString(),
  };

  if (firestoreDocId) {
    await db.collection(BUSINESSES_COLLECTION).doc(firestoreDocId).update({
      is_active,
      last_checked: result.checked_at,
    });
  }

  return result;
}
