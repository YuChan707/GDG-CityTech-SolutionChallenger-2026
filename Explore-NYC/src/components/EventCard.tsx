import type { Event } from '../types';

interface Props {
  event: Event;
  index: number;
  onClick: () => void;
}

export default function EventCard({ event, index, onClick }: Props) {
  const isLight = index % 2 === 0;

  function formatDate(d: string) {
    const [, month, day] = d.split('-');
    return `${month}/${day}`;
  }

  function formatTime(t: string) {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  }

  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-5 cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg relative flex flex-col gap-2"
      style={{ backgroundColor: isLight ? '#65CDB6' : '#2D8B76' }}
    >
      {/* Arrow icon top-right */}
      <button
        onClick={e => { e.stopPropagation(); onClick(); }}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
        style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Category badge */}
      <span
        className="text-xs font-semibold uppercase tracking-wider self-start px-2.5 py-1 rounded-full"
        style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: 'rgba(255,255,255,0.85)' }}
      >
        {event.category}
      </span>

      {/* Name */}
      <h3
        className="font-semibold text-sm leading-snug pr-8"
        style={{ color: '#fff', fontFamily: 'Playfair Display, Baskerville, Georgia, serif' }}
      >
        {event.name}
      </h3>

      {/* Description */}
      <p
        className="text-xs leading-relaxed line-clamp-2"
        style={{ color: 'rgba(255,255,255,0.75)' }}
      >
        {event.description}
      </p>

      {/* Footer: location + price */}
      <div className="flex items-center justify-between mt-1 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="rgba(255,255,255,0.6)" />
          </svg>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {event.location}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {formatDate(event.date)} · {formatTime(event.time)}
          </span>
          {event.is_free ? (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
            >
              FREE
            </span>
          ) : (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.85)' }}
            >
              ${event.min_price}{event.max_price && event.max_price !== event.min_price ? `–$${event.max_price}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Relevance indicator */}
      {event.relevanceScore !== undefined && event.relevanceScore > 0 && (
        <div className="flex gap-1 mt-1">
          {Array.from({ length: Math.min(event.relevanceScore, 5) }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
