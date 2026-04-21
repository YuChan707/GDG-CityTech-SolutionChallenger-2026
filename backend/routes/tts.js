import { Router } from 'express';

const router = Router();

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel — clear, neutral American English
const EL_URL   = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

// POST /api/tts  { text: string }
// Proxies to ElevenLabs so the API key never touches the browser.
router.post('/', async (req, res) => {
  const { text } = req.body ?? {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'TTS service not configured' });
  }

  const upstream = await fetch(EL_URL, {
    method: 'POST',
    headers: {
      'xi-api-key':   apiKey,
      'Content-Type': 'application/json',
      'Accept':       'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.slice(0, 2500),       // ElevenLabs free tier cap
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    console.error('[tts] ElevenLabs error', upstream.status, detail);
    return res.status(upstream.status).json({ error: 'TTS upstream error', detail });
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');

  // Stream the audio bytes directly to the client
  const buffer = await upstream.arrayBuffer();
  return res.end(Buffer.from(buffer));
});

export default router;
