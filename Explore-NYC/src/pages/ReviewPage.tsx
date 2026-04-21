import { useState, useRef, useEffect } from 'react';
import iconImg from '../assets/final-icon-explorer-.png';
import reviewsRaw from '../../../default-data/reviews.json';

interface RawReview {
  'reviewer-name': string;
  'name-event': string;
  comments: string;
  'link-post-comment': string;
  'company-hosted': string;
}

const REVIEWS = (reviewsRaw as RawReview[]).map((r, i) => ({
  id:    i,
  name:  r['reviewer-name'],
  event: r['name-event'],
  quote: r['comments'],
}));

// ── Simple chatbot responses ──────────────────────────────────────────────────

const BOT_RESPONSES: { pattern: RegExp; reply: string }[] = [
  { pattern: /event|events/i,          reply: 'We have tons of NYC events — from the Queens Night Market to the Tribeca Film Festival! Head to the Explorer section and answer a quick questionnaire to get personalized picks.' },
  { pattern: /job|internship|intern/i, reply: 'Looking for jobs or internships? Check the High Education section — filter by focus area and experience level to find opportunities that match your profile.' },
  { pattern: /program|bootcamp/i,      reply: 'There are great bootcamp and training programs listed under High Education. Per Scholas (Technology) and many healthcare programs are currently open!' },
  { pattern: /free|cost|price/i,       reply: 'Many events in NYC are free — like the Queens Night Market and NYC Pride March. Use the "Free only" filter in the Explorer section to find them.' },
  { pattern: /hello|hi|hey/i,          reply: "Hey there! 👋 I'm your NYC Explorer assistant. Ask me about events, jobs, programs, or anything about the city!" },
  { pattern: /help|what can you/i,     reply: 'I can help you find NYC events, local businesses, job opportunities, and education programs. Just ask me anything!' },
  { pattern: /map|location|where/i,    reply: 'You can find locations on the interactive map on our home page! It shows events and businesses near you across all five boroughs.' },
  { pattern: /thanks|thank you/i,      reply: "You're welcome! Anything else I can help you discover in NYC? 🗽" },
];

function getBotReply(input: string): string {
  for (const { pattern, reply } of BOT_RESPONSES) {
    if (pattern.test(input)) return reply;
  }
  return "That's a great question! Right now I know about NYC events, jobs, internships, and education programs. Try asking about any of those topics!";
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  from: 'bot' | 'user';
  text: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: 'bot', text: 'Hi! I\'m your NYC Explorer assistant 🗽 Ask me about events, jobs, internships, or programs in the city!' },
  ]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: Date.now(), from: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: getBotReply(text) }]);
    }, 900);
  }

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ padding: '32px 16px', gap: '32px' }}>
      <div className="w-full max-w-3xl flex flex-col gap-8">

        {/* ── Disclaimer ── */}
        <div
          className="rounded-2xl flex items-start gap-3"
          style={{ backgroundColor: 'rgba(234, 255, 234, 0.40)', border: '1px solid rgba(14, 255, 14, 0.35)', padding: '14px 18px' }}
        >
          <span style={{ fontSize: '20px', lineHeight: 1, marginTop: '1px' }}>🚧</span>
          <div>
            <p className="text-sm font-bold" style={{ color: '#022402' }}>This feature is still in development</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: '#375b37' }}>
              The community reviews and AI assistant are actively being built. Reviews are sample data for now,
              and the chatbot will connect to Gemini AI in a future update. Thanks for your patience!
            </p>
          </div>
        </div>

        {/* ── Section label ── */}
        <div>
          <span
            className="text-xs font-bold uppercase tracking-widest rounded-full"
            style={{ padding: '4px 14px', backgroundColor: '#306030', color: '#d4edda' }}
          >
            Reviews from those event/program/local business in the map
          </span>
        </div>

        {/* ── Scrollable review cards ── */}
        <div
          className="flex gap-4 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#306030 transparent' }}
        >
          {REVIEWS.map(r => (
            <div
              key={r.id}
              className="flex-shrink-0 rounded-2xl flex flex-col gap-3"
              style={{
                width: '240px',
                backgroundColor: '#f2f3f4',
                padding: '20px 18px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <img
                  src={iconImg}
                  alt={r.name}
                  className="rounded-full object-cover flex-shrink-0"
                  style={{ width: '44px', height: '44px', border: '2px solid #306030' }}
                />
                <span className="text-sm font-bold" style={{ color: '#1a2e1a' }}>{r.name}</span>
              </div>

              {/* Quote */}
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '28px', lineHeight: 1, color: '#306030', fontFamily: 'Georgia, serif' }}>"</span>
                <p className="text-xs leading-relaxed" style={{ color: '#444', marginTop: '-8px' }}>
                  {r.quote}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Chatbot ── */}
        <div
          className="rounded-3xl flex flex-col overflow-hidden"
          style={{ boxShadow: '0 4px 24px rgba(48,96,48,0.18)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3"
            style={{ backgroundColor: '#306030', padding: '16px 24px' }}
          >
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.23 5.12 3.19 6.79L4 22l4.36-1.4A10.1 10.1 0 0012 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z" fill="rgba(255,255,255,0.85)" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#fff' }}>NYC Explorer Assistant</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Ask about events, jobs & programs</p>
            </div>
            <div
              className="ml-auto rounded-full text-xs font-semibold"
              style={{ padding: '3px 10px', backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
            >
              Beta
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex flex-col gap-3 overflow-y-auto"
            style={{ backgroundColor: '#f2f3f4', padding: '20px 16px', minHeight: '320px', maxHeight: '420px' }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.from === 'bot' && (
                  <div
                    className="rounded-full flex-shrink-0 flex items-center justify-center mr-2 self-end"
                    style={{ width: '28px', height: '28px', backgroundColor: '#306030' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.23 5.12 3.19 6.79L4 22l4.36-1.4A10.1 10.1 0 0012 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z" fill="#fff" />
                    </svg>
                  </div>
                )}
                <div
                  className="rounded-2xl text-sm leading-relaxed"
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    backgroundColor: msg.from === 'bot' ? '#fff' : '#306030',
                    color: msg.from === 'bot' ? '#333' : '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    borderBottomLeftRadius: msg.from === 'bot' ? '4px' : '16px',
                    borderBottomRightRadius: msg.from === 'user' ? '4px' : '16px',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div
                  className="rounded-full flex-shrink-0 flex items-center justify-center mr-2 self-end"
                  style={{ width: '28px', height: '28px', backgroundColor: '#306030' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.23 5.12 3.19 6.79L4 22l4.36-1.4A10.1 10.1 0 0012 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z" fill="#fff" />
                  </svg>
                </div>
                <div
                  className="rounded-2xl flex items-center gap-1"
                  style={{ padding: '12px 16px', backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderBottomLeftRadius: '4px' }}
                >
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: '6px', height: '6px',
                        backgroundColor: '#306030',
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2"
            style={{ backgroundColor: '#fff', padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about events, jobs, programs…"
              className="flex-1 outline-none text-sm rounded-full"
              style={{
                padding: '10px 16px',
                backgroundColor: '#f2f3f4',
                color: '#333',
                border: '1px solid #e0e0e0',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:opacity-85 active:scale-95 disabled:opacity-40"
              style={{ width: '40px', height: '40px', backgroundColor: '#306030' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
