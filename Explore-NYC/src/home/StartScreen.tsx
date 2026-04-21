import { useNavigate } from 'react-router-dom';
import MapSection from '../components/MapSection';

export default function StartScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">

      {/* ── Title block ── */}
      <div className="text-center">
        <div
          style={{
            fontSize: '52px',
            fontWeight: '800',
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.92)',
            fontFamily: 'Playfair Display, Baskerville, Georgia, serif',
            lineHeight: 1,
          }}
        >
          EXPLORE NYC
        </div>
        <p
          className="uppercase tracking-[0.3em] mt-2"
          style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}
        >
          Google Solution Challenge 2026 · GDG City Tech CUNY
        </p>
        <p
          className="text-sm mt-3 max-w-md mx-auto text-center leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          A personalized discovery platform for New York City — find events, support
          local businesses, and explore career &amp; education opportunities near you.
        </p>
      </div>

      {/* ── Two-panel cards ── */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* ── Explorer card ── */}
        <div
          className="rounded-3xl flex flex-col"
          style={{
            backgroundColor: '#AD2B0B',
            padding: '32px 28px',
            boxShadow: '0 8px 24px rgba(173,43,11,0.45)',
          }}
        >
          <span
            className="text-xs uppercase tracking-widest font-semibold rounded-full self-start"
            style={{ padding: '3px 12px', backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
          >
            Events &amp; Local Business
          </span>

          <div style={{ height: '20px' }} />

          <h2
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#fff',
              fontFamily: 'Playfair Display, Georgia, serif',
              letterSpacing: '0.05em',
              lineHeight: 1.1,
            }}
          >
            Explorer
          </h2>

          <div style={{ height: '12px' }} />

          <p className="text-sm leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Discover <strong style={{ color: 'rgba(255,255,255,0.85)' }}>local events</strong>,
            pop-ups, festivals, and <strong style={{ color: 'rgba(255,255,255,0.85)' }}>hidden gems</strong> in
            NYC. Tell us your vibe, group, and budget — we'll match you to the best experiences.
          </p>

          <div style={{ height: '24px' }} />

          <ul className="text-xs flex flex-col gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <li>→ 5-step questionnaire (vibe · group · interests · budget)</li>
            <li>→ Events &amp; local business recommendations</li>
            <li>→ Filter by date, price, and location</li>
          </ul>

          <div style={{ height: '28px' }} />

          <button
            onClick={() => navigate('/questionnaire')}
            className="rounded-full text-sm font-bold tracking-[0.2em] uppercase transition-all duration-200 hover:scale-105 active:scale-95 self-start"
            style={{
              padding: '12px 32px',
              backgroundColor: '#F04251',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(240,66,81,0.45)',
            }}
          >
            EXPLORER →
          </button>
        </div>

        {/* ── Education card ── */}
        <div
          className="rounded-3xl flex flex-col"
          style={{
            backgroundColor: '#1a3a5c',
            padding: '32px 28px',
            boxShadow: '0 8px 24px rgba(26,58,92,0.55)',
          }}
        >
          <span
            className="text-xs uppercase tracking-widest font-semibold rounded-full self-start"
            style={{ padding: '3px 12px', backgroundColor: 'rgba(74,158,224,0.2)', color: '#93c5fd' }}
          >
            Programs &amp; Jobs
          </span>

          <div style={{ height: '20px' }} />

          <h2
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#fff',
              fontFamily: 'Playfair Display, Georgia, serif',
              letterSpacing: '0.05em',
              lineHeight: 1.1,
            }}
          >
            High Education
          </h2>

          <div style={{ height: '12px' }} />

          <p className="text-sm leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Find <strong style={{ color: 'rgba(255,255,255,0.85)' }}>professional events</strong>,
            bootcamps, fellowships, and <strong style={{ color: 'rgba(255,255,255,0.85)' }}>jobs &amp; internships</strong> in
            NYC. Match your focus area, experience level, and career goals.
          </p>

          <div style={{ height: '24px' }} />

          <ul className="text-xs flex flex-col gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <li>→ 5-step questionnaire (type · level · focus · experience)</li>
            <li>→ Professional events or jobs &amp; internships</li>
            <li>→ Ranked by match strength</li>
          </ul>

          <div style={{ height: '28px' }} />

          <button
            onClick={() => navigate('/education/questionnaire')}
            className="rounded-full text-sm font-bold tracking-[0.2em] uppercase transition-all duration-200 hover:scale-105 active:scale-95 self-start"
            style={{
              padding: '12px 32px',
              backgroundColor: '#4A9EE0',
              color: '#4d3b3b',
              boxShadow: '0 4px 20px rgba(74,158,224,0.45)',
            }}
          >
            EDUCATION →
          </button>
        </div>

      </div>

      {/* ── Map ── */}
      <div className="w-full max-w-3xl">
        <MapSection />
      </div>

    </div>
  );
}
