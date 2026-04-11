import { useNavigate } from 'react-router-dom';

export default function EducationHome() {
  const navigate = useNavigate();

  function handleStart() {
    const isDone = sessionStorage.getItem('educationDone') === 'true';
    if (isDone) {
      const raw   = sessionStorage.getItem('lastEducationPrefs');
      const prefs = raw ? JSON.parse(raw) : undefined;
      navigate('/education/results', { state: { preferences: prefs } });
    } else {
      navigate('/education/questionnaire');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        className="w-full max-w-lg rounded-3xl flex flex-col items-center text-center"
        style={{ backgroundColor: '#1a3a5c', padding: '56px 40px' }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest rounded-full"
          style={{ padding: '4px 16px', backgroundColor: 'rgba(74,158,224,0.2)', color: '#4A9EE0' }}
        >
          High Education
        </span>

        <div style={{ height: '24px' }} />

        <h1
          className="font-bold leading-tight"
          style={{ fontSize: '32px', color: '#fff', fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          Find Your Path
        </h1>

        <div style={{ height: '12px' }} />

        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '320px' }}>
          Discover education profiles, career paths, and opportunities tailored to your academic level and focus area.
        </p>

        <div style={{ height: '40px' }} />

        <button
          onClick={handleStart}
          className="rounded-full text-base font-bold tracking-[0.2em] uppercase transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            padding: '16px 64px',
            backgroundColor: '#4A9EE0',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(74,158,224,0.4)',
          }}
        >
          {sessionStorage.getItem('educationDone') === 'true' ? 'VIEW RESULTS' : 'GET STARTED'}
        </button>

        {sessionStorage.getItem('educationDone') === 'true' && (
          <>
            <div style={{ height: '16px' }} />
            <button
              onClick={() => {
                sessionStorage.removeItem('educationDone');
                sessionStorage.removeItem('lastEducationPrefs');
                navigate('/education/questionnaire');
              }}
              className="text-xs hover:opacity-70 transition-opacity"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Start over
            </button>
          </>
        )}
      </div>
    </div>
  );
}
