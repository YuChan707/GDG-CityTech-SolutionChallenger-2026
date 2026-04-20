// /api/controllers/events.controller.js

import { db } from "../../database/firestore.js";

export const getEvents = async (req, res) => {
  const snapshot = await db.collection("events").get();

  const events = snapshot.docs.map(doc => doc.data());

  res.json(events);
};