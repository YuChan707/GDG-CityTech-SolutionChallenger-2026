import { Router } from 'express';
import { saveSuggestion } from '../services/suggestions.service.js';

const router = Router();

const VALID_TYPES = new Set(['event', 'local-business', 'professional-event', 'job']);

// POST /api/suggestions
// Body: { type, name, link }
router.post('/', async (req, res) => {
  const { type, name, link } = req.body ?? {};

  if (!type || !VALID_TYPES.has(type))
    return res.status(400).json({ error: 'type must be event, local-business, professional-event, or job' });

  if (!name || typeof name !== 'string' || name.trim().length === 0)
    return res.status(400).json({ error: 'name is required' });

  if (name.trim().length > 120)
    return res.status(400).json({ error: 'name too long (max 120 characters)' });

  if (!link || typeof link !== 'string' || link.trim().length === 0)
    return res.status(400).json({ error: 'link is required' });

  if (link.trim().length > 500)
    return res.status(400).json({ error: 'link too long (max 500 characters)' });

  try {
    const id = await saveSuggestion({ type, name: name.trim(), link: link.trim() });
    res.status(201).json({ id });
  } catch (err) {
    console.error('[suggestions] save error:', err.message);
    res.status(500).json({ error: 'Failed to save suggestion' });
  }
});

export default router;
