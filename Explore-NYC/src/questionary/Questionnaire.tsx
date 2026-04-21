import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserPreferences } from '../types';
import { triggerPipeline } from '../api/backend';
import HearButton from '../components/HearButton';

const LOOKING_FOR_OPTIONS = [
  { value: 'events',         label: 'Events' },
  { value: 'local-business', label: 'Visit Local-business' },
  { value: 'both',           label: 'Both experiences' },
];

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

const TOTAL_STEPS = 5;

export default function Questionnaire() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>({
    lookingFor: '',
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
      setLoading(true);
      triggerPipeline(prefs as unknown as Record<string, unknown>);
      setTimeout(() => {
        sessionStorage.setItem('questionnaireDone', 'true');
        sessionStorage.setItem('lastPreferences', JSON.stringify(prefs));
        navigate('/results', { state: { preferences: prefs } });
      }, 2200);
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1);
    else navigate('/');
  }

  function getStepText(): string {
    if (step === 0) return `What are you looking for? Options: ${LOOKING_FOR_OPTIONS.map(o => o.label).join(', ')}.`;
    if (step === 1) return `What's your vibe today? Options: ${VIBES.join(', ')}.`;
    if (step === 2) return `Who are you exploring with? Options: ${GROUP_TYPES.join(', ')}.`;
    if (step === 3) return `What are your interests? Choose from: ${INTEREST_TAGS.join(', ')}.`;
    return `What's your budget? Options: ${PRICE_OPTIONS.map(o => o.label).join(', ')}.`;
  }

  const canProceed = (() => {
    if (step === 0) return prefs.lookingFor !== '';
    if (step === 1) return prefs.vibe.length > 0;
    if (step === 2) return prefs.groupType !== '';
    return true;
  })();

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div
          className="w-full max-w-sm rounded-3xl flex flex-col items-center"
          style={{ backgroundColor: '#AD2B0B', padding: '56px 32px' }}
        >
          <div
            className="rounded-full"
            style={{
              width: '56px',
              height: '56px',
              border: '4px solid rgba(255,255,255,0.15)',
              borderTopColor: '#F04251',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <div style={{ height: '28px' }} />
          <p
            className="text-base font-semibold tracking-widest uppercase text-center"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            Finding your experiences…
          </p>
          <div style={{ height: '10px' }} />
          <p
            className="text-sm text-center leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '220px' }}
          >
            Checking preferences
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Questionnaire ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        className="w-full max-w-3xl rounded-3xl flex flex-col"
        style={{ backgroundColor: '#AD2B0B', padding: '32px', minHeight: '520px' }}
      >

        {/* ── Progress bar ── */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={handleBack}
            className="transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ fontSize: '22px', color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}
          >
            ←
          </button>
          <div className="flex gap-2 flex-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i).map(i => (
              <div
                key={`step-${i}`}
                className="flex-1 rounded-full transition-all duration-300"
                style={{
                  height: '8px',
                  backgroundColor: i <= step ? '#F04251' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
          <span
            className="text-sm font-semibold ml-1 flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {step + 1}/{TOTAL_STEPS}
          </span>
          <HearButton
            getText={getStepText}
            size={22}
            label="Read this question aloud"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '5px', color: 'rgba(255,255,255,0.8)' }}
          />
        </div>

        {/* ── Step 0: What are you looking for? ── */}
        {step === 0 && (
          <div className="flex flex-col flex-1 justify-between">
            <h2
              className="text-2xl font-bold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              What are you looking for?
            </h2>
            <div className="flex justify-center pb-4">
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {LOOKING_FOR_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPrefs(p => ({ ...p, lookingFor: opt.value }))}
                    className="w-full rounded-full text-base font-semibold tracking-wide text-center transition-all duration-150 hover:opacity-90 active:scale-95"
                    style={{
                      height: '54px',
                      backgroundColor: prefs.lookingFor === opt.value ? '#F04251' : 'rgba(255,255,255,0.15)',
                      color: prefs.lookingFor === opt.value ? '#fff' : 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Vibe ── */}
        {step === 1 && (
          <div className="flex flex-col flex-1">
            <h2
              className="text-2xl font-bold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              What's your vibe today?
            </h2>
            <div style={{ height: '20px' }} />
            <div className="grid grid-cols-3 gap-3">
              {VIBES.map(v => (
                <button
                  key={v}
                  onClick={() => toggleVibe(v)}
                  className="w-full rounded-full text-sm font-semibold tracking-wide text-center transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{
                    height: '52px',
                    backgroundColor: prefs.vibe.includes(v) ? '#F04251' : 'rgba(255,255,255,0.15)',
                    color: prefs.vibe.includes(v) ? '#fff' : 'rgba(255,255,255,0.85)',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Group type ── */}
        {step === 2 && (
          <div className="flex flex-col flex-1">
            <h2
              className="text-2xl font-bold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              Who are you exploring with?
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                {GROUP_TYPES.map(g => (
                  <button
                    key={g}
                    onClick={() => setPrefs(p => ({ ...p, groupType: g }))}
                    className="w-full rounded-full text-sm font-semibold tracking-wide text-center transition-all duration-150 hover:opacity-90 active:scale-95"
                    style={{
                      height: '44px',
                      backgroundColor: prefs.groupType === g ? '#F04251' : 'rgba(255,255,255,0.15)',
                      color: prefs.groupType === g ? '#fff' : 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Interests ── */}
        {step === 3 && (
          <div className="flex flex-col flex-1">
            <h2
              className="text-2xl font-bold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              What are your interests?
            </h2>
            <div style={{ height: '20px' }} />

            {/* Text input */}
            <div className="relative">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomInput()}
                placeholder="Type something custom…"
                className="w-full rounded-full outline-none text-sm"
                style={{
                  height: '48px',
                  paddingLeft: '22px',
                  paddingRight: inputVal ? '80px' : '22px',
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  caretColor: '#fff',
                }}
              />
              {inputVal && (
                <button
                  onClick={addCustomInput}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Add ↵
                </button>
              )}
            </div>

            <div style={{ height: '16px' }} />

            {/* Predefined tags */}
            <div className="grid grid-cols-4 gap-3">
              {INTEREST_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className="w-full rounded-full text-sm font-semibold tracking-wide text-center transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{
                    height: '52px',
                    backgroundColor: prefs.interests.includes(tag) ? '#F04251' : 'rgba(255,255,255,0.15)',
                    color: prefs.interests.includes(tag) ? '#fff' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            {prefs.customInput && (
              <>
                <div style={{ height: '14px' }} />
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Added:</span>
                  <span
                    className="rounded-full text-sm font-medium"
                    style={{ padding: '6px 18px', backgroundColor: '#F04251', color: '#fff' }}
                  >
                    {prefs.customInput}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 4: Price preference ── */}
        {step === 4 && (
          <div className="flex flex-col flex-1 items-center">
            <h2
              className="text-2xl font-bold tracking-wide w-full"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              What's your budget?
            </h2>
            <div style={{ height: '28px' }} />
            <div
              className="rounded-2xl overflow-hidden w-full max-w-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
              {PRICE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => setPrefs(p => ({ ...p, pricePreference: opt.value }))}
                  className="w-full text-left text-base font-medium flex items-center justify-between transition-colors duration-150 hover:opacity-90"
                  style={{
                    padding: '16px 24px',
                    backgroundColor: prefs.pricePreference === opt.value
                      ? 'rgba(240,66,81,0.35)'
                      : 'transparent',
                    color: 'rgba(255,255,255,0.9)',
                    borderBottom: i < PRICE_OPTIONS.length - 1
                      ? '1px solid rgba(255,255,255,0.15)'
                      : 'none',
                  }}
                >
                  <span>{opt.label}</span>
                  {prefs.pricePreference === opt.value && (
                    <span style={{ color: '#F04251', fontSize: '18px' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── NEXT / DONE ── */}
        <div style={{ height: '36px' }} />
        <div className="flex justify-center">
          <div className="relative group">
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="rounded-full text-base font-bold tracking-[0.2em] uppercase transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                padding: '14px 56px',
                backgroundColor: '#F04251',
                color: '#fff',
                boxShadow: canProceed ? '0 4px 20px rgba(240,66,81,0.45)' : 'none',
              }}
            >
              {step === TOTAL_STEPS - 1 ? 'DONE' : 'NEXT'}
            </button>

            {!canProceed && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none
                           opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  fontSize: '12px',
                  padding: '5px 14px',
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
