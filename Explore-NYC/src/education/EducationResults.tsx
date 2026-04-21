import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CiSaveDown1 } from 'react-icons/ci';
import type { EducationPreferences } from './EducationQuestionnaire';
import { EDUCATION_PROFILES, type EducationOrg } from '../data/educationProfiles';
import { fetchEducationRecommendations } from '../api/backend';
import { exportEducationToPDF } from '../utils/exportEducationPDF';

const TODAY = new Date().toISOString().split('T')[0];

function isOpen(dueDate?: string): boolean {
  if (!dueDate) return true;
  const evergreen = ['rolling', 'ongoing', 'seasonal', 'varies'];
  return evergreen.includes(dueDate.toLowerCase()) || dueDate >= TODAY;
}

function formatDueDate(d: string): string {
  const evergreen = ['rolling', 'ongoing', 'seasonal', 'varies'];
  if (evergreen.includes(d.toLowerCase())) return d.charAt(0).toUpperCase() + d.slice(1);
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const ALL_FOCUS_AREAS = [
  'Technology', 'STEAM', 'Healthcare', 'Law', 'Sciences',
  'Teaching', 'Media', 'Entertainment', 'Professional Development', 'Robotic',
  'Job Platform', 'Students & Early Careers',
];

const FOCUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Technology':               { bg: '#bfdbfe', color: '#1e40af' },
  'STEAM':                    { bg: '#bbf7d0', color: '#14532d' },
  'Healthcare':               { bg: '#fce7f3', color: '#9d174d' },
  'Law':                      { bg: '#e0e7ff', color: '#3730a3' },
  'Sciences':                 { bg: '#d1fae5', color: '#065f46' },
  'Teaching':                 { bg: '#fef9c3', color: '#854d0e' },
  'Media':                    { bg: '#fde68a', color: '#92400e' },
  'Entertainment':            { bg: '#fca5a5', color: '#991b1b' },
  'Professional Development': { bg: '#e5e7eb', color: '#374151' },
  'Robotic':                  { bg: '#a5f3fc', color: '#155e75' },
  'Job Platform':             { bg: '#ddd6fe', color: '#4c1d95' },
  'Students & Early Careers': { bg: '#fef3c7', color: '#78350f' },
};

const TYPE_LABELS: Record<string, string> = {
  event: 'Professional Event',
  job: 'Job / Internship',
};

function parseRequirement(req: string): [number, number] {
  const r = req.toLowerCase();
  const plusMatch = r.match(/(\d+)\+/);
  if (plusMatch) return [Number(plusMatch[1]), 99];
  const rangeMatch = r.match(/(\d+(?:\.\d+)?)[–\-](\d+(?:\.\d+)?)/);
  if (rangeMatch) return [Number(rangeMatch[1]), Number(rangeMatch[2])];
  const singleMatch = r.match(/^(\d+(?:\.\d+)?)/);
  if (singleMatch) return [Number(singleMatch[1]), Number(singleMatch[1])];
  return [0, 99];
}

function scoreOrg(org: EducationOrg, prefs: EducationPreferences): number {
  let score = 0;
  if (org.focusArea.toLowerCase() === prefs.focusArea.toLowerCase()) score += 5;
  const [min, max] = parseRequirement(org.requirement);
  if (prefs.experienceYears >= min && prefs.experienceYears <= max) score += 4;
  else if (prefs.experienceYears >= min) score += 1;
  if (prefs.extraSearch) {
    const hay = `${org.name} ${org.focusArea} ${org.otherCategory} ${org.services.join(' ')}`.toLowerCase();
    if (hay.includes(prefs.extraSearch.toLowerCase())) score += 3;
  }
  return score;
}

const focusColor = (area: string) => FOCUS_COLORS[area] ?? { bg: '#e5e7eb', color: '#374151' };

const LEVEL_LABELS: Record<string, string> = {
  'high school': 'High School Student',
  'college':     'College Student',
  'no degree':   'No Degree',
};

