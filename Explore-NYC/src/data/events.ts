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

export const EVENTS: Event[] = (rawData as RawEvent[]).map((item, index) => ({
  id: String(index + 1),
  name: item['name-event'],
  date: item['date-event'],
  time: item['time-event'],
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
  tags: [item['category-event'], item['focus-event'], item['group people']].filter(Boolean),
}));
