// Triggered when a user submits the questionnaire.
// Maps their preferences (vibe, interests, custom input) to Instagram hashtags,
// fires an Apify actor run, then processes results through Gemini → Firestore.
// Everything after the initial trigger runs in the background — the HTTP response
// is sent immediately so the user never waits.

import { classifyContent } from '../ai/gemini.service.js';
import { normalizeEvent } from '../processors/event.processor.js';
import { isRelevant } from '../processors/filter.processor.js';
import { matchToExisting } from '../processors/matcher.processor.js';
import { saveEvent } from '../database/firestore.js';

// ─── Hashtag maps ─────────────────────────────────────────────────────────────

const VIBE_HASHTAGS = {
  'Outdoors':              ['nycoutdoors', 'nycparks', 'nycrunning', 'nycnature'],
  'Food & Drinks':         ['nycfood', 'nycfoodtruck', 'nycmarket', 'nycfoodie'],
  'Arts & Culture':        ['nycart', 'nycgallery', 'nycculture', 'nycmuseums'],
  'Sports & Fitness':      ['nycfitness', 'nycyoga', 'nycmarathon', 'nycsports'],
  'Music & Entertainment': ['nycmusic', 'nycfestival', 'nyclive', 'nycevents'],
  'Shopping':              ['nycshopping', 'nycpopup', 'nycfashion'],
  'Gaming & Tech':         ['nyctech', 'nycstartup', 'nycgaming', 'nycdevs'],
  'Wellness':              ['nycwellness', 'nycmeditation', 'nycsoundhealing'],
  'Family Fun':            ['nycfamily', 'nycfamilyfun', 'nycforkids'],
};

const INTEREST_HASHTAGS = {
  'Gaming':      ['nycgaming', 'nycgamedev', 'nycindiegames'],
  'Anime':       ['nycanimefest', 'nycotaku'],
  'Fashion':     ['nycfashion', 'nycstyle'],
  'Music':       ['nycmusic', 'nyclivemusic'],
  'Food':        ['nycfood', 'nycfoodie'],
  'Art':         ['nycart', 'nycgallery'],
  'Running':     ['nycrunning', 'nycmarathon'],
  'Tech':        ['nyctech', 'nycai', 'nycstartup'],
  'Film':        ['nycfilm', 'nycfilmfest'],
  'Dance':       ['nycdance', 'nycperformance'],
  'Photography': ['nycphotography', 'nycphotowalk'],
  'Travel':      ['exploreNYC', 'nyctravel'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function preferencesToHashtags(preferences = {}) {
  const tags = new Set(['nycevents']); // always include base tag

  for (const vibe of preferences.vibe ?? []) {
    for (const tag of VIBE_HASHTAGS[vibe] ?? []) tags.add(tag);
  }

  for (const interest of preferences.interests ?? []) {
    for (const tag of INTEREST_HASHTAGS[interest] ?? []) tags.add(tag);
  }

  // Treat custom free-text words as additional hashtag hints
  for (const word of (preferences.customInput ?? '').split(/[\s,]+/)) {
    const clean = word.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
    if (clean.length > 3) tags.add(`nyc${clean}`);
  }

  return [...tags].slice(0, 7); // 7 hashtags on paid tier
}

// ─── Step 1: trigger Apify actor run ─────────────────────────────────────────

async function triggerApifyRun(hashtags) {
  const { APIFY_TOKEN } = process.env;
  if (!APIFY_TOKEN) {
    console.warn('[demand-pipeline] APIFY_TOKEN not set — skipping Apify trigger');
    return null;
  }

  const res = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hashtags,
        resultsLimit: 5,       // 5 posts per hashtag — enough to find 3 real events
        scrapeType: 'posts',
        proxy: { useApifyProxy: true },
      }),
    }
  );

  if (!res.ok) {
    console.error(`[demand-pipeline] Apify trigger failed: ${res.status}`);
    return null;
  }

  const data = await res.json();
  return data.data?.id ?? null; // runId
}

// ─── Step 2: poll until run finishes ─────────────────────────────────────────

async function waitForRun(runId, maxWaitMs = 5 * 60 * 1000) {
  const { APIFY_TOKEN } = process.env;
  const pollMs = 8000;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, pollMs));

    const res = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    const data = await res.json();
    const status = data.data?.status;

    if (status === 'SUCCEEDED') return data.data.defaultDatasetId;
    if (status === 'FAILED' || status === 'ABORTED') {
      throw new Error(`Apify run ${runId} ended with status: ${status}`);
    }
  }

  throw new Error(`Apify run ${runId} timed out after ${maxWaitMs / 1000}s`);
}

// ─── Step 3: fetch dataset pages ─────────────────────────────────────────────

async function fetchDataset(datasetId) {
  const { APIFY_TOKEN } = process.env;
  const limit = 50;
  let offset = 0;
  const all = [];

  while (true) {
    const url = `https://api.apify.com/v2/datasets/${datasetId}/items` +
      `?token=${APIFY_TOKEN}&limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    const items = await res.json();
    if (!items.length) break;
    for (const item of items) {
      all.push({ ...item, text: item.caption ?? item.text ?? '' });
    }
    if (items.length < limit) break;
    offset += limit;
  }

  return all;
}

// ─── Step 4: classify + save ──────────────────────────────────────────────────

const SAVE_LIMIT = 3; // max new events to add to Firestore per pipeline run

async function processPosts(posts) {
  const today     = new Date().toISOString().slice(0, 10);
  const windowEnd = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  let saved = 0;

  for (const post of posts) {
    if (saved >= SAVE_LIMIT) break; // stop as soon as 3 new events are saved
    if (!isRelevant(post.text)) continue;

    try {
      const aiResult = await classifyContent(post.text);
      if (aiResult.type === 'ignore') continue;
      if (aiResult.date && (aiResult.date < today || aiResult.date > windowEnd)) continue;

      const match = matchToExisting(aiResult);
      if (!match) {
        await saveEvent(normalizeEvent(aiResult));
        saved++;
        console.log(`[demand-pipeline] saved event ${saved}/${SAVE_LIMIT}: "${aiResult.name}"`);
      }
    } catch (err) {
      console.warn('[demand-pipeline] classify error:', err.message);
    }
  }

  return saved;
}

// ─── Public: fire-and-forget entry point ──────────────────────────────────────

export async function triggerDemandPipeline(preferences) {
  const hashtags = preferencesToHashtags(preferences);
  console.log(`[demand-pipeline] hashtags → ${hashtags.join(', ')}`);

  const runId = await triggerApifyRun(hashtags);
  if (!runId) return;

  console.log(`[demand-pipeline] Apify run started: ${runId}`);

  try {
    const datasetId = await waitForRun(runId);
    const posts     = await fetchDataset(datasetId);
    const saved     = await processPosts(posts);
    console.log(`[demand-pipeline] done — ${saved} new events saved to Firestore`);
  } catch (err) {
    console.error('[demand-pipeline] pipeline error:', err.message);
  }
}
