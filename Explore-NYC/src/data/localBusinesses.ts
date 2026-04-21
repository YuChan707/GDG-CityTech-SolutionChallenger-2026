// ⛔ Static JSON disabled — data now comes from GET /api/businesses via src/api/backend.ts
// To restore offline fallback, uncomment the import and the mapping block below.
//
// import rawData from '../../../default-data/local-business.json';
// export const LOCAL_BUSINESSES: Event[] = (rawData as RawBusiness[]).map((item, index) => { ... });

import type { Event } from '../types';

// Empty — ResultsPage fetches live data from the backend instead.
export const LOCAL_BUSINESSES: Event[] = [];
