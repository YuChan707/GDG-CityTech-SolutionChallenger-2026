import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LEVELS = [
  { value: 'high school', label: 'High School Student' },
  { value: 'college',     label: 'College Student' },
  { value: 'no degree',   label: 'No Degree' },
];

const FOCUS_AREAS = [
  'Technology', 'STEAM', 'Healthcare', 'Law', 'Sciences',
  'Teaching', 'Media', 'Entertainment', 'Professional Development', 'Robotic',
];

const EXPERIENCE_OPTIONS = [
  { value: '0',   label: 'No experience' },
  { value: '0.5', label: 'Up to 6 months' },
  { value: '1',   label: '1 year' },
  { value: '2',   label: '2 years' },
  { value: '3',   label: '3+ years' },
];

const TOTAL_STEPS = 4;

export interface EducationPreferences {
  level: string;
  focusArea: string;
  experienceYears: number;
  extraSearch: string;
}

export default function EducationQuestionnaire() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<EducationPreferences>({
    level: '',
    focusArea: '',
    experienceYears: -1,
    extraSearch: '',
  });
  const [inputVal, setInputVal] = useState('');

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      setLoading(true);
      setTimeout(() => {
        sessionStorage.setItem('educationDone', 'true');
        sessionStorage.setItem('lastEducationPrefs', JSON.stringify(prefs));
        navigate('/education/results', { state: { preferences: prefs } });
      }, 2000);
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1);
    else navigate('/education');
  }

  const canProceed = (() => {
    if (step === 0) return prefs.level !== '';
    if (step === 1) return prefs.focusArea !== '';
    if (step === 2) return prefs.experienceYears >= 0;
    return true;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div
          className="w-full max-w-sm rounded-3xl flex flex-col items-center"
          style={{ backgroundColor: '#1a3a5c', padding: '56px 32px' }}
        >
          <div className="rounded-full" style={{
            width: '56px', height: '56px',
            border: '4px solid rgba(255,255,255,0.15)',
            borderTopColor: '#4A9EE0',
            animation: 'spin 0.9s linear infinite',
          }} />
          <div style={{ height: '28px' }} />
          <p className="text-base font-semibold tracking-widest uppercase text-center"
            style={{ color: 'rgba(255,255,255,0.85)' }}>
            Finding organizations…
          </p>
          <p className="text-sm text-center mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Matching your profile
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        className="w-full max-w-3xl rounded-3xl flex flex-col"
        style={{ backgroundColor: '#1a3a5c', padding: '32px', minHeight: '520px' }}
      >
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={handleBack}
            className="transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ fontSize: '22px', color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>←</button>
          <div className="flex gap-2 flex-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i).map(i => (
              <div key={i} className="flex-1 rounded-full transition-all duration-300"
                style={{ height: '8px', backgroundColor: i <= step ? '#4A9EE0' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
          <span className="text-sm font-semibold ml-1 flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            {step + 1}/{TOTAL_STEPS}
          </span>
        </div>

        {/* Step 0: What describes you? */}
        {step === 0 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-2xl font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.95)' }}>
              What describes you?
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {LEVELS.map(opt => (
                  <button key={opt.value}
                    onClick={() => setPrefs(p => ({ ...p, level: opt.value }))}
                    className="w-full rounded-full text-base font-semibold tracking-wide text-center transition-all duration-150 hover:opacity-90 active:scale-95"
                    style={{
                      height: '54px',
                      backgroundColor: prefs.level === opt.value ? '#4A9EE0' : 'rgba(255,255,255,0.15)',
                      color: prefs.level === opt.value ? '#fff' : 'rgba(255,255,255,0.85)',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Focus area */}
        {step === 1 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-2xl font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.95)' }}>
              What is your focus area?
            </h2>
            <div style={{ height: '20px' }} />
            <div className="grid grid-cols-3 gap-3">
              {FOCUS_AREAS.map(area => (
                <button key={area}
                  onClick={() => setPrefs(p => ({ ...p, focusArea: area }))}
                  className="w-full rounded-full text-sm font-semibold tracking-wide text-center transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{
                    height: '52px',
                    backgroundColor: prefs.focusArea === area ? '#4A9EE0' : 'rgba(255,255,255,0.15)',
                    color: prefs.focusArea === area ? '#fff' : 'rgba(255,255,255,0.85)',
                  }}>
                  {area}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Experience */}
        {step === 2 && (
          <div className="flex flex-col flex-1 items-center">
            <h2 className="text-2xl font-bold tracking-wide w-full" style={{ color: 'rgba(255,255,255,0.95)' }}>
              Job experience
            </h2>
            <p className="text-sm w-full mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              How much work experience do you have?
            </p>
            <div style={{ height: '24px' }} />
            <div className="rounded-2xl overflow-hidden w-full max-w-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              {EXPERIENCE_OPTIONS.map((opt, i) => (
                <button key={opt.value}
                  onClick={() => setPrefs(p => ({ ...p, experienceYears: Number.parseFloat(opt.value) }))}
                  className="w-full text-left text-base font-medium flex items-center justify-between transition-colors hover:opacity-90"
                  style={{
                    padding: '16px 24px',
                    backgroundColor: prefs.experienceYears === Number.parseFloat(opt.value) ? 'rgba(74,158,224,0.35)' : 'transparent',
                    color: 'rgba(255,255,255,0.9)',
                    borderBottom: i < EXPERIENCE_OPTIONS.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                  }}>
                  <span>{opt.label}</span>
                  {prefs.experienceYears === Number.parseFloat(opt.value) && (
                    <span style={{ color: '#4A9EE0', fontSize: '18px' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Extra search */}
        {step === 3 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-2xl font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.95)' }}>
              Extra search
            </h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Specific skill, role, or keyword? (optional)
            </p>
            <div style={{ height: '24px' }} />
            <div className="relative">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputVal.trim())
                    setPrefs(p => ({ ...p, extraSearch: inputVal.trim() }));
                }}
                placeholder="e.g. mentorship, bootcamp, robotics…"
                className="w-full rounded-full outline-none text-sm"
                style={{
                  height: '52px', paddingLeft: '22px',
                  paddingRight: inputVal ? '80px' : '22px',
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  color: '#fff', caretColor: '#fff',
                }}
              />
              {inputVal && (
                <button
                  onClick={() => setPrefs(p => ({ ...p, extraSearch: inputVal.trim() }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Add ↵
                </button>
              )}
            </div>
            {prefs.extraSearch && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Added:</span>
                <span className="rounded-full text-sm font-medium"
                  style={{ padding: '6px 18px', backgroundColor: '#4A9EE0', color: '#fff' }}>
                  {prefs.extraSearch}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Next / Done */}
        <div style={{ height: '36px' }} />
        <div className="flex justify-center">
          <div className="relative group">
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="rounded-full text-base font-bold tracking-[0.2em] uppercase transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                padding: '14px 56px', backgroundColor: '#4A9EE0', color: '#fff',
                boxShadow: canProceed ? '0 4px 20px rgba(74,158,224,0.45)' : 'none',
              }}>
              {step === TOTAL_STEPS - 1 ? 'DONE' : 'NEXT'}
            </button>
            {!canProceed && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff',
                  fontSize: '12px', padding: '5px 14px',
                  borderRadius: '20px', whiteSpace: 'nowrap',
                }}>
                Select one option
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
