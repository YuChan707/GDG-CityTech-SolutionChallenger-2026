import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { UserPreferences } from '../types';

export default function FilterScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const preferences = (location.state as { preferences: UserPreferences } | null)?.preferences;

  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  function handleSearch() {
    navigate('/results', {
      state: {
        preferences,
        filters: { search, date, time },
      },
    });
  }

  function formatDisplayDate(d: string) {
    if (!d) return 'Date';
    const [year, month, day] = d.split('-');
    return `${month}/${day}/${year}`;
  }

  function formatDisplayTime(t: string) {
    if (!t) return 'Time';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  }

  return (
    <div className="min-h-screen bg-[#EDEDEE] flex flex-col items-center p-6 pt-10">
      <div className="w-full max-w-2xl flex flex-col gap-4">

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
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#fff', caretColor: '#fff' }}
          />
        </div>

        {/* Filter card */}
        <div
          className="rounded-3xl"
          style={{ backgroundColor: '#AD2B0B', padding: '20px 20px' }}
        >
          {/* FILTER label */}
          <p
            className="text-xs tracking-[0.2em] uppercase font-semibold"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            FILTER
          </p>

          <div style={{ height: '16px' }} />

          {/* Date section */}
          <div>
            <button
              onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); }}
              className="rounded-full text-sm font-medium transition-all hover:opacity-90"
              style={{
                padding: '5px 20px',
                backgroundColor: '#FFE19D',
                color: '#6b3a00',
                minWidth: '140px',
              }}
            >
              {formatDisplayDate(date)}
            </button>
            {showDatePicker && (
              <div style={{ marginTop: '8px', marginLeft: '4px' }}>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setDate(e.target.value); setShowDatePicker(false); }}
                  className="rounded-xl px-4 py-2 text-sm outline-none border-0"
                  style={{ backgroundColor: '#fff', color: '#333' }}
                />
              </div>
            )}
          </div>

          <div style={{ height: '12px' }} />

          {/* Time section */}
          <div>
            <button
              onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); }}
              className="rounded-full text-sm font-medium transition-all hover:opacity-90"
              style={{
                padding: '5px 20px',
                backgroundColor: '#FFE19D',
                color: '#6b3a00',
                minWidth: '140px',
              }}
            >
              {formatDisplayTime(time)}
            </button>
            {showTimePicker && (
              <div style={{ marginTop: '8px', marginLeft: '4px' }}>
                <input
                  type="time"
                  value={time}
                  onChange={e => { setTime(e.target.value); setShowTimePicker(false); }}
                  className="rounded-xl px-4 py-2 text-sm outline-none border-0"
                  style={{ backgroundColor: '#fff', color: '#333' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full text-sm font-medium tracking-wide"
            style={{ padding: '5px 20px', backgroundColor: 'rgba(173,43,11,0.15)', color: '#AD2B0B' }}
          >
            Back
          </button>
          <button
            onClick={handleSearch}
            className="rounded-full text-sm font-semibold tracking-[0.15em] uppercase transition-all hover:scale-105 active:scale-95"
            style={{ padding: '5px 20px', backgroundColor: '#F04251', color: '#fff', boxShadow: '0 4px 16px rgba(240,66,81,0.35)' }}
          >
            SEARCH
          </button>
        </div>

      </div>
    </div>
  );
}
