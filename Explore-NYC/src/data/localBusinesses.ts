import rawData from '../../../default-data/local-business.json';
import type { Event } from '../types';

interface RawBusiness {
  'name-business': string;
  'description': string;
  'hours-business': string;
  'location': string;
  'category-business': string;
  'focus-business': string;
  'link': string;
  'owner-labels': string;
}

export const LOCAL_BUSINESSES: Event[] = (rawData as RawBusiness[]).map((item, index) => ({
  id: `b${index + 1}`,
  name: item['name-business'],
  date: '',
  time: '',
  description: item['description'],
  category: item['category-business'],
  focus: item['focus-business'],
  is_free: false,
  group_type: [item['focus-business']],
  location: item['location'],
  link: item['link'],
  tags: [item['category-business'], item['focus-business']].filter(Boolean),
  company_hosted: item['owner-labels'] || undefined,
  experience_type: 'local-business',
  operating_hours: item['hours-business'],
}));
