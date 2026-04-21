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

// Day abbreviation → JS getDay() value (0=Sun … 6=Sat)
const DAY_NUM: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** Convert "HH:MM" to minutes. "00:00" is treated as end-of-day (1440). */
function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  const mins = h * 60 + m;
  return mins === 0 ? 1440 : mins;
}

/** Expand a day-range string like "Mon-Fri", "Sat-Sun", "Daily", "Mon-Sun" into an array of JS day numbers. */
function expandDays(rangeStr: string): number[] {
  if (rangeStr === 'Daily') return [0, 1, 2, 3, 4, 5, 6];
  const [startAbbr, endAbbr] = rangeStr.split('-');
  if (!endAbbr) return [DAY_NUM[startAbbr]];
  const s = DAY_NUM[startAbbr];
  const e = DAY_NUM[endAbbr];
  if (s <= e) return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  // wraps around week (e.g. "Fri-Mon", "Mon-Sun" where Sun=0 < Mon=1)
  const result: number[] = [];
  for (let d = s; d <= 6; d++) result.push(d);
  for (let d = 0; d <= e; d++) result.push(d);
  return result;
}

interface HoursSegment {
  days: number[];
  openMins: number;
  closeMins: number;
}

/**
 * Parse a business hours string like:
 *   "Mon-Fri 7:00-18:00, Sat-Sun 8:00-16:00"
 *   "Daily 12:00-22:00"
 * into typed segments.
 */
function parseHours(hoursStr: string): HoursSegment[] {
  return hoursStr.split(', ').map(seg => {
    const [daysStr, timeStr] = seg.trim().split(' ');
    const [openStr, closeStr] = timeStr.split('-');
    return {
      days: expandDays(daysStr),
      openMins: toMins(openStr),
      closeMins: toMins(closeStr),
    };
  });
}

/** Is the business open on a given JS day-of-week number? */
function isOpenOnDay(hoursStr: string, day: number): boolean {
  return parseHours(hoursStr).some(seg => seg.days.includes(day));
}

/**
 * Does the business have at least one time slot (on a given day) that overlaps
 * with [fromMins, toMins]? Pass undefined for an open-ended bound.
 */
function isOpenDuringTime(
  hoursStr: string,
  day: number,
  fromMins: number | undefined,
  toMins: number | undefined,
): boolean {
  const segs = parseHours(hoursStr).filter(seg => seg.days.includes(day));
  if (segs.length === 0) return false;
  return segs.some(seg => {
    if (fromMins !== undefined && toMins !== undefined) {
      return seg.openMins < toMins && seg.closeMins > fromMins;
    }
    if (fromMins !== undefined) return seg.closeMins > fromMins;
    if (toMins !== undefined)   return seg.openMins < toMins;
    return true;
  });
}

/**
 * Does the business have ANY time slot (across all days) that overlaps
 * with [fromMins, toMins]? Used when no specific date is selected.
 */
function hasAnyTimeOverlap(
  hoursStr: string,
  fromMins: number | undefined,
  toMins: number | undefined,
): boolean {
  return parseHours(hoursStr).some(seg => {
    if (fromMins !== undefined && toMins !== undefined) {
      return seg.openMins < toMins && seg.closeMins > fromMins;
    }
    if (fromMins !== undefined) return seg.closeMins > fromMins;
    if (toMins !== undefined)   return seg.openMins < toMins;
    return true;
  });
}

/** Is the business open on ANY day within a date range? */
function isOpenInDateRange(hoursStr: string, dateFrom: string, dateTo: string): boolean {
  const start = new Date(dateFrom + 'T00:00:00');
  const end   = new Date(dateTo   + 'T00:00:00');
  const cur   = new Date(start);
  while (cur <= end) {
    if (isOpenOnDay(hoursStr, cur.getDay())) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}

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
        ...(event.tags ?? []),
        ...(event.group_type ?? []),
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

      // Score: price preference match (events only)
      if (event.experience_type !== 'local-business') {
        if (preferences.pricePreference === 'free' && event.is_free) {
          score += 3;
        } else if (preferences.pricePreference === 'up20') {
          if (event.is_free || (event.max_price !== undefined && event.max_price <= 20)) score += 2;
        } else if (preferences.pricePreference === 'up50') {
          if (event.is_free || (event.max_price !== undefined && event.max_price <= 50)) score += 2;
        } else if (preferences.pricePreference === 'any') {
          score += 1;
        }
      }

      return { ...event, relevanceScore: score };
    })
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
}

/**
 * Filter experiences by search, date range, time range, and price preference.
 *
 * Events  → filtered by specific date (YYYY-MM-DD) and exact time (HH:MM).
 * Businesses → filtered by day-of-week derived from the selected date, and
 *              by operating-hours overlap with the selected time range.
 *              Past-event cutoff and price filter are NOT applied to businesses.
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
  const today    = new Date().toISOString().split('T')[0];
  const q        = search.toLowerCase();
  const fromMins = timeFrom ? toMins(timeFrom) : undefined;
  const toMins_  = timeTo   ? toMins(timeTo)   : undefined;

  return events.filter(event => {
    const isBusiness = event.experience_type === 'local-business';

    // ── Hide past events (not applicable to recurring businesses) ───────────
    if (!isBusiness && event.date && event.date < today) return false;

    // ── Search ──────────────────────────────────────────────────────────────
    if (q) {
      const haystack = `${event.name} ${event.description} ${event.location} ${(event.tags ?? []).join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // ── Date filter ─────────────────────────────────────────────────────────
    if (isBusiness && event.operating_hours) {
      if (dateFrom && dateTo) {
        if (!isOpenInDateRange(event.operating_hours, dateFrom, dateTo)) return false;
      } else if (dateFrom) {
        const day = new Date(dateFrom + 'T00:00:00').getDay();
        if (!isOpenOnDay(event.operating_hours, day)) return false;
      }
    } else {
      if (dateFrom && dateTo) {
        if (event.date < dateFrom || event.date > dateTo) return false;
      } else if (dateFrom) {
        if (event.date !== dateFrom) return false;
      }
    }

    // ── Time filter ─────────────────────────────────────────────────────────
    if (isBusiness && event.operating_hours) {
      if (fromMins !== undefined || toMins_ !== undefined) {
        if (dateFrom) {
          // Check hours specifically for the selected day
          const day = new Date(dateFrom + 'T00:00:00').getDay();
          if (!isOpenDuringTime(event.operating_hours, day, fromMins, toMins_)) return false;
        } else {
          // No date selected — check if ANY operating slot overlaps the time range
          if (!hasAnyTimeOverlap(event.operating_hours, fromMins, toMins_)) return false;
        }
      }
    } else if (timeFrom || timeTo) {
      const evStart = event.time;
      const evEnd   = event.time_end ?? event.time;
      // Overlap: event window [evStart, evEnd] overlaps filter window [timeFrom, timeTo]
      if (timeFrom && timeTo) {
        if (evEnd < timeFrom || evStart > timeTo) return false;
      } else if (timeFrom) {
        if (evEnd < timeFrom) return false;
      } else if (timeTo) {
        if (evStart > timeTo) return false;
      }
    }

    // ── Price filter (events only) ───────────────────────────────────────────
    if (!isBusiness) {
      if (pricePreference === 'free' && !event.is_free) return false;
      if (pricePreference === 'up20') {
        if (event.is_free) return false;
        if (event.min_price === undefined || event.min_price > 20) return false;
      }
      if (pricePreference === 'up50') {
        if (event.is_free) return false;
        if (event.min_price === undefined || event.min_price > 50) return false;
      }
    }

    return true;
  });
}
