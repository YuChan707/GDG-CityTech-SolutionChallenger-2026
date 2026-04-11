import rawData from '../../../default-data/Professional-Education.json';

interface RawOrg {
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
  name: string;
  focusArea: string;
  requirement: string;
  services: string[];
  otherCategory: string;
  registrationLink?: string;
  dueDate?: string;           // YYYY-MM-DD
}

export const EDUCATION_PROFILES: EducationOrg[] = (rawData as RawOrg[]).map((item, index) => ({
  id: String(index + 1),
  name: item['Organization-name'],
  focusArea: item['Focus-Area'],
  requirement: item['User-requirement'],
  services: item['Program-services'].split(',').map(s => s.trim()),
  otherCategory: item['Other category'],
  registrationLink: item['link-registration-program'] || undefined,
  dueDate: item['due-date-register-program'] || undefined,
}));
