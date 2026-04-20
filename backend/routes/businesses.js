import { Router } from 'express';
import { db } from '../database/firestore.js';

const router = Router();
const COLLECTION = 'businesses';

// GET /api/businesses
// Returns only active businesses (is_active != false)
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const snap = await db.collection(COLLECTION).where('is_active', '!=', false).get();

    let businesses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (category) {
      businesses = businesses.filter(b => b.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      businesses = businesses.filter(b =>
        `${b.name} ${b.description} ${b.location}`.toLowerCase().includes(q)
      );
    }

    res.json({ businesses, total: businesses.length });
  } catch (err) {
    console.error('GET /api/businesses error:', err);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

export default router;
