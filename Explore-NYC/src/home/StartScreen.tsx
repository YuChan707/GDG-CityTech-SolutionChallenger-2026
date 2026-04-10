import { useNavigate } from 'react-router-dom';

export default function StartScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#EDEDEE] flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-3xl flex flex-col items-center"
        style={{
          backgroundColor: '#AD2B0B',
          minHeight: '420px',
          padding: '48px 20px 10px',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-2">
          <div
            className="text-2xl font-bold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Playfair Display, Baskerville, Georgia, serif' }}
          >
            EXPLORE
          </div>
          <div
            className="text-4xl font-bold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Playfair Display, Baskerville, Georgia, serif' }}
          >
            NYC
          </div>
        </div>

        {/* Subtitle */}
        <p
          className="text-xs tracking-[0.25em] uppercase mt-2 mb-1"
          style={{ color: '#c44027' }}
        >
          QUESTIONNAIRE
        </p>

        {/* Hero space */}
        <div className="flex-1 flex items-center justify-center w-full my-6">
          <p
            className="text-center text-sm max-w-xs leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Discover local events, pop-ups &amp; hidden gems in New York City (just for you).
          </p>
        </div>

        {/* Start button */}
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
