// /ai/gemini.service.js
// Requires GEMINI_API_KEY in .env

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const classifyContent = async (text) => {
  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY in .env');

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

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 256 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip markdown code fences Gemini sometimes adds
  const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

  return JSON.parse(cleaned);
};