export default function EducationResults() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const state       = location.state as { preferences?: EducationPreferences } | null;
  const preferences = state?.preferences
    ?? (() => {
      const raw = sessionStorage.getItem('lastEducationPrefs');
      return raw ? JSON.parse(raw) as EducationPreferences : undefined;
    })();

  const [search,       setSearch]       = useState('');
  const [showFilters,  setShowFilters]  = useState(false);
  const [filterFocus,  setFilterFocus]  = useState(preferences?.focusArea ?? '');
  const [filterLevel,  setFilterLevel]  = useState(preferences?.level ?? '');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrg,  setSelectedOrg]  = useState<EducationOrg | null>(null);

  // API-sourced profiles (null = use static fallback, [] = empty result from API)
  const [apiProfiles, setApiProfiles] = useState<EducationOrg[] | null>(null);
  const [loadingApi,  setLoadingApi]  = useState(!!preferences);

  useEffect(() => {
    if (!preferences) { setLoadingApi(false); return; }
    fetchEducationRecommendations(preferences as unknown as Record<string, unknown>)
      .then(profiles => setApiProfiles(profiles))
      .finally(() => setLoadingApi(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    // Use API results when available; fall back to static data scored locally.
    let pool: EducationOrg[];
    if (apiProfiles !== null) {
      pool = apiProfiles;
    } else {
      pool = EDUCATION_PROFILES.map(org => ({
        ...org,
        relevanceScore: preferences ? scoreOrg(org, preferences) : 0,
      }));
      if (preferences?.lookingFor && preferences.lookingFor !== 'both')
        pool = pool.filter(o => o.type === preferences.lookingFor);
      if (preferences)
        pool = [...pool].sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      pool = pool.filter(o =>
        `${o.name} ${o.focusArea} ${o.otherCategory} ${o.services.join(' ')}`.toLowerCase().includes(q)
      );
    }
    if (filterFocus)               pool = pool.filter(o => o.focusArea === filterFocus);
    if (filterStatus === 'open')   pool = pool.filter(o => isOpen(o.dueDate));
    if (filterStatus === 'closed') pool = pool.filter(o => !isOpen(o.dueDate));

    return pool;
  }, [apiProfiles, preferences, search, filterFocus, filterStatus]);

  const activeFilterCount = (filterFocus ? 1 : 0) + (filterStatus ? 1 : 0) + (filterLevel ? 1 : 0);

  const sectionLabel = preferences?.lookingFor === 'event'
    ? 'Professional Events'
    : preferences?.lookingFor === 'job'
      ? 'Jobs & Internships'
      : 'All Opportunities';

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ padding: '32px 24px' }}>
      <div className="w-full max-w-3xl flex flex-col">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs font-bold uppercase tracking-widest rounded-full"
            style={{ padding: '4px 14px', backgroundColor: '#1a3a5c', color: '#4A9EE0' }}
          >
            {sectionLabel}
          </span>
          {preferences?.lookingFor && preferences.lookingFor !== 'both' && (
            <button
              onClick={() => navigate('/education/questionnaire')}
              className="text-xs hover:opacity-70 transition-opacity"
              style={{ color: 'rgba(74,158,224,0.6)' }}
            >
              Switch type →
            </button>
          )}
        </div>

        {/* Search bar + PDF download */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 rounded-full flex-1"
            style={{ backgroundColor: '#1a3a5c', padding: '5px 20px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
              <path d="M16.5 16.5L21 21" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search organizations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: '#fff', caretColor: '#fff' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: 'rgba(255,255,255,0.5)' }}>✕</button>
            )}
          </div>
          <button
            onClick={() => exportEducationToPDF(results, sectionLabel)}
            title="Save results as PDF"
            className="flex-shrink-0 flex items-center justify-center rounded-full transition-all hover:opacity-80 active:scale-95"
            style={{ width: '42px', height: '42px', backgroundColor: '#1a3a5c' }}
          >
            <CiSaveDown1 size={22} color="#fff" />
          </button>
        </div>

        <div style={{ height: '12px' }} />

        {/* Filter bar */}
        <div
          className="flex items-center gap-3 flex-wrap rounded-2xl"
          style={{ backgroundColor: 'rgba(26,58,92,0.1)', padding: '10px 16px' }}
        >
          <span className="font-bold uppercase tracking-wider flex-shrink-0"
            style={{ fontSize: '16px', color: '#4A9EE0' }}>FILTER</span>

          {filterFocus && (
            <span className="text-xs rounded-full flex items-center gap-1"
              style={{ padding: '3px 10px', backgroundColor: focusColor(filterFocus).bg, color: focusColor(filterFocus).color }}>
              {filterFocus}
              <button onClick={() => setFilterFocus('')} style={{ marginLeft: '2px', opacity: 0.6 }}>✕</button>
            </span>
          )}
          {filterStatus && (
            <span className="text-xs rounded-full flex items-center gap-1"
              style={{
                padding: '3px 10px',
                backgroundColor: filterStatus === 'open' ? '#dcfce7' : '#fee2e2',
                color: filterStatus === 'open' ? '#166534' : '#991b1b',
              }}>
              {filterStatus === 'open' ? 'Open' : 'Closed'}
              <button onClick={() => setFilterStatus('')} style={{ marginLeft: '2px', opacity: 0.6 }}>✕</button>
            </span>
          )}
          {filterLevel && (
            <span className="text-xs rounded-full flex items-center gap-1"
              style={{ padding: '3px 10px', backgroundColor: '#bfdbfe', color: '#1e40af' }}>
              {LEVEL_LABELS[filterLevel] ?? filterLevel}
              <button onClick={() => setFilterLevel('')} style={{ marginLeft: '2px', opacity: 0.6 }}>✕</button>
            </span>
          )}

          <button
            onClick={() => setShowFilters(f => !f)}
            className="text-xs ml-auto hover:opacity-70 transition-opacity font-medium"
            style={{ color: '#4A9EE0' }}
          >
            {showFilters ? 'Hide filters ↑' : `Edit filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''} →`}
          </button>
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="rounded-3xl mt-3" style={{ backgroundColor: '#1a3a5c', padding: '24px' }}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-3"
              style={{ color: 'rgba(255,255,255,0.5)' }}>EDUCATION LEVEL</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {Object.entries(LEVEL_LABELS).map(([val, label]) => (
                <button key={val}
                  onClick={() => setFilterLevel(cur => cur === val ? '' : val)}
                  className="rounded-full text-xs font-semibold transition-all hover:opacity-90"
                  style={{
                    padding: '8px 18px',
                    backgroundColor: filterLevel === val ? '#bfdbfe' : 'rgba(255,255,255,0.12)',
                    color: filterLevel === val ? '#1e40af' : 'rgba(255,255,255,0.8)',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            <p className="text-xs uppercase tracking-widest font-semibold mb-3"
              style={{ color: 'rgba(255,255,255,0.5)' }}>FOCUS AREA</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {ALL_FOCUS_AREAS.map(area => (
                <button key={area}
                  onClick={() => setFilterFocus(f => f === area ? '' : area)}
                  className="rounded-full text-xs font-semibold text-center transition-all hover:opacity-90"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: filterFocus === area ? focusColor(area).bg : 'rgba(255,255,255,0.12)',
                    color: filterFocus === area ? focusColor(area).color : 'rgba(255,255,255,0.8)',
                  }}>
                  {area}
                </button>
              ))}
            </div>

            <p className="text-xs uppercase tracking-widest font-semibold mb-3"
              style={{ color: 'rgba(255,255,255,0.5)' }}>AVAILABILITY</p>
            <div className="flex gap-3">
              {(['open', 'closed'] as const).map(s => (
                <button key={s}
                  onClick={() => setFilterStatus(cur => cur === s ? '' : s)}
                  className="rounded-full text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    padding: '8px 24px',
                    backgroundColor: filterStatus === s
                      ? (s === 'open' ? '#4ade80' : '#f87171')
                      : 'rgba(255,255,255,0.12)',
                    color: filterStatus === s ? '#fff' : 'rgba(255,255,255,0.8)',
                  }}>
                  {s === 'open' ? 'Open' : 'Closed'}
                </button>
              ))}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterFocus(''); setFilterStatus(''); setFilterLevel(''); }}
                className="text-xs mt-4 hover:opacity-70 transition-opacity block"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                Clear all filters
              </button>
            )}
          </div>
        )}

        <div style={{ height: '8px' }} />
        {loadingApi && (
          <p className="text-xs text-center" style={{ color: '#4A9EE0', paddingBottom: '8px' }}>
            Fetching recommendations…
          </p>
        )}
        <p className="text-xs" style={{ color: '#999', paddingLeft: '4px' }}>
          {results.length} result{results.length === 1 ? '' : 's'}
          {preferences ? ' · sorted by match' : ''}
        </p>
        <div style={{ height: '16px' }} />

        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map(org => {
              const fc = focusColor(org.focusArea);
              return (
                <div
                  key={org.id}
                  onClick={() => setSelectedOrg(org)}
                  className="rounded-2xl flex flex-col cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg"
                  style={{ backgroundColor: '#1a3a5c', padding: '16px' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold rounded-full"
                      style={{ padding: '3px 12px', backgroundColor: fc.bg, color: fc.color }}>
                      {org.focusArea}
                    </span>
                    <span className="text-xs rounded-full"
                      style={{
                        padding: '3px 10px',
                        backgroundColor: org.type === 'event' ? 'rgba(74,158,224,0.18)' : 'rgba(167,139,250,0.18)',
                        color: org.type === 'event' ? '#93c5fd' : '#c4b5fd',
                      }}>
                      {TYPE_LABELS[org.type]}
                    </span>
                  </div>

                  <div style={{ height: '10px' }} />

                  <p className="text-base font-bold leading-snug" style={{ color: '#fff' }}>{org.name}</p>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{org.otherCategory}</p>

                  <div style={{ height: '12px' }} />

                  <div className="flex items-center gap-2">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="7" width="20" height="14" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    </svg>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {org.requirement}
                    </span>
                  </div>

                  <div style={{ height: '8px' }} />

                  <div className="flex items-center gap-2 mb-2">
                    {isOpen(org.dueDate) ? (
                      <>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#4ade80' }} />
                        <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>Open</span>
                        {org.dueDate && (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            · {formatDueDate(org.dueDate)}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#f87171' }} />
                        <span className="text-xs font-semibold" style={{ color: '#f87171' }}>Closed</span>
                        {org.dueDate && (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            · Ended {formatDueDate(org.dueDate)}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-auto">
                    {org.services.map(s => (
                      <span key={s} className="text-xs rounded-full"
                        style={{ padding: '2px 10px', backgroundColor: 'rgba(74,158,224,0.18)', color: '#93c5fd' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl text-center" style={{ backgroundColor: '#1a3a5c', padding: '40px 24px' }}>
            <p className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>No results found</p>
            <div style={{ height: '10px' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Try adjusting your filters or search</p>
            <div style={{ height: '20px' }} />
            <button
              onClick={() => { setFilterFocus(''); setFilterStatus(''); setShowFilters(true); }}
              className="rounded-full text-sm font-semibold"
              style={{ padding: '8px 24px', backgroundColor: '#4A9EE0', color: '#fff' }}>
              Adjust Filters
            </button>
          </div>
        )}

        <div style={{ height: '24px' }} />
        <button
          onClick={() => {
            sessionStorage.removeItem('educationDone');
            sessionStorage.removeItem('lastEducationPrefs');
            navigate('/education/questionnaire');
          }}
          className="text-xs text-center hover:opacity-70 transition-opacity"
          style={{ color: '#4A9EE0' }}
        >
          ← Start over
        </button>
        <div style={{ height: '16px' }} />
      </div>

      {/* Detail modal */}
      {selectedOrg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedOrg(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ backgroundColor: '#F7F5FA' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ backgroundColor: '#1a3a5c', padding: '20px 20px 16px' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider rounded-full"
                      style={{ padding: '3px 10px', backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                      {selectedOrg.focusArea}
                    </span>
                    <span className="text-xs rounded-full"
                      style={{
                        padding: '3px 10px',
                        backgroundColor: selectedOrg.type === 'event' ? 'rgba(74,158,224,0.3)' : 'rgba(167,139,250,0.3)',
                        color: '#fff',
                      }}>
                      {TYPE_LABELS[selectedOrg.type]}
                    </span>
                  </div>
                  <div style={{ height: '8px' }} />
                  <h2 className="font-bold leading-snug"
                    style={{ fontSize: '18px', color: '#fff' }}>
                    {selectedOrg.name}
                  </h2>
                </div>
                <button onClick={() => setSelectedOrg(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-70 transition-opacity"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div style={{ padding: '20px' }} className="flex flex-col gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#999' }}>Program / Role</p>
                <p className="text-sm font-medium" style={{ color: '#333' }}>{selectedOrg.otherCategory}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#999' }}>Who can apply</p>
                <p className="text-sm" style={{ color: '#555' }}>{selectedOrg.requirement}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: '#999' }}>Services offered</p>
                <div className="flex flex-wrap gap-2">
                  {selectedOrg.services.map(s => (
                    <span key={s} className="text-xs rounded-full font-medium"
                      style={{ padding: '4px 14px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOpen(selectedOrg.dueDate) ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#4ade80' }} />
                    <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>
                      {selectedOrg.type === 'job' ? 'Accepting Applications' : 'Registration Open'}
                    </span>
                    {selectedOrg.dueDate && (
                      <span className="text-xs" style={{ color: '#999' }}>· {formatDueDate(selectedOrg.dueDate)}</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#f87171' }} />
                    <span className="text-sm font-semibold" style={{ color: '#dc2626' }}>Closed</span>
                    {selectedOrg.dueDate && (
                      <span className="text-xs" style={{ color: '#999' }}>· Ended {formatDueDate(selectedOrg.dueDate)}</span>
                    )}
                  </>
                )}
              </div>

              {selectedOrg.registrationLink && (
                <a
                  href={selectedOrg.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-full text-sm font-semibold tracking-wide text-center transition-all hover:opacity-90"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: isOpen(selectedOrg.dueDate) ? '#4A9EE0' : '#e5e7eb',
                    color: isOpen(selectedOrg.dueDate) ? '#fff' : '#9ca3af',
                    pointerEvents: isOpen(selectedOrg.dueDate) ? 'auto' : 'none',
                    display: 'block',
                  }}
                >
                  {isOpen(selectedOrg.dueDate)
                    ? (selectedOrg.type === 'job' ? 'Apply Now ↗' : 'Register Now ↗')
                    : 'Currently Closed'}
                </a>
              )}

              {preferences && (() => {
                const sc = scoreOrg(selectedOrg, preferences);
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#999' }}>Match strength</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="rounded-full"
                          style={{ width: '10px', height: '10px', backgroundColor: i <= Math.round(sc / 2) ? '#4A9EE0' : '#e5e7eb' }} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
