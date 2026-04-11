import type { Event, UserPreferences } from '../types';

// Maps user vibe selections to event category/tag keywords
const VIBE_KEYWORDS: Record<string, string[]> = {
  'Outdoors': ['outdoor', 'park', 'marathon', 'wellness', 'running', 'sports'],
  'Food & Drinks': ['food', 'market', 'vendors', 'trucks', 'festival', 'foodies'],
  'Arts & Culture': ['art', 'cultural', 'museum', 'gallery', 'design', 'style'],
  'Sports & Fitness': ['fitness', 'sports', 'running', 'marathon', 'yoga', 'health'],
  'Music & Entertainment': ['music', 'DJ', 'festival', 'entertainment', 'gaming', 'indie'],
  'Shopping': ['shopping', 'fashion', 'boutique', 'streetwear', 'pop-up'],
  'Gaming & Tech': ['gaming', 'tech', 'AI', 'coding', 'developers', 'startup'],
  'Wellness': ['wellness', 'yoga', 'meditation', 'health', 'fitness'],
  'Family Fun': ['family', 'festival', 'outdoor', 'food', 'all ages'],
};

const GROUP_KEYWORDS: Record<string, string[]> = {
  'Solo': ['solo', 'academics', 'professionals'],
  'Friends': ['friends', 'foodies', 'gamers', 'fashion'],
  'Couple': ['couple', 'foodies', 'fashion'],
  'Family': ['family', 'families', 'all ages'],
};

/**
 * Scores events based on user preferences using keyword matching.
 * This is a placeholder for Vertex AI-based scoring.
 *
 * TODO: Replace with Vertex AI recommendation endpoint:
 * POST https://REGION-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/REGION/endpoints/ENDPOINT_ID:predict
 */
export function scoreEvents(events: Event[], preferences: UserPreferences): Event[] {
  return events
    .map(event => {
      let score = 0;
      const searchableText = [
        event.name,
        event.description,
        event.category,
        ...event.tags,
        ...event.group_type,
      ].join(' ').toLowerCase();

      // Score: vibe match (3pts each)
      preferences.vibe.forEach(vibe => {
        const keywords = VIBE_KEYWORDS[vibe] || [];
        if (keywords.some(kw => searchableText.includes(kw.toLowerCase()))) {
          score += 3;
        }
      });

      // Score: group type match (2pts)
      const groupKw = GROUP_KEYWORDS[preferences.groupType] || [];
      if (groupKw.some(kw => searchableText.includes(kw.toLowerCase()))) {
        score += 2;
      }

      // Score: custom interests keyword match (2pts each)
      const interestWords = [
        ...preferences.interests,
        ...preferences.customInput.split(/[\s,]+/).filter(w => w.length > 2),
      ];
      interestWords.forEach(word => {
        if (searchableText.includes(word.toLowerCase())) {
          score += 2;
        }
      });

      // Score: price preference match
      if (preferences.pricePreference === 'free' && event.is_free) {
        score += 3;
      } else if (preferences.pricePreference === 'up20') {
        if (event.is_free || (event.max_price !== undefined && event.max_price <= 20)) score += 2;
      } else if (preferences.pricePreference === 'up50') {
        if (event.is_free || (event.max_price !== undefined && event.max_price <= 50)) score += 2;
      } else if (preferences.pricePreference === 'any') {
        score += 1;
      }

      return { ...event, relevanceScore: score };
    })
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
}

/**
 * Filter events by search, date range, time range, and price preference.
 * dateFrom/dateTo: YYYY-MM-DD. If only dateFrom → exact day. Both → inclusive range.
 * timeFrom/timeTo: HH:MM. Events whose time falls within the window.
 */
export function filterEvents(
  events: Event[],
  search: string,
  dateFrom: string,
  dateTo: string,
  timeFrom: string,
  timeTo: string,
  pricePreference = 'any',
): Event[] {
  const today = new Date().toISOString().split('T')[0];
  const q = search.toLowerCase();
  return events.filter(event => {
    // Always hide events that have already passed
    if (event.date < today) return false;
    if (q) {
      const haystack = `${event.name} ${event.description} ${event.location} ${event.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (dateFrom && dateTo) {
      if (event.date < dateFrom || event.date > dateTo) return false;
    } else if (dateFrom) {
      if (event.date !== dateFrom) return false;
    }
    if (timeFrom && event.time < timeFrom) return false;
    if (timeTo && event.time > timeTo) return false;
    if (pricePreference === 'free' && !event.is_free) return false;
    if (pricePreference === 'up20') {
      if (event.is_free) return false;
      if (event.min_price === undefined || event.min_price > 20) return false;
    }
    if (pricePreference === 'up50') {
      if (event.is_free) return false;
      if (event.min_price === undefined || event.min_price > 50) return false;
    }
    return true;
  });
}
