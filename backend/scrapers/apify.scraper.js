// Fetches posts from a completed Apify dataset via the Apify REST API.
// Paginates automatically until all items are retrieved.
// Requires APIFY_TOKEN and APIFY_DATASET_ID in .env

export async function fetchInstagramPosts() {
  const { APIFY_TOKEN, APIFY_DATASET_ID } = process.env;

  if (!APIFY_TOKEN || !APIFY_DATASET_ID) {
    throw new Error('Missing APIFY_TOKEN or APIFY_DATASET_ID in .env');
  }

  const limit = 100;
  let offset = 0;
  const allItems = [];

  while (true) {
    const url =
      `https://api.apify.com/v2/datasets/${APIFY_DATASET_ID}/items` +
      `?token=${APIFY_TOKEN}&limit=${limit}&offset=${offset}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Apify fetch failed: ${res.status} ${res.statusText}`);
    }

    const items = await res.json();
    if (!items.length) break;

    // Normalize Apify's "caption" field to "text" so pipeline.service.js works uniformly
    for (const item of items) {
      allItems.push({ ...item, text: item.caption ?? item.text ?? '' });
    }

    if (items.length < limit) break;
    offset += limit;
  }

  return allItems;
}
