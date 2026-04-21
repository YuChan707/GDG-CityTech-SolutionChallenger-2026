import express from 'express';
import { triggerDemandPipeline } from '../services/demand-pipeline.service.js';

const router = express.Router();

// POST /api/pipeline/trigger
// Responds immediately — pipeline runs in the background.
router.post('/trigger', (req, res) => {
  const preferences = req.body?.preferences ?? req.body ?? {};
  res.json({ status: 'triggered' });
  triggerDemandPipeline(preferences).catch(err =>
    console.error('[pipeline route] unhandled error:', err.message)
  );
});

export default router;
