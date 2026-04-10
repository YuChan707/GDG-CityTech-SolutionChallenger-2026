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

// GET /api/events
// Query params: search, date, time, category, is_free
router.get('/', (req, res) => {
  let events = loadEvents();
  const { search, date, time, category, is_free } = req.query;

  if (search) {
    const q = search.toLowerCase();
    events = events.filter(e =>
      `${e.name} ${e.description} ${e.location} ${e.tags.join(' ')}`.toLowerCase().includes(q)
    );
  }
  if (date) events = events.filter(e => e.date === date);
  if (time) events = events.filter(e => e.time >= time);
  if (category) events = events.filter(e => e.category === category);
  if (is_free !== undefined) events = events.filter(e => e.is_free === (is_free === 'true'));

  res.json({ events, total: events.length });
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  const events = loadEvents();
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

export default router;
