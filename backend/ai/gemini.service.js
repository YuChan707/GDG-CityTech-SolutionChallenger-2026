// Gemini AI service — used for validation and AI-powered recommendations.
// Apify is handled separately in apify-search.service.js.
// Requires GEMINI_API_KEY in .env

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function geminiPost(prompt, maxTokens = 512) {
  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY in .env');

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: maxTokens },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
}

// ── Legitimacy validation ─────────────────────────────────────────────────────

/**
 * Validate a BATCH of items in a single Gemini call.
 * items: Array<{ type, name, location, category, date }>
 * Returns: Array<{ is_legitimate, confidence, reason }> in the same order.
 */
export async function validateLegitimacyBatch(items) {
  if (!items.length) return [];

  const list = items.map((it, i) => {
    const subject = it.type === 'business'
      ? `business named "${it.name}" in ${it.location || 'NYC'}`
      : `${it.type} named "${it.name}" in ${it.location || 'NYC'} (${it.category || 'general'})`;
    return `${i + 1}. ${subject}`;
  }).join('\n');

  const prompt = `You are a legitimacy checker for an NYC discovery app.
For each item below decide if it is REAL (not spam, fake, closed, or promotional noise).

${list}

Return ONLY a JSON array with one object per item, in the same order:
[{ "is_legitimate": true/false, "confidence": "high|medium|low", "reason": "one sentence" }, ...]`;

  const cleaned = await geminiPost(prompt);
  const results = JSON.parse(cleaned);
  return Array.isArray(results) ? results : [results];
}

export async function validateLegitimacy(item) {
  const results = await validateLegitimacyBatch([item]);
  return results[0];
}

// ── Search result enrichment ──────────────────────────────────────────────────

/**
 * Extract structured event/business data from a raw Apify search result snippet.
 * item: { type, name, description, link }
 * Returns: { name, date, location, category, is_legitimate }
 */
export async function structureSearchResult(item) {
  const prompt = `You are a data extraction assistant for an NYC discovery app.
Extract structured information from this search result.

Type: ${item.type}
Title: ${item.name}
Snippet: ${(item.description ?? '').slice(0, 600)}
URL: ${item.link ?? ''}

Return ONLY valid JSON:
{
  "name": "clean event or business name",
  "date": "YYYY-MM-DD or empty string if unknown",
  "location": "NYC neighborhood or address, or 'NYC'",
  "category": "one of: festival | networking | workshop | job | internship | business | other",
  "is_legitimate": true or false
}`;

  const cleaned = await geminiPost(prompt, 200);
  return JSON.parse(cleaned);
}

// ── AI Recommendations ────────────────────────────────────────────────────────

/**
 * Use Gemini to rank a list of items against user preferences.
 * items: array of { name, category, description, location }
 * preferences: { vibe, interests, customInput }
 * Returns: array with relevanceScore added (0–10).
 */
export async function rankResultsForUser(items, preferences) {
  if (!items.length) return [];

  const prefSummary = [
    preferences.vibe?.join(', '),
    preferences.interests?.join(', '),
    preferences.customInput,
  ].filter(Boolean).join(' | ');

  const list = items.slice(0, 20).map((it, i) =>
    `${i + 1}. [${it.category || it.type}] ${it.name} — ${(it.description ?? '').slice(0, 120)}`
  ).join('\n');

  const prompt = `You are a recommendation engine for an NYC discovery app.
User preferences: ${prefSummary}

Rate each item below from 0–10 based on how relevant it is to the user's preferences.

${list}

Return ONLY a JSON array of numbers (one score per item, same order):
[7, 3, 9, ...]`;

  const cleaned = await geminiPost(prompt, 300);
  const scores = JSON.parse(cleaned);

  return items.map((item, i) => ({
    ...item,
    relevanceScore: Array.isArray(scores) ? (scores[i] ?? 0) : 0,
  }));
}
