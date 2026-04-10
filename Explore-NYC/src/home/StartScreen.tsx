import { useNavigate } from 'react-router-dom';

export default function StartScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-3xl flex flex-col items-center"
        style={{
          backgroundColor: '#AD2B0B',
          minHeight: '420px',
          padding: '48px 20px 48px',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Logo — bigger title */}
        <div className="text-center">
          <div
            style={{
              fontSize: '40px',
              fontWeight: '700',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'Playfair Display, Baskerville, Georgia, serif',
              lineHeight: 1.1,
            }}
          >
            EXPLORE
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: '800',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'Playfair Display, Baskerville, Georgia, serif',
              lineHeight: 1,
            }}
          >
            NYC
          </div>
        </div>

        {/* QUESTIONNAIRE — lighter but distinct from the title */}
        <p
          className="uppercase tracking-[0.3em]"
          style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '10px' }}
        >
          QUESTIONNAIRE
        </p>

        {/* Hero space */}
        <div className="flex-1 flex items-center justify-center w-full" style={{ margin: '24px 0' }}>
          <p
            className="text-center text-sm max-w-xs leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Discover local events, pop-ups &amp; hidden gems in New York City — just for you.
          </p>
        </div>

        {/* START button — bottom padding matches top (48px) */}
        <button
          onClick={() => navigate('/questionnaire')}
          className="rounded-full text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            padding: '5px 20px',
            backgroundColor: '#F04251',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(240,66,81,0.4)',
          }}
        >
          START
        </button>
      </div>
    </div>
  );
}
