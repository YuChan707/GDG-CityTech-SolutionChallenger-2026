import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserPreferences } from '../types';

const VIBES = [
  'Outdoors', 'Food & Drinks', 'Arts & Culture',
  'Sports & Fitness', 'Music & Entertainment', 'Shopping',
  'Gaming & Tech', 'Wellness', 'Family Fun',
];

const GROUP_TYPES = ['Solo', 'Friends', 'Couple', 'Family'];

const INTEREST_TAGS = [
  'Gaming', 'Anime', 'Fashion', 'Music', 'Food', 'Art',
  'Running', 'Tech', 'Film', 'Dance', 'Photography', 'Travel',
];

const PRICE_OPTIONS = [
  { value: 'free', label: 'Free only' },
  { value: 'up20', label: 'Up to $20' },
  { value: 'up50', label: 'Up to $50' },
  { value: 'any', label: 'Any price' },
];

const TOTAL_STEPS = 4;

export default function Questionnaire() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>({
    vibe: [],
    groupType: '',
    interests: [],
    pricePreference: 'any',
    customInput: '',
  });
  const [inputVal, setInputVal] = useState('');

  function toggleVibe(v: string) {
    setPrefs(p => ({
      ...p,
      vibe: p.vibe.includes(v) ? p.vibe.filter(x => x !== v) : [...p.vibe, v],
    }));
  }

  function toggleInterest(tag: string) {
    setPrefs(p => ({
      ...p,
      interests: p.interests.includes(tag)
        ? p.interests.filter(x => x !== tag)
        : [...p.interests, tag],
    }));
  }

  function addCustomInput() {
    if (inputVal.trim()) {
      setPrefs(p => ({ ...p, customInput: inputVal.trim() }));
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      // Show loading screen while "processing" preferences
      setLoading(true);
      /**
       * TODO: Replace setTimeout with actual API call:
       * fetch('/api/recommendations', {
       *   method: 'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify({ preferences: prefs }),
       * }).then(() => navigate('/filter', { state: { preferences: prefs } }));
       */
      setTimeout(() => {
        navigate('/results', { state: { preferences: prefs } });
      }, 2200);
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1);
    else navigate('/');
  }

  const canProceed = (() => {
    if (step === 0) return prefs.vibe.length > 0;
    if (step === 1) return prefs.groupType !== '';
    return true;
  })();

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div
          className="w-full max-w-sm rounded-3xl flex flex-col items-center"
          style={{ backgroundColor: '#AD2B0B', padding: '48px 24px' }}
        >
          {/* Spinner */}
          <div
            className="rounded-full"
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(255,255,255,0.15)',
              borderTopColor: '#F04251',
              animation: 'spin 0.9s linear infinite',
            }}
          />

          <div style={{ height: '24px' }} />

          <p
            className="text-sm font-semibold tracking-widest uppercase text-center"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            Finding your events…
          </p>

          <div style={{ height: '10px' }} />

          <p
            className="text-xs text-center leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '220px' }}
          >
            Checking preferences
            {/* TODO: will call Vertex AI recommendation API here */}
          </p>
        </div>

        {/* Keyframe for spinner */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Questionnaire ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        className="w-full max-w-2xl rounded-3xl flex flex-col"
        style={{ backgroundColor: '#AD2B0B', padding: '15px' }}
      >
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={handleBack}
            className="text-xs tracking-wider uppercase mr-2 transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            ←
          </button>
          <div className="flex gap-1.5 flex-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i).map(i => (
              <div
                key={`step-${i}`}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: i <= step ? '#F04251' : 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
          <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {step + 1}/{TOTAL_STEPS}
          </span>
        </div>

        {/* Step 0: Vibe — 3-column equal grid */}
        {step === 0 && (
          <div className="flex flex-col">
            <div style={{ height: '12px' }} />
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              What's your vibe today?
            </h2>
            <div style={{ height: '12px' }} />
            <div className="grid grid-cols-3 gap-2">
              {VIBES.map(v => (
                <button
                  key={v}
                  onClick={() => toggleVibe(v)}
                  className="w-full rounded-full text-xs font-medium tracking-wide text-center transition-all duration-150 hover:opacity-90"
                  style={{
                    height: '36px',
                    backgroundColor: prefs.vibe.includes(v) ? '#F04251' : 'rgba(255,255,255,0.15)',
                    color: prefs.vibe.includes(v) ? '#fff' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Group type — 2-column equal grid */}
        {step === 1 && (
          <div className="flex flex-col">
            <div style={{ height: '12px' }} />
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Who are you exploring with?
            </h2>
            <div style={{ height: '12px' }} />
            <div className="grid grid-cols-2 gap-2">
              {GROUP_TYPES.map(g => (
                <button
                  key={g}
                  onClick={() => setPrefs(p => ({ ...p, groupType: g }))}
                  className="w-full rounded-full text-sm font-medium tracking-wide text-center transition-all duration-150 hover:opacity-90"
                  style={{
                    height: '36px',
                    backgroundColor: prefs.groupType === g ? '#F04251' : 'rgba(255,255,255,0.15)',
                    color: prefs.groupType === g ? '#fff' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Custom interests */}
        {step === 2 && (
          <div className="flex flex-col">
            <div style={{ height: '12px' }} />
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              What are your interests?
            </h2>
            <div style={{ height: '12px' }} />

            {/* Text input */}
            <div className="relative">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomInput()}
                placeholder="typing..."
                className="w-full rounded-full py-3 text-sm outline-none"
                style={{
                  paddingLeft: '20px',
                  paddingRight: inputVal ? '72px' : '20px',
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  caretColor: '#fff',
                }}
              />
              {inputVal && (
                <button
                  onClick={addCustomInput}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  Add ↵
                </button>
              )}
            </div>

            <div style={{ height: '14px' }} />

            {/* Predefined tags */}
            <div className="grid grid-cols-4 gap-2">
              {INTEREST_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className="w-full rounded-full text-xs font-medium tracking-wide text-center transition-all duration-150 hover:opacity-90"
                  style={{
                    height: '36px',
                    backgroundColor: prefs.interests.includes(tag) ? '#F04251' : 'rgba(255,255,255,0.15)',
                    color: prefs.interests.includes(tag) ? '#fff' : 'rgba(255,255,255,0.75)',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            {prefs.customInput && (
              <>
                <div style={{ height: '12px' }} />
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Added:</span>
                  <span
                    className="rounded-full text-xs"
                    style={{ padding: '4px 16px', backgroundColor: '#F04251', color: '#fff' }}
                  >
                    {prefs.customInput}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Price preference */}
        {step === 3 && (
          <div className="flex flex-col">
            <div style={{ height: '12px' }} />
            <h2
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              What's your budget?
            </h2>
            <div style={{ height: '12px' }} />
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
              {PRICE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => setPrefs(p => ({ ...p, pricePreference: opt.value }))}
                  className="w-full text-left text-sm flex items-center justify-between transition-colors duration-150 hover:opacity-90"
                  style={{
                    padding: '5px 20px',
                    backgroundColor: prefs.pricePreference === opt.value
                      ? 'rgba(240,66,81,0.35)'
                      : 'transparent',
                    color: 'rgba(255,255,255,0.85)',
                    borderBottom: i < PRICE_OPTIONS.length - 1
                      ? '1px solid rgba(255,255,255,0.15)'
                      : 'none',
                  }}
                >
                  <span>{opt.label}</span>
                  {prefs.pricePreference === opt.value && (
                    <span style={{ color: '#F04251' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* NEXT / DONE — tooltip when no option selected */}
        <div style={{ height: '28px' }} />
        <div className="flex justify-center">
          <div className="relative group">
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="rounded-full text-sm font-semibold tracking-[0.15em] uppercase transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: '5px 20px', backgroundColor: '#F04251', color: '#fff' }}
            >
              {step === TOTAL_STEPS - 1 ? 'DONE' : 'NEXT'}
            </button>

            {/* Tooltip — only visible on hover when button is disabled */}
            {!canProceed && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none
                           opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap',
                }}
              >
                Select one option
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
