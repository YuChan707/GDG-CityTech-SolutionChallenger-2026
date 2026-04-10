import type { Event } from '../types';

interface Props {
  event: Event;
  onClose: () => void;
}

export default function EventDetail({ event, onClose }: Props) {
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
    // db.collection('reminders').add({ eventId: event.id, userId: currentUser.uid, ... })
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
        {/* Header */}
        <div
          className="px-6 pt-6 pb-5"
          style={{ backgroundColor: '#2D8B76' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: 'rgba(255,255,255,0.85)' }}
              >
                {event.category}
              </span>
              <h2
                className="text-xl font-bold mt-2 leading-snug"
                style={{ color: '#fff', fontFamily: 'Playfair Display, Baskerville, Georgia, serif' }}
              >
                {event.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-70 transition-opacity"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Date & time row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#AD2B0B" strokeWidth="2" />
                <path d="M3 10h18M8 2v4M16 2v4" stroke="#AD2B0B" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium" style={{ color: '#333' }}>
                {formatDate(event.date)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#AD2B0B" strokeWidth="2" />
                <path d="M12 7v5l3 3" stroke="#AD2B0B" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium" style={{ color: '#333' }}>
                {formatTime(event.time)}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#AD2B0B" />
            </svg>
            <span className="text-sm" style={{ color: '#555' }}>{event.location}</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{
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

          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
            {event.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {event.tags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs"
                style={{ backgroundColor: '#EDEDEE', color: '#666' }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRemind}
              className="flex-1 py-3 rounded-full text-sm font-semibold tracking-wide transition-all hover:opacity-90"
              style={{ backgroundColor: '#AD2B0B', color: '#fff' }}
            >
              Remind Me
            </button>
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-full text-sm font-semibold tracking-wide text-center transition-all hover:opacity-90"
              style={{ backgroundColor: '#F04251', color: '#fff' }}
            >
              Learn More ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
