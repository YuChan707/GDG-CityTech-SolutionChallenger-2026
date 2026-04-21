import logoImg from '../assets/final-icon-explorer-.png';

const TEAM = [
  { name: 'Yuzhen Chen',     link: 'https://www.linkedin.com/in/yuzhenchen707/' },
  { name: 'Catherine Ochoa', link: 'https://www.linkedin.com/in/catherine-ochoa2/' },
  { name: 'Osumane Diallo',  link: 'https://www.linkedin.com/in/ousmane-diallo-005ab7246/' },
];

const CARD_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.13)',
  padding: '28px',
} as const;

const TEXT_STYLE = {
  color: 'rgba(255,255,255,0.75)',
} as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ padding: '48px 24px' }}>
      <div className="w-full max-w-3xl flex flex-col gap-10">

        {/* Title */}
        <div>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '800',
              color: 'rgba(255,255,255,0.95)',
              fontFamily: 'Playfair Display, Georgia, serif',
              letterSpacing: '0.05em',
              lineHeight: 1.1,
            }}
          >
            We Are...
          </h1>
          <div
            className="mt-2 rounded-full"
            style={{ width: '60px', height: '4px', backgroundColor: '#ffa700' }}
          />
        </div>

        {/* Logo + first paragraph */}
        <div className="rounded-3xl flex items-start gap-6" style={CARD_STYLE}>
          <img
            src={logoImg}
            alt="Explore NYC logo"
            className="rounded-2xl flex-shrink-0"
            style={{ width: '90px', height: '90px', objectFit: 'cover' }}
          />
          <p className="text-sm leading-relaxed" style={TEXT_STYLE}>
            We are students from New York City College of Technology who wanted to solve a
            real problem we face every day. We noticed that many events, opportunities, and
            local businesses are hard to find because social media platforms don't show them.
          </p>
        </div>

        {/* Second paragraph */}
        <div className="rounded-3xl" style={CARD_STYLE}>
          <p className="text-sm leading-relaxed" style={TEXT_STYLE}>
            That's why we created Explorer — to help students like us discover real
            opportunities, connect with people, and support local businesses. This project
            means a lot to us because it's built from our own experience of feeling lost and
            wanting better ways to explore our city.
          </p>
        </div>

        {/* Third paragraph */}
        <div className="rounded-3xl" style={CARD_STYLE}>
          <p className="text-sm leading-relaxed" style={TEXT_STYLE}>
            Our goal is to make it easier for everyone to find their path and feel more
            connected to their community.
          </p>
        </div>

        {/* Team list */}
        <div className="flex flex-col gap-3">
          <p
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            The Team
          </p>
          {TEAM.map((member, i) => (
            <a
              key={member.name}
              href={member.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl transition-all hover:opacity-80 active:scale-[0.99]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.13)',
                padding: '16px 22px',
                textDecoration: 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: '#ffa700', color: '#fff' }}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {member.name}
                </span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px' }}>↗</span>
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}
