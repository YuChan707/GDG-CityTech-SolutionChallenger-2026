import { Router } from 'express';
import { getDailyPick, getWeeklyPicks } from '../services/daily-pick.service.js';

const router = Router();

// GET /api/daily-pick
// Returns today's featured event or local business (1 Apify + 1 Gemini call max per day).
router.get('/', async (_req, res) => {
  try {
    const pick = await getDailyPick();
    if (!pick) return res.status(204).json({ message: 'No relevant item found for today' });
    res.json(pick);
  } catch (err) {
    console.error('GET /api/daily-pick error:', err);
    res.status(500).json({ error: 'Failed to fetch daily pick' });
  }
});

// GET /api/daily-pick/week
// Returns all cached picks for the current 7-day window (no extra API calls).
router.get('/week', async (_req, res) => {
  try {
    const picks = await getWeeklyPicks();
    res.json({ picks, total: picks.length });
  } catch (err) {
    console.error('GET /api/daily-pick/week error:', err);
    res.status(500).json({ error: 'Failed to fetch weekly picks' });
  }
});

export default router;
