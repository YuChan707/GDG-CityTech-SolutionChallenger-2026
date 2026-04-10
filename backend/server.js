import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events.js';
import recommendationsRouter from './routes/recommendations.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/events', eventsRouter);
app.use('/api/recommendations', recommendationsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Explore NYC API' });
});

/**
 * TODO: Firestore integration
 * import { Firestore } from '@google-cloud/firestore';
 * const db = new Firestore({ projectId: process.env.GCP_PROJECT_ID });
 *
 * TODO: BigQuery integration (analytics / trend detection)
 * import { BigQuery } from '@google-cloud/bigquery';
 * const bigquery = new BigQuery({ projectId: process.env.GCP_PROJECT_ID });
 */

app.listen(PORT, () => {
  console.log(`Explore NYC API running on http://localhost:${PORT}`);
});
