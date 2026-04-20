// Terminal test for the Gemini classify pipeline.
// Run from the backend/ directory:
//   node scripts/test-gemini.js
//   node scripts/test-gemini.js "your custom caption here"

import 'dotenv/config';
import { classifyContent } from '../ai/gemini.service.js';

// Sample Instagram captions — one per category
const SAMPLES = [
  {
    label: 'Local event',
    text: '🎉 Join us this Saturday May 18 at Central Park for a free morning yoga session! All levels welcome. 8AM – 9:30AM. RSVP at the link in bio. #nycevents #yoga #centralparknyc',
  },
  {
    label: 'Tech networking',
    text: 'NYC Tech Startup Networking Meetup — May 15 @ 7PM in Midtown. Connect with founders, developers & investors. Tickets $15–$30. #nycstartup #techmeetup #networking',
  },
  {
    label: 'Local business',
    text: 'We are open! Come visit Brooklyn Street Bites food truck today 12PM–10PM on Atlantic Ave. Try our new Korean-Mexican fusion tacos 🌮 #brooklyn #foodtruck #streetfood',
  },
  {
    label: 'Irrelevant / noise',
    text: 'Just had the best coffee this morning ☕ vibes only #aesthetic #morning',
  },
];

// Allow passing a custom caption as CLI argument
const customCaption = process.argv[2];
const tests = customCaption
  ? [{ label: 'Custom input', text: customCaption }]
  : SAMPLES;

console.log('=== Gemini classify test ===\n');

for (const { label, text } of tests) {
  console.log(`── ${label} ──`);
  console.log(`Input: "${text.slice(0, 80)}..."\n`);

  try {
    const result = await classifyContent(text);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
  }

  console.log('');
}
