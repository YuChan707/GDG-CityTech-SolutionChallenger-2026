// /services/pipeline.service.js

import { fetchInstagramPosts } from "../scrapers/apify.scraper.js";
import { classifyContent } from "../ai/gemini.service.js";
import { normalizeEvent } from "../processors/event.processor.js";
import { saveEvent } from "../database/firestore.js";
import { isRelevant } from "../processors/filter.processor.js";

export const runPipeline = async () => {
  const posts = await fetchInstagramPosts();

  for (const post of posts) {
    if (!isRelevant(post.text)) continue;

    const aiResult = await classifyContent(post.text);

    if (aiResult.type === "event") {
      const event = normalizeEvent(aiResult);
      await saveEvent(event);
    }
  }
};