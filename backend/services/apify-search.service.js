// Apify search service — uses Apify actors to search for real-world NYC content.
// Actors:
//   apify/google-search-scraper → events & educational programs (returns web snippets)
//   apify/google-maps-scraper   → local businesses (returns Places data)
//
// Uses run-sync-get-dataset-items so results are returned in one HTTP call.
// If APIFY_TOKEN is missing or the actor times out, callers receive an empty array.

const APIFY_BASE = 'https://api.apify.com/v2';

// ── Internal runner ───────────────────────────────────────────────────────────

async function runActorSync(actorId, input, timeoutSecs = 120) {
  const { APIFY_TOKEN } = process.env;
  if (!APIFY_TOKEN) {
    console.warn('[apify-search] APIFY_TOKEN not set — skipping search');
    return [];
  }

  const url =
    `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items` +
    `?token=${APIFY_TOKEN}&timeout=${timeoutSecs}&format=json`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    console.error(`[apify-search] actor ${actorId} failed: ${res.status}`);
    return [];
  }

  return res.json();
}

// ── Events search ─────────────────────────────────────────────────────────────

export async function searchEvents(preferences = {}) {
  const { vibe = [], interests = [], customInput = '' } = preferences;
  const topics = [...vibe, ...interests, customInput].filter(Boolean).join(' ');
  const query  = `NYC events ${topics} 2026 site:eventbrite.com OR site:meetup.com OR site:nycgo.com`;

  const items = await runActorSync('apify/google-search-scraper', {
    queries:          [query],
    resultsPerPage:   10,
    maxPagesPerQuery: 1,
    languageCode:     'en',
    countryCode:      'us',
  });

  return items.map(r => ({
    type:        'event',
    name:        r.title        ?? '',
    description: r.description  ?? '',
    link:        r.url          ?? '',
    location:    'NYC',
    source:      'apify-google-search',
  }));
}

// ── Local businesses search ───────────────────────────────────────────────────

export async function searchBusinesses(preferences = {}) {
  const { vibe = [], category = '' } = preferences;
  const topic      = category || vibe[0] || 'local';
  const searchTerm = `${topic} in New York City`;

  const items = await runActorSync('apify/google-maps-scraper', {
    searchStringsArray:          [searchTerm],
    maxCrawledPlacesPerSearch:   10,
    language:                    'en',
    countryCode:                 'us',
    includeImages:               false,
    includeOpeningHours:         false,
  });

  return items.map(r => ({
    type:        'business',
    name:        r.title        ?? '',
    description: r.description  ?? '',
    address:     r.address      ?? '',
    rating:      r.totalScore   ?? null,
    link:        r.website      ?? r.url ?? '',
    phone:       r.phone        ?? '',
    category:    r.categoryName ?? '',
    coordinates: r.location
      ? { lat: r.location.lat, lng: r.location.lng }
      : null,
    location:    r.address      ?? 'NYC',
    source:      'apify-google-maps',
  }));
}

// ── Educational programs search ───────────────────────────────────────────────

export async function searchEducation(preferences = {}) {
  const { focusArea = '', lookingFor = 'both' } = preferences;

  const typeKeywords =
    lookingFor === 'job'   ? 'jobs internships hiring NYC'           :
    lookingFor === 'event' ? 'professional events workshops programs NYC' :
                             'jobs programs training workshops NYC';

  const query = `${focusArea} ${typeKeywords} 2026`;

  const items = await runActorSync('apify/google-search-scraper', {
    queries:          [query],
    resultsPerPage:   10,
    maxPagesPerQuery: 1,
    languageCode:     'en',
    countryCode:      'us',
  });

  return items.map(r => ({
    type:        lookingFor === 'job' ? 'job' : 'event',
    name:        r.title        ?? '',
    description: r.description  ?? '',
    link:        r.url          ?? '',
    focusArea:   focusArea      || 'General',
    location:    'NYC',
    source:      'apify-google-search',
  }));
}
