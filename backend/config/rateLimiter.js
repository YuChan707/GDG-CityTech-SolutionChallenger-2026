import { rateLimit } from 'express-rate-limit';

function buildHandler(label) {
  return (req, res) => {
    const resetDate = req.rateLimit?.resetTime;
    const retryAt = resetDate
      ? resetDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'a few minutes';

    res.status(429).json({
      error: `Too many requests (${label}). Please try again at ${retryAt}.`,
      retryAt,
    });
  };
}

// Applied to every route: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: buildHandler('global limit'),
});

// Tighter limit on /api/recommendations — each call reads all Firestore events
export const recommendationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: buildHandler('recommendation limit'),
});
