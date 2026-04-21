import { Router } from 'express';
import { getAllMapPins } from '../services/map.service.js';

const router = Router();

// GET /api/map/pins — returns all location pins for the home-page map
router.get('/pins', async (_req, res) => {
  try {
    const pins = await getAllMapPins();
    res.json({ pins });
  } catch (err) {
    console.error('[map] pins error:', err.message);
    res.status(500).json({ error: 'Failed to fetch map pins' });
  }
});

export default router;
