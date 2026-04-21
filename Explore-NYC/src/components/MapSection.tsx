import { useEffect, useState } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import mapStyleData from '../assets/maps/light-mode.json';

// ── Map style conversion ───────────────────────────────────────────────────────

type MapTypeStyle = { featureType?: string; elementType?: string; stylers: Record<string, string>[] };

const ID_TO_FEATURES: Record<string, string[]> = {
  infrastructure:  ['road', 'transit'],
  natural:         ['landscape.natural', 'water'],
  pointOfInterest: ['poi'],
  political:       ['administrative'],
};

function buildMapStyles(): MapTypeStyle[] {
  const out: MapTypeStyle[] = [];
  for (const s of mapStyleData.styles) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (s as any).geometry;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const l = (s as any).label;
    for (const featureType of ID_TO_FEATURES[s.id] ?? []) {
      if (g?.fillColor)        out.push({ featureType, elementType: 'geometry.fill',    stylers: [{ color: g.fillColor   }] });
      if (g?.strokeColor)      out.push({ featureType, elementType: 'geometry.stroke',  stylers: [{ color: g.strokeColor }] });
      if (l?.textFillColor)   out.push({ featureType, elementType: 'labels.text.fill',   stylers: [{ color: l.textFillColor   }] });
      if (l?.textStrokeColor) out.push({ featureType, elementType: 'labels.text.stroke', stylers: [{ color: l.textStrokeColor }] });
    }
  }
  return out;
}

const MAP_STYLES = buildMapStyles();

// ── Pin types ─────────────────────────────────────────────────────────────────

type PinType = 'event' | 'business' | 'professional-event' | 'job';

interface MapPin {
  type:        PinType;
  name:        string;
  coordinates: { lat: number; lng: number };
}

const PIN_COLOR: Record<PinType, string> = {
  event:                '#F04251',
  business:             '#8b0000',
  'professional-event': '#4A9EE0',
  job:                  '#00827f',
};

const PIN_LABEL: Record<PinType, string> = {
  event:                'Event',
  business:             'Local Business',
  'professional-event': 'Professional Event',
  job:                  'Job / Internship',
};

const ALL_TYPES = Object.keys(PIN_COLOR) as PinType[];

function circleIcon(color: string, opacity = 1): string {
  // opacity is encoded in the fill via rgba hex trick — use alpha in svg
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    <circle cx="11" cy="11" r="8" fill="${color}${alpha}" stroke="white" stroke-width="3" stroke-opacity="${opacity}"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const NYC_CENTER = { lat: 40.7128, lng: -74.006 };
const API_KEY    = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

export default function MapSection() {
  const [pins,        setPins]        = useState<MapPin[]>([]);
  const [activePin,   setActivePin]   = useState<MapPin | null>(null);
  // Which types are toggled ON in the filter bar
  const [activeTypes, setActiveTypes] = useState<Set<PinType>>(new Set(ALL_TYPES));

  useEffect(() => {
    fetch('/api/map/pins')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => setPins((data.pins as MapPin[]) ?? []))
      .catch(() => {});
  }, []);

  function toggleType(type: PinType) {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        // Don't allow deselecting all
        if (next.size === 1) return prev;
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
    // Clear selected pin if its type was just hidden
    setActivePin(p => (p?.type === type ? null : p));
  }

  function handleMapClick() {
    setActivePin(null);
  }

  // Determine visual state of each pin
  function pinOpacity(pin: MapPin): number {
    if (!activeTypes.has(pin.type)) return 0;          // filtered out
    if (!activePin) return 1;                           // nothing selected → all full
    return pin === activePin ? 1 : 0.15;               // one selected → others dim
  }

  const visiblePins = pins.filter(p => activeTypes.has(p.type));

  return (
    <section style={{ width: '100%', maxWidth: '900px', margin: '0 auto', paddingBottom: '48px' }}>

      {/* ── Header ── */}
      <div
        className="text-center rounded-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.92)', padding: '18px 24px 14px', marginBottom: '10px' }}
      >
        <p className="uppercase tracking-[0.25em] font-bold" style={{ fontSize: '13px', color: '#1a1a1a' }}>
          NYC Map
        </p>
        <p className="text-sm mt-1" style={{ color: '#444' }}>
          All events, businesses, and programs on the map
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div
        className="rounded-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.92)', padding: '14px 20px', marginBottom: '10px' }}
      >
        <p
          className="uppercase tracking-widest font-semibold mb-3"
          style={{ fontSize: '10px', color: '#777' }}
        >
          Filter by type
        </p>

        <div className="flex flex-wrap gap-2">
          {ALL_TYPES.map(type => {
            const on = activeTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className="flex items-center gap-2 rounded-full text-xs font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
                style={{
                  padding:         '7px 16px',
                  backgroundColor: on  ? PIN_COLOR[type] : 'rgba(0,0,0,0.07)',
                  color:           on  ? '#fff'          : '#555',
                  border:          on  ? 'none'          : `2px solid ${PIN_COLOR[type]}`,
                  boxShadow:       on  ? `0 2px 10px ${PIN_COLOR[type]}55` : 'none',
                }}
              >
                {/* Dot */}
                <span style={{
                  display:         'inline-block',
                  width:           9,
                  height:          9,
                  borderRadius:    '50%',
                  backgroundColor: on ? '#fff' : PIN_COLOR[type],
                  flexShrink:      0,
                }} />
                {PIN_LABEL[type]}
              </button>
            );
          })}

          {/* Select all / clear */}
          {activeTypes.size < ALL_TYPES.length && (
            <button
              onClick={() => setActiveTypes(new Set(ALL_TYPES))}
              className="rounded-full text-xs font-medium transition-all hover:opacity-70"
              style={{ padding: '7px 14px', color: '#888', backgroundColor: 'rgba(0,0,0,0.05)' }}
            >
              Show all
            </button>
          )}
        </div>

        <p className="mt-2" style={{ fontSize: '10px', color: '#aaa' }}>
          {visiblePins.length} pin{visiblePins.length === 1 ? '' : 's'} visible
          {activePin ? ' · click the map to deselect' : ' · click a pin to focus it'}
        </p>
      </div>

      {/* ── Map ── */}
      <APIProvider apiKey={API_KEY}>
        <Map
          style={{ width: '100%', height: '480px', borderRadius: '20px', overflow: 'hidden' }}
          defaultCenter={NYC_CENTER}
          defaultZoom={11}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          styles={MAP_STYLES as any}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
          onClick={handleMapClick}
        >
          {pins.map(pin => {
            const opacity = pinOpacity(pin);
            if (opacity === 0) return null;
            const key = `${pin.type}-${pin.name}-${pin.coordinates.lat}-${pin.coordinates.lng}`;
            return (
              <Marker
                key={key}
                position={pin.coordinates}
                icon={{ url: circleIcon(PIN_COLOR[pin.type], opacity) }}
                title={pin.name}
                zIndex={activePin === pin ? 10 : 1}
                onClick={() => setActivePin(prev => prev === pin ? null : pin)}
              />
            );
          })}

          {activePin && activeTypes.has(activePin.type) && (
            <InfoWindow
              position={activePin.coordinates}
              onCloseClick={() => setActivePin(null)}
              pixelOffset={[0, -14]}
            >
              <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '120px', maxWidth: '200px' }}>
                <span style={{
                  display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: PIN_COLOR[activePin.type], marginBottom: '3px',
                }}>
                  {PIN_LABEL[activePin.type]}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>
                  {activePin.name}
                </span>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </section>
  );
}
