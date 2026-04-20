import { db } from '../database/firestore.js';

const EDUCATION_COLLECTION = 'education';

async function loadProfiles() {
  const snapshot = await db.collection(EDUCATION_COLLECTION).get();
  return snapshot.docs.map(doc => ({ ...doc.data() }));
}

/**
 * Return all profiles, optionally filtered by type and focusArea.
 * @param {{ type?: string, focusArea?: string, search?: string }} filters
 */
export async function queryEducation(filters = {}) {
  const { type, focusArea, search } = filters;
  let profiles = await loadProfiles();

  if (type && type !== 'both') {
    profiles = profiles.filter(p => p.type === type);
  }

  if (focusArea) {
    profiles = profiles.filter(p =>
      p.focusArea.toLowerCase() === focusArea.toLowerCase()
    );
  }

  if (search) {
    const q = search.toLowerCase();
    profiles = profiles.filter(p =>
      `${p.name} ${p.focusArea} ${p.otherCategory} ${p.services.join(' ')}`
        .toLowerCase()
        .includes(q)
    );
  }

  return profiles;
}

/**
 * Score and rank profiles against user preferences.
 * @param {{ focusArea: string, experienceYears: number, extraSearch: string, lookingFor: string }} prefs
 */
export async function recommendEducation(prefs) {
  const { focusArea, experienceYears, extraSearch, lookingFor } = prefs;
  let profiles = await loadProfiles();

  if (lookingFor && lookingFor !== 'both') {
    profiles = profiles.filter(p => p.type === lookingFor);
  }

  const scored = profiles.map(p => {
    let score = 0;

    if (focusArea && p.focusArea.toLowerCase() === focusArea.toLowerCase()) score += 5;

    const [min, max] = parseRequirement(p.requirement);
    const exp = Number(experienceYears ?? -1);
    if (exp >= 0) {
      if (exp >= min && exp <= max) score += 4;
      else if (exp >= min) score += 1;
    }

    if (extraSearch) {
      const hay = `${p.name} ${p.focusArea} ${p.otherCategory} ${p.services.join(' ')}`.toLowerCase();
      if (hay.includes(extraSearch.toLowerCase())) score += 3;
    }

    return { ...p, relevanceScore: score };
  });

  return scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function parseRequirement(req) {
  const r = (req ?? '').toLowerCase();
  const plusMatch  = r.match(/(\d+)\+/);
  if (plusMatch) return [Number(plusMatch[1]), 99];
  const rangeMatch = r.match(/(\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)/);
  if (rangeMatch) return [Number(rangeMatch[1]), Number(rangeMatch[2])];
  const single     = r.match(/^(\d+(?:\.\d+)?)/);
  if (single) return [Number(single[1]), Number(single[1])];
  return [0, 99];
}
