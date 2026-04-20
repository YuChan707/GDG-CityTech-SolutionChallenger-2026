// ⚠️ STATIC FALLBACK — using hardcoded JSON, NOT the backend or Apify
// TODO: Replace this import with a real API call, e.g.:
//   const rawData = await fetch('/api/events').then(r => r.json());
// Once the Apify pipeline (backend/pipeline/run.js) pushes data to Firestore,
// the backend route GET /api/events will serve live data instead.
import rawData from '../../../default-data/events.json';
import type { Event } from '../types';

interface RawEvent {
  'name-event': string;
  'date-event': string;
  'time-event': string;
  'description-event': string;
  'category-event': string;
  'focus-event': string;
  'is-free': boolean;
  'min-price'?: number;
  'max-price'?: number;
  'group people': string;
  'link-event': string;
  'company-hosted'?: string;
  'hosted-name'?: string;
}

export const EVENTS: Event[] = (rawData as RawEvent[]).map((item, index) => {
  const timeParts = item['time-event'].split('-');
  const timeStart = timeParts[0];
  const timeEnd   = timeParts.length === 2 ? timeParts[1] : undefined;
  return {
  id: String(index + 1),
  name: item['name-event'],
  date: item['date-event'],
  time: timeStart,
  time_end: timeEnd,
  description: item['description-event'],
  category: item['category-event'],
  focus: item['focus-event'],
  is_free: item['is-free'],
  min_price: item['min-price'],
  max_price: item['max-price'],
  group_type: [item['group people']],
  location: '',
  link: item['link-event'],
  company_hosted: item['company-hosted'] || undefined,
  experience_type: 'event',
  tags: [item['category-event'], item['focus-event'], item['group people']].filter(Boolean),
  };
});
