import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Event, UserPreferences, FilterState } from '../types';
import { EVENTS } from '../data/events';
import { scoreEvents, filterEvents } from '../utils/recommendation';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';

const PAGE_SIZE = 8;

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
  const [page, setPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const allEvents = useMemo(() => {
    let result = EVENTS;
    if (preferences) result = scoreEvents(result, preferences);
    return filterEvents(result, search, initialFilters.date, initialFilters.time);
  }, [search, preferences, initialFilters.date, initialFilters.time]);

  const totalPages = Math.ceil(allEvents.length / PAGE_SIZE);
  const pageEvents = allEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  return (
    <div
      className="min-h-screen bg-[#EDEDEE] flex flex-col items-center"
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

        <div style={{ height: '16px' }} />

        {/* Active filters bar */}
        <div className="flex items-center gap-3 flex-wrap" style={{ paddingLeft: '4px' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#AD2B0B' }}>
            FILTER
          </span>
          {initialFilters.date && (
            <span className="text-xs rounded-full" style={{ padding: '3px 12px', backgroundColor: '#FFE19D', color: '#6b3a00' }}>
              Date: {initialFilters.date}
            </span>
          )}
          {initialFilters.time && (
            <span className="text-xs rounded-full" style={{ padding: '3px 12px', backgroundColor: '#FFE19D', color: '#6b3a00' }}>
              From: {initialFilters.time}
            </span>
          )}
          {preferences?.vibe && preferences.vibe.length > 0 && (
            <span className="text-xs rounded-full" style={{ padding: '3px 12px', backgroundColor: 'rgba(173,43,11,0.12)', color: '#AD2B0B' }}>
              {preferences.vibe.slice(0, 2).join(', ')}
              {preferences.vibe.length > 2 ? ` +${preferences.vibe.length - 2}` : ''}
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
              onClick={() => navigate('/filter', { state: { preferences } })}
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
