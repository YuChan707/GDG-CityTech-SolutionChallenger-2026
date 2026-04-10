import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Event, UserPreferences, FilterState } from '../types';
import { EVENTS } from '../data/events';
import { scoreEvents, filterEvents } from '../utils/recommendation';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    preferences?: UserPreferences;
    filters?: FilterState;
  } | null;

  const initialFilters = state?.filters ?? { search: '', date: '', time: '' };
  const preferences = state?.preferences;

  const [search, setSearch] = useState(initialFilters.search);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const events = useMemo(() => {
    let result = EVENTS;
    if (preferences) {
      result = scoreEvents(result, preferences);
    }
    return filterEvents(result, search, initialFilters.date, initialFilters.time);
  }, [search, preferences, initialFilters.date, initialFilters.time]);

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      // re-filter is reactive via useMemo
    }
  }

  return (
    <div className="min-h-screen bg-[#EDEDEE] flex flex-col items-center p-6 pt-8">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        {/* Search bar */}
        <div
          className="flex items-center gap-3 rounded-full px-5 py-3"
          style={{ backgroundColor: '#AD2B0B' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#fff', caretColor: '#fff' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'rgba(255,255,255,0.5)' }}>
              ✕
            </button>
          )}
        </div>

        {/* Active filters bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#AD2B0B' }}>
            FILTER
          </span>
          {initialFilters.date && (
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ backgroundColor: '#FFE19D', color: '#6b3a00' }}
            >
              Date: {initialFilters.date}
            </span>
          )}
          {initialFilters.time && (
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ backgroundColor: '#FFE19D', color: '#6b3a00' }}
            >
              From: {initialFilters.time}
            </span>
          )}
          {preferences?.vibe && preferences.vibe.length > 0 && (
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(173,43,11,0.12)', color: '#AD2B0B' }}
            >
              {preferences.vibe.slice(0, 2).join(', ')}{preferences.vibe.length > 2 ? ` +${preferences.vibe.length - 2}` : ''}
            </span>
          )}
          <button
            onClick={() => navigate('/filter', { state: { preferences } })}
            className="text-xs ml-auto hover:opacity-70 transition-opacity"
            style={{ color: '#AD2B0B' }}
          >
            Edit filters →
          </button>
        </div>

        {/* Results count */}
        <p className="text-xs" style={{ color: '#999' }}>
          {events.length} event{events.length !== 1 ? 's' : ''} found
          {preferences ? ' · sorted by relevance' : ''}
        </p>

        {/* Event grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {events.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                index={i}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        ) : (
          <div
            className="rounded-3xl p-12 text-center"
            style={{ backgroundColor: '#AD2B0B' }}
          >
            <p className="text-lg font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              No events found
            </p>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Try adjusting your filters or search term
            </p>
            <button
              onClick={() => navigate('/filter', { state: { preferences } })}
              className="px-6 py-2.5 rounded-full text-sm font-semibold"
              style={{ backgroundColor: '#F04251', color: '#fff' }}
            >
              Adjust Filters
            </button>
          </div>
        )}

        {/* Back to start */}
        <button
          onClick={() => navigate('/')}
          className="text-xs text-center mt-2 hover:opacity-70 transition-opacity"
          style={{ color: '#AD2B0B' }}
        >
          ← Start over
        </button>
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
