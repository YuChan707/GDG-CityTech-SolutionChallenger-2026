// Checks whether a local business is still actively operating.
//
// Two-step verification to keep costs low:
//   Step 1 — Apify: scans the already-fetched dataset for posts from this business.
//             No new Apify run is triggered — we reuse the existing dataset read.
//   Step 2 — Gemini: given the business name, location, and any Apify post context,
//             Gemini uses its training knowledge to confirm whether the business
//             is likely still open (acts as a Google Maps knowledge proxy).
//
// is_active = true only when BOTH steps agree the business is operating.

import { fetchInstagramPosts } from '../scrapers/apify.scraper.js';
import { db } from '../database/firestore.js';

const STALE_THRESHOLD_DAYS = 60;
const BUSINESSES_COLLECTION = 'businesses';

function daysSince(isoTimestamp) {
  return Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 86_400_000);
}

// Step 1: scan the Apify dataset for recent posts that belong to this business.
async function checkViaApify(businessName) {
  const posts = await fetchInstagramPosts();
  const keyword = businessName.toLowerCase().split(' ')[0]; // match on first word of name

  const ownedPosts = posts.filter(p => {
    const handle = (p.ownerFullName ?? p.ownerUsername ?? '').toLowerCase();
    return handle.includes(keyword);
  });

  if (!ownedPosts.length) {
    return { active: false, reason: 'No Instagram posts found for this business', sampleText: null };
  }

  const newest = ownedPosts.sort(
    (a, b) => new Date(b.timestamp ?? 0) - new Date(a.timestamp ?? 0)
  )[0];

  const age = daysSince(newest.timestamp);

  if (age > STALE_THRESHOLD_DAYS) {
    return {
      active: false,
      reason: `Last post was ${age} days ago (inactive threshold: ${STALE_THRESHOLD_DAYS} days)`,
      sampleText: null,
    };
  }

  return {
    active: true,
    reason: `Recent post found — ${age} days ago`,
    sampleText: newest.text ?? null,
  };
}

// Step 2: ask Gemini to verify using its training knowledge + Apify context.
async function checkViaGemini(businessName, location, apifyContext) {
  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY in .env');

  const context = apifyContext
    ? `Recent Instagram post from the business: "${apifyContext.slice(0, 200)}"`
    : 'No recent Instagram activity was found for this business.';

  const prompt = `You are verifying whether a local business is still actively operating.
Use your training knowledge about this business (similar to checking Google Maps) combined with the social media context.

Business name: "${businessName}"
Location: "${location}"
${context}

Return ONLY valid JSON, no markdown:
{
  "is_active": true or false,
  "confidence": "high | medium | low",
  "reason": "one sentence — e.g. still listed as open, or permanently closed in 2024"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Check if a business is active (Apify + Gemini double-check).
 * Updates the business document in Firestore with the result.
 *
 * @param {string} businessName
 * @param {string} [location]
 * @param {string} [firestoreDocId]  - If provided, updates is_active on the Firestore doc
 * @returns {Promise<{ is_active: boolean, apify_active: boolean, gemini_active: boolean, confidence: string, reason: string }>}
 */
export async function checkBusinessActive(businessName, location = 'NYC', firestoreDocId = null) {
  const apify  = await checkViaApify(businessName);
  const gemini = await checkViaGemini(businessName, location, apify.sampleText);

  // Business must pass BOTH checks to be marked active
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
