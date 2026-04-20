import rawData from '../../../default-data/Professional-Education.json';

interface RawOrg {
  type: 'event' | 'job';
  'Organization-name': string;
  'Focus-Area': string;
  'User-requirement': string;
  'Program-services': string;
  'Other category': string;
  'link-registration-program'?: string;
  'due-date-register-program'?: string;
}

export interface EducationOrg {
  id: string;
  type: 'event' | 'job';
  name: string;
  focusArea: string;
  requirement: string;
  services: string[];
  otherCategory: string;
  registrationLink?: string;
  dueDate?: string;
}

export const EDUCATION_PROFILES: EducationOrg[] = (rawData as RawOrg[]).map((item, index) => ({
  id: String(index + 1),
  type: item.type,
  name: item['Organization-name'],
  focusArea: item['Focus-Area'],
  requirement: item['User-requirement'],
  services: item['Program-services'].split(',').map(s => s.trim()),
  otherCategory: item['Other category'],
  registrationLink: item['link-registration-program'] || undefined,
  dueDate: item['due-date-register-program'] || undefined,
}));
