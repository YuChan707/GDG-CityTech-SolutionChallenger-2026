// ElevenLabs TTS — routed through the Express backend to avoid CORS and
// keep the API key off the browser.

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

export function isSpeaking(): boolean {
  return !!currentAudio && !currentAudio.paused;
}

export async function speakText(text: string): Promise<void> {
  stopSpeaking();

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    console.error('[tts] proxy error', res.status, await res.text());
    return;
  }

  const blob  = await res.blob();
  const url   = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  audio.onended = () => {
    URL.revokeObjectURL(url);
    currentAudio = null;
  };
  await audio.play();
}
