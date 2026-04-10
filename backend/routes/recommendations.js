import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

function loadEvents() {
  const raw = readFileSync(join(__dirname, '../data/events.json'), 'utf-8');
  return JSON.parse(raw);
}

// Keyword maps for scoring
const VIBE_KEYWORDS = {
  'Outdoors': ['outdoor', 'park', 'marathon', 'wellness', 'running', 'sports'],
  'Food & Drinks': ['food', 'market', 'vendors', 'trucks', 'festival', 'foodies'],
  'Arts & Culture': ['art', 'cultural', 'museum', 'gallery', 'design', 'style'],
  'Sports & Fitness': ['fitness', 'sports', 'running', 'marathon', 'yoga', 'health'],
  'Music & Entertainment': ['music', 'DJ', 'festival', 'entertainment', 'gaming', 'indie'],
  'Shopping': ['shopping', 'fashion', 'boutique', 'streetwear', 'pop-up'],
  'Gaming & Tech': ['gaming', 'tech', 'AI', 'coding', 'developers', 'startup'],
  'Wellness': ['wellness', 'yoga', 'meditation', 'health', 'fitness'],
  'Family Fun': ['family', 'festival', 'outdoor', 'food'],
};

const GROUP_KEYWORDS = {
  'Solo': ['solo', 'academics', 'professionals'],
  'Friends': ['friends', 'foodies', 'gamers', 'fashion'],
  'Couple': ['couple', 'foodies', 'fashion'],
  'Family': ['family', 'families'],
};

/**
 * POST /api/recommendations
 * Body: { preferences: { vibe, groupType, interests, pricePreference, customInput } }
 *
 * TODO: Replace scoring logic with Vertex AI Matching Engine or Gemini API call:
 * const { VertexAI } = require('@google-cloud/vertexai');
 * const vertexAI = new VertexAI({ project: process.env.GCP_PROJECT_ID, location: 'us-central1' });
 * const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
 * const result = await model.generateContent({ ... });
 *
 * TODO: Replace events source with Firestore:
 * const { Firestore } = require('@google-cloud/firestore');
 * const db = new Firestore({ projectId: process.env.GCP_PROJECT_ID });
 * const snapshot = await db.collection('events').get();
 */
router.post('/', (req, res) => {
  const { preferences } = req.body;
  if (!preferences) {
    return res.status(400).json({ error: 'preferences required' });
  }

  let events = loadEvents();

  const scored = events.map(event => {
    let score = 0;
    const text = [event.name, event.description, event.category, ...event.tags, ...event.group_type]
      .join(' ').toLowerCase();

    (preferences.vibe || []).forEach(vibe => {
      const kws = VIBE_KEYWORDS[vibe] || [];
      if (kws.some(kw => text.includes(kw.toLowerCase()))) score += 3;
    });

    const groupKws = GROUP_KEYWORDS[preferences.groupType] || [];
    if (groupKws.some(kw => text.includes(kw.toLowerCase()))) score += 2;

    const interestWords = [
      ...(preferences.interests || []),
      ...(preferences.customInput || '').split(/[\s,]+/).filter(w => w.length > 2),
    ];
    interestWords.forEach(word => {
      if (text.includes(word.toLowerCase())) score += 2;
    });

    if (preferences.pricePreference === 'free' && event.is_free) score += 3;
    else if (preferences.pricePreference === 'up20' && (event.is_free || event.max_price <= 20)) score += 2;
    else if (preferences.pricePreference === 'up50' && (event.is_free || event.max_price <= 50)) score += 2;
    else if (preferences.pricePreference === 'any') score += 1;

    return { ...event, relevanceScore: score };
  });

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  res.json({ events: scored, total: scored.length });
});

export default router;
