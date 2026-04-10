import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Event, UserPreferences } from '../types';
import { EVENTS } from '../data/events';
import { scoreEvents, filterEvents } from '../utils/recommendation';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';

const PAGE_SIZE = 8;

const PRICE_OPTIONS = [
  { value: 'free', label: 'Free only' },
  { value: 'up20', label: 'Up to $20' },
  { value: 'up50', label: 'Up to $50' },
  { value: 'any', label: 'Any price' },
];

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { preferences?: UserPreferences } | null;
  const preferences = state?.preferences;

  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [pricePreference, setPricePreference] = useState(preferences?.pricePreference ?? 'any');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const allEvents = useMemo(() => {
    let result = EVENTS;
    if (preferences) result = scoreEvents(result, preferences);
    return filterEvents(result, search, date, time, pricePreference);
  }, [search, date, time, pricePreference, preferences]);

  const totalPages = Math.ceil(allEvents.length / PAGE_SIZE);
  const pageEvents = allEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  function resetPage() {
    setPage(0);
  }

  function formatDisplayDate(d: string) {
    if (!d) return 'Any date';
    const [year, month, day] = d.split('-');
    return `${month}/${day}/${year}`;
  }

  function formatDisplayTime(t: string) {
    if (!t) return 'Any time';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  }

  const activeFilterCount = (date ? 1 : 0) + (time ? 1 : 0) + (pricePreference !== 'any' ? 1 : 0);

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ padding: '32px 24px' }}
    >
      <div className="w-full max-w-3xl flex flex-col">

        {/* Search bar */}
        <div
          className="flex items-center gap-3 rounded-full"
          style={{ backgroundColor: '#AD2B0B', padding: '5px 20px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#fff', caretColor: '#fff' }}
          />
          {search && (
            <button onClick={() => handleSearchChange('')} style={{ color: 'rgba(255,255,255,0.5)' }}>
              ✕
            </button>
          )}
        </div>

        <div style={{ height: '12px' }} />

        {/* Active filters row + toggle */}
        <div className="flex items-center gap-3 flex-wrap" style={{ paddingLeft: '4px' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#AD2B0B' }}>
            FILTER
          </span>
          {date && (
            <span className="text-xs rounded-full" style={{ padding: '3px 12px', backgroundColor: '#FFE19D', color: '#6b3a00' }}>
              {formatDisplayDate(date)}
            </span>
          )}
          {time && (
            <span className="text-xs rounded-full" style={{ padding: '3px 12px', backgroundColor: '#FFE19D', color: '#6b3a00' }}>
              From {formatDisplayTime(time)}
            </span>
          )}
          {pricePreference !== 'any' && (
            <span className="text-xs rounded-full" style={{ padding: '3px 12px', backgroundColor: '#FFE19D', color: '#6b3a00' }}>
              {PRICE_OPTIONS.find(p => p.value === pricePreference)?.label}
            </span>
          )}
          {preferences?.vibe && preferences.vibe.length > 0 && (
            <span className="text-xs rounded-full" style={{ padding: '3px 12px', backgroundColor: 'rgba(173,43,11,0.12)', color: '#AD2B0B' }}>
              {preferences.vibe.slice(0, 2).join(', ')}
              {preferences.vibe.length > 2 ? ` +${preferences.vibe.length - 2}` : ''}
            </span>
          )}
          <button
            onClick={() => setShowFilters(f => !f)}
            className="text-xs ml-auto hover:opacity-70 transition-opacity"
            style={{ color: '#AD2B0B' }}
          >
            {showFilters ? 'Hide filters ↑' : `Edit filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''} →`}
          </button>
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div
            className="rounded-3xl mt-3"
            style={{ backgroundColor: '#AD2B0B', padding: '20px 20px' }}
          >
            <p
              className="text-xs tracking-[0.2em] uppercase font-semibold"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              FILTERS
            </p>

            <div style={{ height: '16px' }} />

            {/* Date */}
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); }}
                  className="rounded-full text-sm font-medium transition-all hover:opacity-90"
                  style={{ padding: '5px 20px', backgroundColor: '#FFE19D', color: '#6b3a00', minWidth: '140px' }}
                >
                  {formatDisplayDate(date)}
                </button>
                {date && (
                  <button
                    onClick={() => { setDate(''); resetPage(); }}
                    className="text-xs hover:opacity-70"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    ✕
                  </button>
                )}
              </div>
              {showDatePicker && (
                <div style={{ marginTop: '8px', marginLeft: '4px' }}>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => { setDate(e.target.value); setShowDatePicker(false); resetPage(); }}
                    className="rounded-xl px-4 py-2 text-sm outline-none border-0"
                    style={{ backgroundColor: '#fff', color: '#333' }}
                  />
                </div>
              )}
            </div>

            <div style={{ height: '12px' }} />

            {/* Time */}
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); }}
                  className="rounded-full text-sm font-medium transition-all hover:opacity-90"
                  style={{ padding: '5px 20px', backgroundColor: '#FFE19D', color: '#6b3a00', minWidth: '140px' }}
                >
                  {formatDisplayTime(time)}
                </button>
                {time && (
                  <button
                    onClick={() => { setTime(''); resetPage(); }}
                    className="text-xs hover:opacity-70"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    ✕
                  </button>
                )}
              </div>
              {showTimePicker && (
                <div style={{ marginTop: '8px', marginLeft: '4px' }}>
                  <input
                    type="time"
                    value={time}
                    onChange={e => { setTime(e.target.value); setShowTimePicker(false); resetPage(); }}
                    className="rounded-xl px-4 py-2 text-sm outline-none border-0"
                    style={{ backgroundColor: '#fff', color: '#333' }}
                  />
                </div>
              )}
            </div>

            <div style={{ height: '16px' }} />

            {/* Price */}
            <p
              className="text-xs uppercase tracking-wider font-medium"
              style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}
            >
              PRICE
            </p>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
              {PRICE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => { setPricePreference(opt.value); resetPage(); }}
                  className="w-full text-left text-sm flex items-center justify-between transition-colors duration-150 hover:opacity-90"
                  style={{
                    padding: '8px 20px',
                    backgroundColor: pricePreference === opt.value ? 'rgba(240,66,81,0.35)' : 'transparent',
                    color: 'rgba(255,255,255,0.85)',
                    borderBottom: i < PRICE_OPTIONS.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                  }}
                >
                  <span>{opt.label}</span>
                  {pricePreference === opt.value && <span style={{ color: '#F04251' }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Clear all */}
            {(date || time || pricePreference !== 'any') && (
              <>
                <div style={{ height: '16px' }} />
                <button
                  onClick={() => { setDate(''); setTime(''); setPricePreference('any'); resetPage(); }}
                  className="text-xs hover:opacity-70 transition-opacity"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Clear all filters
                </button>
              </>
            )}
          </div>
        )}

        <div style={{ height: '8px' }} />

        {/* Results count */}
        <p className="text-xs" style={{ color: '#999', paddingLeft: '4px' }}>
          {allEvents.length} event{allEvents.length !== 1 ? 's' : ''} found
          {preferences ? ' · sorted by relevance' : ''}
          {totalPages > 1 ? ` · page ${page + 1} of ${totalPages}` : ''}
        </p>

        <div style={{ height: '16px' }} />

        {/* Event grid */}
        {pageEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pageEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <>
                <div style={{ height: '24px' }} />
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#AD2B0B', color: '#fff' }}
                  >
                    ←
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i).map(i => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className="w-8 h-8 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                      style={{
                        backgroundColor: i === page ? '#F04251' : 'rgba(173,43,11,0.15)',
                        color: i === page ? '#fff' : '#AD2B0B',
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#AD2B0B', color: '#fff' }}
                  >
                    →
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div
            className="rounded-3xl text-center"
            style={{ backgroundColor: '#AD2B0B', padding: '40px 24px' }}
          >
            <p className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              No events found
            </p>
            <div style={{ height: '10px' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Try adjusting your filters or search term
            </p>
            <div style={{ height: '24px' }} />
            <button
              onClick={() => setShowFilters(true)}
              className="rounded-full text-sm font-semibold"
              style={{ padding: '5px 20px', backgroundColor: '#F04251', color: '#fff' }}
            >
              Adjust Filters
            </button>
          </div>
        )}

        <div style={{ height: '24px' }} />

        <button
          onClick={() => navigate('/')}
          className="text-xs text-center hover:opacity-70 transition-opacity"
          style={{ color: '#AD2B0B' }}
        >
          ← Start over
        </button>

        <div style={{ height: '16px' }} />
      </div>

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
