import { useState } from 'react';
import HearingIcon from '@mui/icons-material/Hearing';
import { speakText, stopSpeaking } from '../utils/tts';

interface Props {
  getText: () => string;
  /** Size in px for the icon. Default 20. */
  size?: number;
  /** Tooltip label shown on hover. */
  label?: string;
  /** Inline style overrides for the button wrapper. */
  style?: React.CSSProperties;
}

export default function HearButton({ getText, size = 20, label = 'Read aloud', style }: Readonly<Props>) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle');

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();

    if (state === 'playing' || state === 'loading') {
      stopSpeaking();
      setState('idle');
      return;
    }

    setState('loading');
    try {
      await speakText(getText());
      setState('playing');
      // Reset to idle after audio finishes — poll every 300 ms
      const check = setInterval(() => {
        if (!document.hidden) {
          import('../utils/tts').then(({ isSpeaking }) => {
            if (!isSpeaking()) {
              setState('idle');
              clearInterval(check);
            }
          });
        }
      }, 300);
    } catch {
      setState('idle');
    }
  }

  const isActive = state !== 'idle';

  return (
    <button
      onClick={handleClick}
      title={isActive ? 'Stop reading' : label}
      aria-label={isActive ? 'Stop reading' : label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        transition: 'opacity 0.15s, transform 0.15s',
        ...style,
      }}
    >
      {state === 'loading' ? (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            display: 'inline-block',
            animation: 'tts-spin 0.7s linear infinite',
          }}
        />
      ) : (
        <HearingIcon
          style={{
            fontSize: size,
            color: isActive ? '#F04251' : 'inherit',
            transition: 'color 0.2s',
          }}
        />
      )}
      <style>{`@keyframes tts-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
