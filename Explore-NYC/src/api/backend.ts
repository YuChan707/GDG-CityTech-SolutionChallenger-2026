// Secure API client — all requests go through the Vite proxy (/api → localhost:3001).
// Falls back to static JSON if the backend is unreachable (dev without backend running).

import type { Event } from '../types';
// ⛔ Static fallbacks disabled — using live backend data.
// import staticEvents     from '../../../../default-data/events.json';
// import staticBusinesses from '../../../../default-data/local-business.json';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiEvent extends Event {}

export interface DailyPick {
  date_picked:      string;
  type:             'event' | 'business';
  matched_existing: boolean;
  matched_source:   string | null;
  title?:           string;
  date?:            string;
  category?:        string;
  location?:        string;
}

// ─── Internal helper ──────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function fetchEvents(params?: {
  search?:   string;
  date?:     string;
  category?: string;
  is_free?:  boolean;
}): Promise<Event[]> {
  try {
    const query = new URLSearchParams();
    if (params?.search)            query.set('search',   params.search);
    if (params?.date)              query.set('date',     params.date);
    if (params?.category)          query.set('category', params.category);
    if (params?.is_free !== undefined) query.set('is_free', String(params.is_free));

    const qs = query.toString();
    const url = qs ? `/api/events?${qs}` : '/api/events';
    const data = await apiFetch<{ events: Event[] }>(url);
    return data.events;
  } catch (err) {
    console.warn('[backend.ts] /api/events unreachable:', err);
    return [];
  }
}

// ─── Local businesses ─────────────────────────────────────────────────────────

export async function fetchBusinesses(): Promise<Event[]> {
  try {
    const data = await apiFetch<{ businesses: Event[] }>('/api/businesses');
    return data.businesses;
  } catch (err) {
    console.warn('[backend.ts] /api/businesses unreachable:', err);
    return [];
  }
}

// ─── Daily pick ───────────────────────────────────────────────────────────────

export async function fetchDailyPick(): Promise<DailyPick | null> {
  try {
    return await apiFetch<DailyPick>('/api/daily-pick');
  } catch {
    console.warn('[backend.ts] /api/daily-pick unreachable');
    return null;
  }
}

export async function fetchWeeklyPicks(): Promise<DailyPick[]> {
  try {
    const data = await apiFetch<{ picks: DailyPick[] }>('/api/daily-pick/week');
    return data.picks;
  } catch {
    console.warn('[backend.ts] /api/daily-pick/week unreachable');
    return [];
  }
}

// ─── Demand pipeline ─────────────────────────────────────────────────────────

export async function triggerPipeline(preferences: Record<string, unknown>): Promise<void> {
  try {
    await apiFetch<{ status: string }>('/api/pipeline/trigger', {
      method: 'POST',
      body: JSON.stringify({ preferences }),
    });
  } catch {
    // fire-and-forget — silently ignore failures
  }
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export async function fetchRecommendations(preferences: Record<string, unknown>): Promise<Event[]> {
  try {
    const data = await apiFetch<{ recommendations: Event[] }>('/api/recommendations', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
    return data.recommendations;
  } catch {
    console.warn('[backend.ts] /api/recommendations unreachable');
    return [];
  }
}
