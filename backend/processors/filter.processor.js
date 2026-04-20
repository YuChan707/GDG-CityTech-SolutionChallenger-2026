export const isRelevant = (text) => {
  const keywords = ["event", "tickets", "RSVP", "join", "location"];
  return keywords.some(k => text.toLowerCase().includes(k));
};