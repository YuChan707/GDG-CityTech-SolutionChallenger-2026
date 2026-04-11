import { useState } from 'react';

interface Props {
  value: string;    // YYYY-MM-DD or ''
  min?: string;     // YYYY-MM-DD — days before this are disabled
  onChange: (date: string) => void;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function CalendarPicker({ value, min, onChange }: Readonly<Props>) {
  const seed   = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear,  setViewYear]  = useState(seed.getFullYear());
  const [viewMonth, setViewMonth] = useState(seed.getMonth()); // 0-indexed

  const today = new Date().toISOString().split('T')[0];

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const firstWeekday  = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Pad the grid with nulls so day 1 lands on the right weekday column
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function toDateStr(day: number): string {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  }

  return (
    <div
      className="rounded-2xl"
      style={{ backgroundColor: '#fff', padding: '12px', minWidth: '252px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-full text-base transition-colors hover:bg-gray-100"
          style={{ color: '#555' }}
        >
          ‹
        </button>
        <span className="text-sm font-semibold" style={{ color: '#333' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-full text-base transition-colors hover:bg-gray-100"
          style={{ color: '#555' }}
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div
            key={d}
            className="text-center text-xs font-medium"
            style={{ color: '#aaa', padding: '2px 0' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const dateStr   = toDateStr(day);
          const isSelected = dateStr === value;
          const isToday   = dateStr === today;
          const disabled  = !!min && dateStr < min;

          return (
            <button
              key={dateStr}
              onClick={() => !disabled && onChange(dateStr)}
              disabled={disabled}
              className="w-7 h-7 mx-auto flex items-center justify-center rounded-full text-xs transition-colors"
              style={{
                backgroundColor: isSelected ? '#F04251' : isToday ? 'rgba(240,66,81,0.12)' : 'transparent',
                color: isSelected ? '#fff' : disabled ? '#ddd' : '#333',
                fontWeight: isSelected || isToday ? 600 : 400,
                cursor: disabled ? 'default' : 'pointer',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
