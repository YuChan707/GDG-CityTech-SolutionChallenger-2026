// Run from backend/ directory: node scripts/test-firestore.js
// Tests Firestore connection and shows what's in the events collection.

import 'dotenv/config';
import { db } from '../database/firestore.js';

console.log('Testing Firestore connection...\n');

try {
  const snapshot = await db.collection('events').limit(3).get();

  if (snapshot.empty) {
    console.log('✅ Connected — but the events collection is EMPTY.');
    console.log('   Run: npm run seed   to populate it.');
  } else {
    console.log(`✅ Connected — ${snapshot.size} doc(s) returned (showing up to 3):\n`);
    snapshot.forEach(doc => {
      const d = doc.data();
      console.log(`  [${doc.id}] ${d.name} — ${d.date}`);
    });
  }
} catch (err) {
  console.error('❌ Firestore error:', err.message);
  console.error('\nFull error:', err);
}
