// Live Apify search endpoints — called on-demand from the frontend.
// Results are returned directly (not saved to Firestore).
// Gemini is NOT involved here; it runs separately on Firestore data.

import { Router } from 'express';
import { searchEvents, searchBusinesses, searchEducation } from '../services/apify-search.service.js';

const router = Router();

// POST /api/search/events   { preferences: { vibe, interests, customInput } }
router.post('/events', async (req, res) => {
  try {
    const results = await searchEvents(req.body?.preferences ?? {});
    res.json({ results, total: results.length, source: 'apify' });
  } catch (err) {
    console.error('[search/events]', err.message);
    res.status(500).json({ error: 'Event search failed' });
  }
});

// POST /api/search/businesses  { preferences: { vibe, category } }
router.post('/businesses', async (req, res) => {
  try {
    const results = await searchBusinesses(req.body?.preferences ?? {});
    res.json({ results, total: results.length, source: 'apify' });
  } catch (err) {
    console.error('[search/businesses]', err.message);
    res.status(500).json({ error: 'Business search failed' });
  }
});

// POST /api/search/education  { preferences: { focusArea, lookingFor } }
router.post('/education', async (req, res) => {
  try {
    const results = await searchEducation(req.body?.preferences ?? {});
    res.json({ results, total: results.length, source: 'apify' });
  } catch (err) {
    console.error('[search/education]', err.message);
    res.status(500).json({ error: 'Education search failed' });
  }
});

export default router;
