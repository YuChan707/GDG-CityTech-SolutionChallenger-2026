import { Router } from 'express';
import { queryEducation, recommendEducation } from '../services/education.service.js';

const router = Router();

// GET /api/education?type=event|job|both&focusArea=Technology&search=bootcamp
router.get('/', async (req, res) => {
  const { type, focusArea, search } = req.query;

  if (type && !['event', 'job', 'both'].includes(type)) {
    return res.status(400).json({ error: 'type must be event, job, or both' });
  }

  try {
    const results = await queryEducation({ type, focusArea, search });
    res.json({ profiles: results, total: results.length });
  } catch (err) {
    console.error('[education] query error:', err.message);
    res.status(500).json({ error: 'Failed to fetch education profiles' });
  }
});

// POST /api/education/recommendations
// Body: { preferences: { lookingFor, focusArea, experienceYears, extraSearch } }
router.post('/recommendations', async (req, res) => {
  const prefs = req.body?.preferences;

  if (!prefs || typeof prefs !== 'object') {
    return res.status(400).json({ error: 'preferences object required' });
  }

  if (prefs.lookingFor && !['event', 'job', 'both'].includes(prefs.lookingFor)) {
    return res.status(400).json({ error: 'lookingFor must be event, job, or both' });
  }

  if (prefs.extraSearch && typeof prefs.extraSearch !== 'string') {
    return res.status(400).json({ error: 'extraSearch must be a string' });
  }

  if (prefs.extraSearch && prefs.extraSearch.length > 200) {
    return res.status(400).json({ error: 'extraSearch too long (max 200 characters)' });
  }

  try {
    const results = await recommendEducation(prefs);
    res.json({ profiles: results, total: results.length });
  } catch (err) {
    console.error('[education] recommendations error:', err.message);
    res.status(500).json({ error: 'Failed to score education profiles' });
  }
});

export default router;
