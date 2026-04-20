// End-to-end pipeline test
// Run from backend/: node scripts/test-e2e.js
//
// Steps:
//   1. Apify  — scrape 3 posts from #nycevents + #nycfood
//   2. Gemini — classify each post (event / business / ignore)
//   3. Gemini — legitimacy check on classified results
//   4. Firestore — save approved items
//   5. Firestore — read back and confirm they appear

import 'dotenv/config';
import { classifyContent }         from '../ai/gemini.service.js';
import { validateLegitimacyBatch } from '../ai/gemini.service.js';
import { normalizeEvent }          from '../processors/event.processor.js';
import { isRelevant }              from '../processors/filter.processor.js';
import { db }                      from '../database/firestore.js';

const HASHTAGS     = ['nycevents', 'nycfood'];
const POSTS_LIMIT  = 3;   // posts per hashtag from Apify
const SAVE_LIMIT   = 3;   // max items to write to Firestore

const sep  = (label) => console.log(`\n${'─'.repeat(50)}\n  ${label}\n${'─'.repeat(50)}`);
const ok   = (msg)   => console.log(`  ✅  ${msg}`);
const warn = (msg)   => console.log(`  ⚠️   ${msg}`);
const info = (msg)   => console.log(`  ℹ️   ${msg}`);

// ── Step 1: Apify ─────────────────────────────────────────────────────────────

async function apifyStep() {
  sep('STEP 1 — Apify: scrape Instagram hashtags');

  const { APIFY_TOKEN } = process.env;
  if (!APIFY_TOKEN) {
    warn('APIFY_TOKEN not set in .env — skipping Apify step');
    return [];
  }

  info(`Triggering Apify actor for hashtags: ${HASHTAGS.join(', ')}`);

  const triggerRes = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hashtags: HASHTAGS,
        resultsLimit: POSTS_LIMIT,
        scrapeType: 'posts',
        proxy: { useApifyProxy: true },
      }),
    }
  );

  if (!triggerRes.ok) {
    warn(`Apify trigger failed: ${triggerRes.status} ${triggerRes.statusText}`);
    return [];
  }

  const triggerData = await triggerRes.json();
  const runId = triggerData.data?.id;
  ok(`Apify run started — runId: ${runId}`);
  info('Polling for completion (up to 3 min)…');

  // Poll
  const deadline = Date.now() + 3 * 60_000;
  let datasetId = null;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 8000));
    const pollRes  = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
    const pollData = await pollRes.json();
    const status   = pollData.data?.status;
    info(`  … status: ${status}`);
    if (status === 'SUCCEEDED') { datasetId = pollData.data.defaultDatasetId; break; }
    if (status === 'FAILED' || status === 'ABORTED') { warn(`Run ended: ${status}`); return []; }
  }

  if (!datasetId) { warn('Timed out waiting for Apify run'); return []; }

  // Fetch dataset
  const dataRes  = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=20`
  );
  const items    = await dataRes.json();
  const posts    = items.map(i => ({ ...i, text: i.caption ?? i.text ?? '' }));

  ok(`Apify returned ${posts.length} post(s)`);
  posts.forEach((p, i) => info(`  [${i + 1}] ${p.text.slice(0, 80).replace(/\n/g, ' ')}…`));
  return posts;
}

// ── Step 2 & 3: Gemini classify + legitimacy check ────────────────────────────

async function geminiStep(posts) {
  sep('STEP 2 — Gemini: classify posts');

  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) {
    warn('GEMINI_API_KEY not set — skipping Gemini step');
    return [];
  }

  const relevant = posts.filter(p => isRelevant(p.text));
  info(`${relevant.length}/${posts.length} posts passed relevance filter`);

  const classified = [];
  for (const post of relevant) {
    try {
      const result = await classifyContent(post.text);
      info(`  classify → type: ${result.type}  name: "${result.name}"  date: ${result.date || '?'}`);
      if (result.type !== 'ignore') classified.push({ post, result });
    } catch (err) {
      warn(`  classify error: ${err.message}`);
    }
  }
  ok(`${classified.length} post(s) classified as event or business`);

  if (!classified.length) return [];

  sep('STEP 3 — Gemini: legitimacy check');

  const items   = classified.map(({ result }) => ({
    type:     result.type,
    name:     result.name,
    location: result.location,
    category: result.category,
    date:     result.date,
  }));

  let legitimacyResults;
  try {
    legitimacyResults = await validateLegitimacyBatch(items);
  } catch (err) {
    warn(`Legitimacy batch failed: ${err.message}`);
    return [];
  }

  const approved = [];
  for (let i = 0; i < classified.length; i++) {
    const leg = legitimacyResults[i];
    const name = classified[i].result.name;
    if (leg.is_legitimate) {
      ok(`  APPROVED  "${name}" — ${leg.reason} (${leg.confidence} confidence)`);
      approved.push(classified[i].result);
    } else {
      warn(`  REJECTED  "${name}" — ${leg.reason}`);
    }
  }

  return approved.slice(0, SAVE_LIMIT);
}

// ── Step 4: Firestore save ────────────────────────────────────────────────────

async function firestoreWriteStep(approved) {
  sep('STEP 4 — Firestore: save approved items');

  if (!approved.length) {
    warn('Nothing to save — skipping');
    return [];
  }

  const savedIds = [];
  for (const item of approved) {
    const event = normalizeEvent(item);
    const id    = `${(event.title ?? 'event').toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, '')}-${event.date ?? 'no-date'}`;
    await db.collection('events').doc(id).set(event, { merge: true });
    ok(`Saved: [${id}]  "${event.title}"  ${event.date ?? 'no date'}  ${event.location ?? ''}`);
    savedIds.push(id);
  }

  return savedIds;
}

// ── Step 5: Firestore read-back ───────────────────────────────────────────────

async function firestoreReadStep(savedIds) {
  sep('STEP 5 — Firestore: read back saved items');

  if (!savedIds.length) {
    warn('No IDs to read back');
    return;
  }

  for (const id of savedIds) {
    const doc = await db.collection('events').doc(id).get();
    if (doc.exists) {
      const d = doc.data();
      ok(`Found: [${id}]  "${d.title}"  date: ${d.date}  category: ${d.category}`);
    } else {
      warn(`NOT FOUND in Firestore: [${id}]`);
    }
  }
}

// ── Runner ────────────────────────────────────────────────────────────────────

sep('NYC EXPLORER — END-TO-END PIPELINE TEST');
console.log('  Hashtags  :', HASHTAGS.join(', '));
console.log('  Posts/tag :', POSTS_LIMIT);
console.log('  Save limit:', SAVE_LIMIT);

const posts    = await apifyStep();
const approved = await geminiStep(posts);
const savedIds = await firestoreWriteStep(approved);
await firestoreReadStep(savedIds);

sep('TEST COMPLETE');
console.log(`  Scraped: ${posts.length} posts`);
console.log(`  Approved by Gemini: ${approved.length}`);
console.log(`  Saved to Firestore: ${savedIds.length}`);
console.log('');
process.exit(0);
