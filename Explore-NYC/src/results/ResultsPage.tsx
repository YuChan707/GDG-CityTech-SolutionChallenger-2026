import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Event, UserPreferences } from '../types';
import { fetchEvents, fetchBusinesses } from '../api/backend';
import { scoreEvents, filterEvents } from '../utils/recommendation';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';
import CalendarPicker from '../components/CalendarPicker';
import { CiSaveDown1 } from 'react-icons/ci';
import { exportExperiencesToPDF } from '../utils/exportToPDF';

const PAGE_SIZE = 8;

const PRICE_OPTIONS = [
  { value: 'free', label: 'Free only' },
  { value: 'up20', label: 'Up to $20' },
  { value: 'up50', label: 'Up to $50' },
  { value: 'any', label: 'Any price' },
];

const VIBE_COLORS: Record<string, { bg: string; color: string }> = {
  'Outdoors':              { bg: '#b7e4c7', color: '#166534' },
  'Food & Drinks':         { bg: '#ffd6a5', color: '#9a3412' },
  'Arts & Culture':        { bg: '#d8b4fe', color: '#581c87' },
  'Sports & Fitness':      { bg: '#bfdbfe', color: '#1e40af' },
  'Music & Entertainment': { bg: '#fca5a5', color: '#991b1b' },
  'Shopping':              { bg: '#fef08a', color: '#854d0e' },
  'Gaming & Tech':         { bg: '#a5f3fc', color: '#155e75' },
  'Wellness':              { bg: '#bbf7d0', color: '#14532d' },
  'Family Fun':            { bg: '#fed7aa', color: '#7c2d12' },
};

type ActivePicker = 'dateFrom' | 'dateTo' | 'timeFrom' | 'timeTo' | null;

function fmtDate(d: string) {
  if (!d) return '';
  const [, month, day] = d.split('-');
  return `${month}/${day}`;
}

function fmtTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${h.padStart(2, '0')}:${m}`;
}

export default function ResultsPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const state       = location.state as { preferences?: UserPreferences } | null;
  const preferences = state?.preferences;

  const [loadedData,      setLoadedData]      = useState<Event[]>([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [showFilters,     setShowFilters]     = useState(false);
  const [search,          setSearch]          = useState('');
  const [dateFrom,        setDateFrom]        = useState('');
  const [dateTo,          setDateTo]          = useState('');
  const [timeFrom,        setTimeFrom]        = useState('');
  const [timeTo,          setTimeTo]          = useState('');
  const [pricePreference, setPricePreference] = useState(preferences?.pricePreference ?? 'any');
  const [activePicker,    setActivePicker]    = useState<ActivePicker>(null);
  const [page,            setPage]            = useState(0);
  const [selectedEvent,   setSelectedEvent]   = useState<Event | null>(null);

  // Fetch live data from backend on mount.
  // fetchEvents/fetchBusinesses fall back to static JSON if the backend is offline.
  useEffect(() => {
    const lookingFor = preferences?.lookingFor ?? 'events';

    async function load() {
      setIsLoading(true);
      try {
        if (lookingFor === 'local-business') {
          setLoadedData(await fetchBusinesses());
        } else if (lookingFor === 'both') {
          const [events, businesses] = await Promise.all([fetchEvents(), fetchBusinesses()]);
          setLoadedData([...events, ...businesses]);
        } else {
          setLoadedData(await fetchEvents());
        }
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [preferences?.lookingFor]);

  const allEvents = useMemo(() => {
    const scored = preferences ? scoreEvents(loadedData, preferences) : loadedData;
    return filterEvents(scored, search, dateFrom, dateTo, timeFrom, timeTo, pricePreference);
  }, [loadedData, search, dateFrom, dateTo, timeFrom, timeTo, pricePreference, preferences]);

  const totalPages = Math.ceil(allEvents.length / PAGE_SIZE);
  const pageEvents = allEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function resetPage()                   { setPage(0); }
  function handleSearchChange(v: string) { setSearch(v); setPage(0); }
  function togglePicker(p: ActivePicker) { setActivePicker(cur => cur === p ? null : p); }

  const today = new Date().toISOString().split('T')[0];

  const dateChip = dateFrom && dateTo
    ? `${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`
    : dateFrom ? fmtDate(dateFrom) : '';

  const timeChip = timeFrom && timeTo
    ? `${fmtTime(timeFrom)} – ${fmtTime(timeTo)}`
    : timeFrom  ? `From ${fmtTime(timeFrom)}`
    : timeTo    ? `Until ${fmtTime(timeTo)}`
    : '';

  const activeFilterCount =
    (dateFrom || dateTo        ? 1 : 0) +
    (timeFrom || timeTo        ? 1 : 0) +
    (pricePreference !== 'any' ? 1 : 0);

  function pickerBtnStyle(active: boolean): React.CSSProperties {
    return {
      padding: '7px 20px',
      minWidth: '130px',
      backgroundColor: active ? '#F04251' : '#FFE19D',
      color: active ? '#fff' : '#6b3a00',
    };
  }

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ padding: '32px 24px' }}>
      <div className="w-full max-w-3xl flex flex-col">

        {/* Search bar + export button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 rounded-full flex-1" style={{ backgroundColor: '#AD2B0B', padding: '5px 20px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
              <path d="M16.5 16.5L21 21" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search experiences..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: '#fff', caretColor: '#fff' }}
            />
            {search && (
              <button onClick={() => handleSearchChange('')} style={{ color: 'rgba(255,255,255,0.5)' }}>✕</button>
            )}
          </div>
          <button
            onClick={() => exportExperiencesToPDF(allEvents)}
            title="Save results as PDF"
            className="flex-shrink-0 flex items-center justify-center rounded-full transition-all hover:opacity-80 active:scale-95"
            style={{ width: '42px', height: '42px', backgroundColor: '#AD2B0B' }}
          >
            <CiSaveDown1 size={22} color="#fff" />
          </button>
        </div>

        <div style={{ height: '12px' }} />

        {/* Active filters bar */}
        <div
          className="flex items-center gap-3 flex-wrap rounded-2xl"
          style={{ backgroundColor: 'rgba(173,43,11,0.1)', padding: '10px 16px' }}
        >
          <span className="font-bold uppercase tracking-wider flex-shrink-0" style={{ fontSize: '16px', color: '#AD2B0B' }}>
            FILTER
          </span>
          {dateChip && (
            <span className="text-xs rounded-full" style={{ padding: '3px 12px', backgroundColor: '#FFE19D', color: '#6b3a00' }}>
              {dateChip}
            </span>
          )}
          {timeChip && (
            <span className="text-xs rounded-full" style={{ padding: '3px 12px', backgroundColor: '#FFE19D', color: '#6b3a00' }}>
              {timeChip}
            </span>
          )}
          {pricePreference !== 'any' && (
            <span className="text-xs rounded-full" style={{ padding: '3px 12px', backgroundColor: '#FFE19D', color: '#6b3a00' }}>
              {PRICE_OPTIONS.find(p => p.value === pricePreference)?.label}
            </span>
          )}
          {preferences?.vibe && preferences.vibe.map(v => {
            const c = VIBE_COLORS[v] ?? { bg: '#e5e7eb', color: '#374151' };
            return (
              <span
                key={v}
                className="text-xs font-medium rounded-full"
                style={{ padding: '3px 12px', backgroundColor: c.bg, color: c.color }}
              >
                {v}
              </span>
            );
          })}
          <button
            onClick={() => setShowFilters(f => !f)}
            className="text-xs ml-auto hover:opacity-70 transition-opacity font-medium"
            style={{ color: '#AD2B0B' }}
          >
            {showFilters ? 'Hide filters ↑' : `Edit filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''} →`}
          </button>
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="rounded-3xl mt-3" style={{ backgroundColor: '#AD2B0B', padding: '24px' }}>

            {/* DATE */}
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>DATE</p>
            <div style={{ height: '10px' }} />
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>From</span>
                <button
                  onClick={() => togglePicker('dateFrom')}
                  className="rounded-full text-sm font-medium transition-all hover:opacity-90"
                  style={pickerBtnStyle(!!dateFrom)}
                >
                  {dateFrom ? fmtDate(dateFrom) : 'Select day'}
                </button>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)', paddingBottom: '9px' }}>→</span>
              <div className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>To (optional)</span>
                <button
                  onClick={() => togglePicker('dateTo')}
                  className="rounded-full text-sm font-medium transition-all hover:opacity-90"
                  style={pickerBtnStyle(!!dateTo)}
                >
                  {dateTo ? fmtDate(dateTo) : 'Select day'}
                </button>
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); setActivePicker(null); resetPage(); }}
                  className="text-xs hover:opacity-70 pb-2"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  ✕ clear
                </button>
              )}
            </div>
            {activePicker === 'dateFrom' && (
              <div style={{ marginTop: '10px' }}>
                <CalendarPicker
                  value={dateFrom}
                  min={today}
                  onChange={date => { setDateFrom(date); setActivePicker(null); resetPage(); }}
                />
              </div>
            )}
            {activePicker === 'dateTo' && (
              <div style={{ marginTop: '10px' }}>
                <CalendarPicker
                  value={dateTo}
                  min={dateFrom || today}
                  onChange={date => { setDateTo(date); setActivePicker(null); resetPage(); }}
                />
              </div>
            )}

            <div style={{ height: '20px' }} />

            {/* TIME */}
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>TIME</p>
            <div style={{ height: '10px' }} />
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>From</span>
                <button
                  onClick={() => togglePicker('timeFrom')}
                  className="rounded-full text-sm font-medium transition-all hover:opacity-90"
                  style={pickerBtnStyle(!!timeFrom)}
                >
                  {timeFrom ? fmtTime(timeFrom) : 'Start time'}
                </button>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)', paddingBottom: '9px' }}>→</span>
              <div className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>To</span>
                <button
                  onClick={() => togglePicker('timeTo')}
                  className="rounded-full text-sm font-medium transition-all hover:opacity-90"
                  style={pickerBtnStyle(!!timeTo)}
                >
                  {timeTo ? fmtTime(timeTo) : 'End time'}
                </button>
              </div>
              {(timeFrom || timeTo) && (
                <button
                  onClick={() => { setTimeFrom(''); setTimeTo(''); setActivePicker(null); resetPage(); }}
                  className="text-xs hover:opacity-70 pb-2"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  ✕ clear
                </button>
              )}
            </div>
            {activePicker === 'timeFrom' && (
              <div style={{ marginTop: '10px' }}>
                <input
                  type="time"
                  value={timeFrom}
                  onChange={e => { setTimeFrom(e.target.value); setActivePicker(null); resetPage(); }}
                  className="rounded-xl px-4 py-2 text-sm outline-none border-0"
                  style={{ backgroundColor: '#fff', color: '#333' }}
                />
              </div>
            )}
            {activePicker === 'timeTo' && (
              <div style={{ marginTop: '10px' }}>
                <input
                  type="time"
                  value={timeTo}
                  onChange={e => { setTimeTo(e.target.value); setActivePicker(null); resetPage(); }}
                  className="rounded-xl px-4 py-2 text-sm outline-none border-0"
                  style={{ backgroundColor: '#fff', color: '#333' }}
                />
              </div>
            )}

            <div style={{ height: '20px' }} />

            {/* PRICE */}
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>PRICE</p>
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              {PRICE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => { setPricePreference(opt.value); resetPage(); }}
                  className="w-full text-left text-sm flex items-center justify-between transition-colors duration-150 hover:opacity-90"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: pricePreference === opt.value ? 'rgba(240,66,81,0.35)' : 'transparent',
                    color: 'rgba(255,255,255,0.9)',
                    borderBottom: i < PRICE_OPTIONS.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                  }}
                >
                  <span>{opt.label}</span>
                  {pricePreference === opt.value && <span style={{ color: '#F04251' }}>✓</span>}
                </button>
              ))}
            </div>

            {(dateFrom || dateTo || timeFrom || timeTo || pricePreference !== 'any') && (
              <>
                <div style={{ height: '16px' }} />
                <button
                  onClick={() => {
                    setDateFrom(''); setDateTo('');
                    setTimeFrom(''); setTimeTo('');
                    setPricePreference('any');
                    setActivePicker(null);
                    resetPage();
                  }}
                  className="text-xs hover:opacity-70 transition-opacity"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  Clear all filters
                </button>
              </>
            )}
          </div>
        )}

        <div style={{ height: '8px' }} />

        <p className="text-xs" style={{ color: '#999', paddingLeft: '4px' }}>
          {allEvents.length} experience{allEvents.length === 1 ? '' : 's'} found
          {preferences ? ' · sorted by relevance' : ''}
          {totalPages > 1 ? ` · page ${page + 1} of ${totalPages}` : ''}
        </p>

        <div style={{ height: '16px' }} />

        {isLoading ? (
          <div className="text-center py-16" style={{ color: '#AD2B0B' }}>
            Loading experiences…
          </div>
        ) : pageEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pageEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
              ))}
            </div>
            {totalPages > 1 && (
              <>
                <div style={{ height: '24px' }} />
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#AD2B0B', color: '#fff' }}
                  >←</button>
                  {Array.from({ length: totalPages }, (_, i) => i).map(i => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className="w-8 h-8 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                      style={{ backgroundColor: i === page ? '#F04251' : 'rgba(173,43,11,0.15)', color: i === page ? '#fff' : '#AD2B0B' }}
                    >{i + 1}</button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#AD2B0B', color: '#fff' }}
                  >→</button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="rounded-3xl text-center" style={{ backgroundColor: '#AD2B0B', padding: '40px 24px' }}>
            <p className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>No events found</p>
            <div style={{ height: '10px' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Try adjusting your filters or search term</p>
            <div style={{ height: '24px' }} />
            <button
              onClick={() => setShowFilters(true)}
              className="rounded-full text-sm font-semibold"
              style={{ padding: '5px 20px', backgroundColor: '#F04251', color: '#fff' }}
            >Adjust Filters</button>
          </div>
        )}

        <div style={{ height: '24px' }} />
        <button
          onClick={() => navigate('/')}
          className="text-xs text-center hover:opacity-70 transition-opacity"
          style={{ color: '#ffc0b0' }}
        >← Start over</button>
        <div style={{ height: '16px' }} />
      </div>

      {selectedEvent && (
        <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
