import { Router } from 'express';
import { getAllEvents } from '../services/events.service.js';

const router = Router();

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

const VALID_PRICE = new Set(['free', 'up20', 'up50', 'any']);

function validatePreferences(p) {
  if (!p || typeof p !== 'object') return 'preferences must be an object';
  if (p.vibe !== undefined && !Array.isArray(p.vibe)) return 'vibe must be an array';
  if (p.interests !== undefined && !Array.isArray(p.interests)) return 'interests must be an array';
  if (p.groupType !== undefined && typeof p.groupType !== 'string') return 'groupType must be a string';
  if (p.customInput !== undefined && typeof p.customInput !== 'string') return 'customInput must be a string';
  if (p.customInput && p.customInput.length > 300) return 'customInput too long (max 300 characters)';
  if (p.pricePreference && !VALID_PRICE.has(p.pricePreference))
    return `pricePreference must be one of: ${[...VALID_PRICE].join(', ')}`;
  return null;
}

router.post('/', async (req, res) => {
  const { preferences } = req.body ?? {};
  const validationError = validatePreferences(preferences);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  let events;
  try {
    events = await getAllEvents();
  } catch (err) {
    console.error('POST /api/recommendations — Firestore error:', err);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }

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
