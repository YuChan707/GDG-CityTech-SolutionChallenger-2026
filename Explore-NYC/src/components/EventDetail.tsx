import type { Event } from '../types';

interface Props {
  event: Event;
  onClose: () => void;
}

// Must match EventCard colors so the modal header reflects the category
const CATEGORY_COLORS: Record<string, string> = {
  'pop-up':         '#65CDB6',
  'festival':       '#5BB8D4',
  'sports':         '#D4B843',
  'educational':    '#2D8B76',
  'wellness':       '#7BB8A4',
  'gaming':         '#E07B5A',
  'leader meeting': '#9B7EC8',
  'marathon':       '#D4B843',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] ?? '#8FA8B4';
}

export default function EventDetail({ event, onClose }: Readonly<Props>) {
  const headerColor = getCategoryColor(event.category);

  function formatDate(d: string) {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  function formatTime(t: string) {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  }

  function handleRemind() {
    alert(`Reminder set for "${event.name}" on ${formatDate(event.date)} at ${formatTime(event.time)}!`);
    // TODO: Integrate with Firestore to save reminders
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden relative"
        style={{ backgroundColor: '#F7F5FA' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header, uses the category color */}
        <div style={{ backgroundColor: headerColor, padding: '20px 20px 16px' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-3">
              <span
                className="text-xs font-semibold uppercase tracking-wider rounded-full"
                style={{ padding: '3px 10px', backgroundColor: 'rgba(0,0,0,0.15)', color: 'rgba(255,255,255,0.9)' }}
              >
                {event.category}
              </span>
              <div style={{ height: '8px' }} />
              <h2
                className="font-bold leading-snug"
                style={{ fontSize: '18px', color: '#fff', fontFamily: 'Playfair Display, Baskerville, Georgia, serif' }}
              >
                {event.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-70 transition-opacity"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 16px' }} className="flex flex-col">

          {/* Date & time */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#AD2B0B" strokeWidth="2" />
                <path d="M3 10h18M8 2v4M16 2v4" stroke="#AD2B0B" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium" style={{ color: '#333' }}>
                {formatDate(event.date)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#AD2B0B" strokeWidth="2" />
                <path d="M12 7v5l3 3" stroke="#AD2B0B" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium" style={{ color: '#333' }}>
                {formatTime(event.time)}
              </span>
            </div>
          </div>

          <div style={{ height: '14px' }} />

          {/* Location — only shown when available */}
          {event.location && (
            <>
              <div className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#AD2B0B" />
                </svg>
                <span className="text-sm" style={{ color: '#555' }}>{event.location}</span>
              </div>
              <div style={{ height: '14px' }} />
            </>
          )}

          {/* Hosted by */}
          {event.company_hosted && (
            <>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#AD2B0B" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M9 22V12h6v10" stroke="#AD2B0B" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                <span className="text-sm" style={{ color: '#555' }}>
                  Hosted by <span className="font-semibold" style={{ color: '#333' }}>{event.company_hosted}</span>
                </span>
              </div>
              <div style={{ height: '14px' }} />
            </>
          )}

          <div style={{ height: '0px' }} />

          {/* Price + audience */}
          <div className="flex items-center gap-3">
            <span
              className="rounded-full text-sm font-semibold"
              style={{
                padding: '4px 14px',
                backgroundColor: event.is_free ? '#65CDB6' : '#FFE19D',
                color: event.is_free ? '#fff' : '#6b3a00',
              }}
            >
              {event.is_free
                ? 'FREE'
                : `$${event.min_price}${event.max_price && event.max_price !== event.min_price ? ` – $${event.max_price}` : ''}`}
            </span>
            <span className="text-xs" style={{ color: '#999' }}>
              {event.focus} · {event.group_type.join(', ')}
            </span>
          </div>

          <div style={{ height: '14px' }} />

          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
            {event.description}
          </p>

          <div style={{ height: '14px' }} />

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {event.tags.map(tag => (
              <span
                key={tag}
                className="text-xs rounded-full"
                style={{ padding: '4px 12px', backgroundColor: '#EDEDEE', color: '#666' }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div style={{ height: '18px' }} />

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleRemind}
              className="flex-1 rounded-full text-sm font-semibold tracking-wide transition-all hover:opacity-90"
              style={{ padding: '5px 20px', backgroundColor: '#AD2B0B', color: '#fff' }}
            >
              Remind Me
            </button>
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-full text-sm font-semibold tracking-wide text-center transition-all hover:opacity-90"
              style={{ padding: '5px 20px', backgroundColor: '#F04251', color: '#fff' }}
            >
              Learn More ↗
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
