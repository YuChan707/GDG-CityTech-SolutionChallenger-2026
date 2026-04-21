import { Router } from 'express';
import { queryEvents, getEventById } from '../services/events.service.js';

const router = Router();

const VALID_CATEGORIES = new Set(['pop-up', 'educational', 'wellness', 'sports', 'festival', 'gaming']);

// GET /api/events
// Query params: search, date, time, category, is_free
router.get('/', async (req, res) => {
  const { search, date, time, category, is_free } = req.query;

  if (search && search.length > 100)
    return res.status(400).json({ error: 'search param too long (max 100 characters)' });
  if (category && !VALID_CATEGORIES.has(category))
    return res.status(400).json({ error: `category must be one of: ${[...VALID_CATEGORIES].join(', ')}` });
  if (is_free !== undefined && is_free !== 'true' && is_free !== 'false')
    return res.status(400).json({ error: 'is_free must be "true" or "false"' });
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
  if (time && !/^\d{2}:\d{2}$/.test(time))
    return res.status(400).json({ error: 'time must be in HH:MM format' });

  try {
    const events = await queryEvents({ search, date, time, category, is_free });
    res.json({ events, total: events.length });
  } catch (err) {
    console.error('GET /api/events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error('GET /api/events/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

export default router;
