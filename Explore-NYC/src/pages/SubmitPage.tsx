import { useState } from 'react';
import { submitSuggestion } from '../api/backend';

const TYPE_OPTIONS = [
  { value: '',                   label: 'What are you submitting?' },
  { value: 'event',              label: 'Event' },
  { value: 'local-business',     label: 'Local Business' },
  { value: 'professional-event', label: 'Professional Event' },
  { value: 'job',                label: 'Job / Internship' },
] as const;

type SubmissionType = (typeof TYPE_OPTIONS)[number]['value'];

const TYPE_LABELS: Record<string, string> = {
  'event':              'Event',
  'local-business':     'Local Business',
  'professional-event': 'Professional Event',
  'job':                'Job / Internship',
};

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function SubmitPage() {
  const [type,   setType]   = useState<SubmissionType>('');
  const [name,   setName]   = useState('');
  const [link,   setLink]   = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState('');

  const typeLabel = type ? TYPE_LABELS[type] : '';
  const canSubmit = type !== '' && name.trim() !== '' && link.trim() !== '';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus('loading');
    setErrMsg('');

    try {
      await submitSuggestion({ type, name: name.trim(), link: link.trim() });
      setStatus('success');
      setType('');
      setName('');
      setLink('');
    } catch (err) {
      setStatus('error');
      setErrMsg(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        className="w-full max-w-lg rounded-3xl flex flex-col"
        style={{ backgroundColor: '#1e1e1e', padding: '36px 32px' }}
      >
        <h1
          className="text-2xl font-bold tracking-wide"
          style={{ color: 'rgba(255,255,255,0.95)', fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          Submit a Suggestion
        </h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Know a great event, local business, professional program, or job opening in NYC?
          Share it with us and we'll review it for the platform.
        </p>

        <div style={{ height: '28px' }} />

        {/* ── Success state ── */}
        {status === 'success' && (
          <div
            className="rounded-2xl text-center"
            style={{ backgroundColor: 'rgba(74,222,128,0.12)', padding: '20px', marginBottom: '20px' }}
          >
            <p className="text-base font-semibold" style={{ color: '#4ade80' }}>Thank you!</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Your suggestion has been received. We'll review it shortly.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* ── Type dropdown ── */}
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Type
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={e => { setType(e.target.value as SubmissionType); setStatus('idle'); }}
                className="w-full rounded-full appearance-none outline-none text-sm font-medium cursor-pointer"
                style={{
                  height: '50px',
                  paddingLeft: '20px',
                  paddingRight: '44px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: type ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {TYPE_OPTIONS.map(opt => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.value === ''}
                    style={{ backgroundColor: '#2a2a2a', color: '#fff' }}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              {/* Chevron icon */}
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
              >
                <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* ── Name input — only visible when type is selected ── */}
          {type && (
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Name of {typeLabel}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={`Enter the ${typeLabel.toLowerCase()} name…`}
                maxLength={120}
                className="w-full rounded-full outline-none text-sm"
                style={{
                  height: '50px',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  caretColor: '#fff',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
            </div>
          )}

          {/* ── Link input — only visible when type is selected ── */}
          {type && (
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Social media post or official link
              </label>
              <input
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://…"
                maxLength={500}
                className="w-full rounded-full outline-none text-sm"
                style={{
                  height: '50px',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  caretColor: '#fff',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
            </div>
          )}

          {/* ── Error ── */}
          {status === 'error' && (
            <p className="text-xs text-center" style={{ color: '#f87171' }}>{errMsg}</p>
          )}

          {/* ── Submit button ── */}
          {type && (
            <div className="flex justify-center pt-2">
              <div className="relative group">
                <button
                  type="submit"
                  disabled={!canSubmit || status === 'loading'}
                  className="rounded-full text-sm font-bold tracking-[0.2em] uppercase transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    padding: '13px 48px',
                    backgroundColor: '#F04251',
                    color: '#fff',
                    boxShadow: canSubmit ? '0 4px 20px rgba(240,66,81,0.4)' : 'none',
                  }}
                >
                  {status === 'loading' ? 'Sending…' : 'SUBMIT'}
                </button>
                {!canSubmit && status !== 'loading' && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff',
                      fontSize: '12px', padding: '5px 14px',
                      borderRadius: '20px', whiteSpace: 'nowrap',
                    }}
                  >
                    Fill in all fields first
                  </div>
                )}
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
