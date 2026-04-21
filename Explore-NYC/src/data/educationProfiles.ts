// Static fallback data — used when the backend API is unreachable.
// Source files: default-data/jobs-internships-program.json
//               default-data/professional-events.json

import jobsRaw    from '../../../default-data/jobs-internships-program.json';
import proEvRaw   from '../../../default-data/professional-events.json';

// ── Raw shapes ────────────────────────────────────────────────────────────────

interface RawJob {
  'Organization-name': string;
  'Focus-Area': string;
  'User-requirement': string;
  'Program-services': string;
  'Other category': string;
  location?: string;
  'link-registration-program'?: string;
  'due-date-register-program'?: string;
}

interface RawProEvent {
  'name-event': string;
  'focus-event'?: string;
  'category-event'?: string;
  'description-event'?: string;
  location?: string;
  'link-event'?: string;
  'date-event'?: string;
}

// ── Shared type ───────────────────────────────────────────────────────────────

export interface EducationOrg {
  id:                string;
  type:              'event' | 'job';
  name:              string;
  focusArea:         string;
  requirement:       string;
  services:          string[];
  otherCategory:     string;
  location?:         string;
  registrationLink?: string;
  dueDate?:          string;
  relevanceScore?:   number;
}

// ── Normalise jobs & internships ──────────────────────────────────────────────

const jobs: EducationOrg[] = (jobsRaw as RawJob[]).map((o, i) => ({
  id:               `job-${i + 1}`,
  type:             'job',
  name:             o['Organization-name'],
  focusArea:        o['Focus-Area'],
  requirement:      o['User-requirement'],
  services:         o['Program-services'].split(',').map(s => s.trim()).filter(Boolean),
  otherCategory:    o['Other category'],
  location:         o.location,
  registrationLink: o['link-registration-program'] || undefined,
  dueDate:          o['due-date-register-program'] || undefined,
}));

// ── Normalise professional events ─────────────────────────────────────────────

const proEvents: EducationOrg[] = (proEvRaw as RawProEvent[]).map((e, i) => ({
  id:               `event-${i + 1}`,
  type:             'event',
  name:             e['name-event'],
  focusArea:        e['category-event'] ?? 'Professional Development',
  requirement:      '',
  services:         e['description-event'] ? [e['description-event']] : [],
  otherCategory:    e['category-event'] ?? '',
  location:         e.location,
  registrationLink: e['link-event'] || undefined,
  dueDate:          e['date-event'] || undefined,
}));

// ── Merged export ─────────────────────────────────────────────────────────────

export const EDUCATION_PROFILES: EducationOrg[] = [...proEvents, ...jobs];
