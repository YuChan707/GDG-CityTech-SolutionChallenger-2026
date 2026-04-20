// Secure API client — all requests go through the Vite proxy (/api → localhost:3001).
// Falls back to static JSON if the backend is unreachable (dev without backend running).

import type { Event } from '../types';
import staticEvents      from '../../../../default-data/events.json';
import staticBusinesses  from '../../../../default-data/local-business.json';

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
    const data = await apiFetch<{ events: Event[] }>(`/api/events${qs ? `?${qs}` : ''}`);
    return data.events;
  } catch {
    // Backend unreachable — use static fallback silently in dev
    console.warn('[backend.ts] /api/events unreachable, using static fallback');
    return (staticEvents as any[]).map((item, i) => ({
      id: String(i + 1),
      name: item['name-event'],
      date: item['date-event'],
      time: item['time-event'].split('-')[0],
      time_end: item['time-event'].split('-')[1],
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
      experience_type: 'event' as const,
      tags: [item['category-event'], item['focus-event'], item['group people']].filter(Boolean),
    }));
  }
}

// ─── Local businesses ─────────────────────────────────────────────────────────

export async function fetchBusinesses(): Promise<Event[]> {
  try {
    const data = await apiFetch<{ businesses: Event[] }>('/api/businesses');
    return data.businesses;
  } catch {
    console.warn('[backend.ts] /api/businesses unreachable, using static fallback');
    return (staticBusinesses as any[]).map((item, i) => ({
      id: `b${i + 1}`,
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
      experience_type: 'local-business' as const,
      operating_hours: item['hours-business'],
      is_active: item['is_active'] ?? true,
    }));
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
