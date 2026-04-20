// ⛔ Static JSON disabled — data now comes from GET /api/events via src/api/backend.ts
// To restore offline fallback, uncomment the import and the mapping block below.
//
// import rawData from '../../../default-data/events.json';
// export const EVENTS: Event[] = (rawData as RawEvent[]).map((item, index) => { ... });

import type { Event } from '../types';

// Empty — ResultsPage fetches live data from the backend instead.
export const EVENTS: Event[] = [];
