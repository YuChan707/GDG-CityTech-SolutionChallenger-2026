import { Gi3dMeeple } from 'react-icons/gi';
import { IoBusiness } from 'react-icons/io5';
import type { Event } from '../types';

interface Props {
  event: Event;
  onClick: () => void;
}

// Each category gets its own background + text color
const CATEGORY_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  'pop-up':         { bg: '#65CDB6', text: '#fff',     badge: 'rgba(0,0,0,0.12)' },
  'festival':       { bg: '#5BB8D4', text: '#fff',     badge: 'rgba(0,0,0,0.12)' },
  'sports':         { bg: '#D4B843', text: '#fff',     badge: 'rgba(0,0,0,0.12)' },
  'educational':    { bg: '#2D8B76', text: '#fff',     badge: 'rgba(0,0,0,0.12)' },
  'wellness':       { bg: '#7BB8A4', text: '#fff',     badge: 'rgba(0,0,0,0.12)' },
  'gaming':         { bg: '#E07B5A', text: '#fff',     badge: 'rgba(0,0,0,0.12)' },
  'leader meeting': { bg: '#9B7EC8', text: '#fff',     badge: 'rgba(0,0,0,0.12)' },
  'marathon':       { bg: '#D4B843', text: '#fff',     badge: 'rgba(0,0,0,0.12)' },
};

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category.toLowerCase()] ?? { bg: '#8FA8B4', text: '#fff', badge: 'rgba(0,0,0,0.12)' };
}

export default function EventCard({ event, onClick }: Readonly<Props>) {
  const colors = getCategoryStyle(event.category);

  function formatDate(d: string) {
    const [, month, day] = d.split('-');
    return `${month}/${day}`;
  }

  function formatTime(t: string, tEnd?: string) {
    if (!t) return '';
    const fmt = (s: string) => { const [h, m] = s.split(':'); return `${h.padStart(2, '0')}:${m}`; };
    return tEnd ? `${fmt(t)} – ${fmt(tEnd)}` : fmt(t);
  }

  return (
    <div
      onClick={onClick}
      className="rounded-2xl cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg relative flex flex-col"
      style={{ backgroundColor: colors.bg, padding: '16px 16px 12px' }}
    >
      {/* Arrow icon top-right */}
      <button
        onClick={e => { e.stopPropagation(); onClick(); }}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
        style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Category badge + type icon */}
      <div className="flex items-center gap-2 self-start">
        <span
          className="text-xs font-semibold uppercase tracking-wider rounded-full"
          style={{ padding: '3px 10px', backgroundColor: colors.badge, color: 'rgba(255,255,255,0.9)' }}
        >
          {event.category}
        </span>
        <span
          className="flex items-center gap-1 rounded-full text-xs font-semibold"
          style={{ padding: '3px 10px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}
        >
          {event.experience_type === 'local-business'
            ? <><IoBusiness size={12} /> Local Business</>
            : <><Gi3dMeeple size={12} /> Event</>
          }
        </span>
      </div>

      <div style={{ height: '8px' }} />

      {/* Name */}
      <h3
        className="font-semibold leading-snug pr-8"
        style={{ fontSize: '15px', color: colors.text, fontFamily: 'Playfair Display, Baskerville, Georgia, serif' }}
      >
        {event.name}
      </h3>

      <div style={{ height: '6px' }} />

      {/* Description */}
      <p
        className="text-xs leading-relaxed line-clamp-2 flex-1"
        style={{ color: 'rgba(255,255,255,0.8)' }}
      >
        {event.description}
      </p>

      <div style={{ height: '10px' }} />

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}
      >
        <div className="flex items-center gap-1 min-w-0 mr-2">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="rgba(255,255,255,0.65)" />
          </svg>
          <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {event.location}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {formatDate(event.date)} · {formatTime(event.time, event.time_end)}
          </span>
          {event.is_free ? (
            <span
              className="text-xs font-bold rounded-full"
              style={{ padding: '2px 8px', backgroundColor: 'rgba(255,255,255,0.22)', color: '#fff' }}
            >
              FREE
            </span>
          ) : (
            <span
              className="text-xs font-medium rounded-full"
              style={{ padding: '2px 8px', backgroundColor: 'rgba(0,0,0,0.18)', color: 'rgba(255,255,255,0.9)' }}
            >
              ${event.min_price}{event.max_price && event.max_price !== event.min_price ? `–$${event.max_price}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Relevance dots */}
      {event.relevanceScore !== undefined && event.relevanceScore > 0 && (
        <>
          <div style={{ height: '6px' }} />
          <div className="flex gap-1">
            {Array.from({ length: Math.min(event.relevanceScore, 5) }, (_, i) => i).map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.45)' }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
