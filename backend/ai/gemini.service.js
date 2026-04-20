// /ai/gemini.service.js
// Requires GEMINI_API_KEY in .env

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function geminiPost(prompt) {
  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY in .env');

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 200 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
}

/**
 * Validate a BATCH of events/businesses in a single Gemini call.
 * items: Array<{ type, name, location, category, date }>
 * Returns: Array<{ is_legitimate, confidence, reason }> in the same order.
 */
export async function validateLegitimacyBatch(items) {
  if (!items.length) return [];

  const list = items.map((it, i) => {
    const subject = it.type === 'business'
      ? `business named "${it.name}" in ${it.location || 'NYC'}`
      : `event named "${it.name}" on ${it.date || '?'} in ${it.location || 'NYC'} (${it.category || 'unknown'})`;
    return `${i + 1}. ${subject}`;
  }).join('\n');

  const prompt = `You are a legitimacy checker for an NYC experiences discovery app.
For each item below decide if it is REAL (not spam, fake, closed, or promotional noise).

${list}

Return ONLY a JSON array with one object per item, in the same order:
[{ "is_legitimate": true/false, "confidence": "high|medium|low", "reason": "one sentence" }, ...]`;

  const cleaned = await geminiPost(prompt);
  const results = JSON.parse(cleaned);
  // Fallback: if Gemini returns a single object instead of array
  return Array.isArray(results) ? results : [results];
}

/**
 * Single-item wrapper — kept for backward compatibility.
 */
export async function validateLegitimacy(item) {
  const results = await validateLegitimacyBatch([item]);
  return results[0];
}

export const classifyContent = async (text) => {
  const prompt = `Classify this Instagram post caption for a NYC events discovery app.
Return ONLY valid JSON — no markdown, no explanation.

Text: "${text.slice(0, 500)}"

Return exactly:
{
  "type": "event | business | ignore",
  "name": "event or business name, or empty string",
  "date": "YYYY-MM-DD or empty string",
  "location": "NYC neighborhood or city, or empty string",
  "category": "pop-up | educational | wellness | sports | festival | gaming | other"
}`;

  const cleaned = await geminiPost(prompt);
  return JSON.parse(cleaned);
};