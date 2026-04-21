import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  function handleHome() {
    const isDone = sessionStorage.getItem('questionnaireDone') === 'true';
    if (isDone) {
      const raw = sessionStorage.getItem('lastPreferences');
      const prefs = raw ? JSON.parse(raw) : undefined;
      navigate('/results', { state: { preferences: prefs } });
    } else {
      navigate('/questionnaire');
    }
  }

  function handleEducation() {
    const isDone = sessionStorage.getItem('educationDone') === 'true';
    if (isDone) {
      const raw = sessionStorage.getItem('lastEducationPrefs');
      const prefs = raw ? JSON.parse(raw) : undefined;
      navigate('/education/results', { state: { preferences: prefs } });
    } else {
      navigate('/education/questionnaire');
    }
  }

  const homePageActive  = location.pathname === '/';
  const explorerActive  = ['/questionnaire', '/results'].includes(location.pathname);
  const educationActive = location.pathname.startsWith('/education');

  const navItems = [
    { label: 'Home page',         onClick: () => navigate('/'),              active: homePageActive,                    color: 'default' },
    { label: 'Explorer',          onClick: handleHome,                       active: explorerActive,                    color: 'red'     },
    { label: 'High Education',    onClick: handleEducation,                  active: educationActive,                   color: 'blue'    },
    { label: 'Who We Are?',       onClick: () => navigate('/about'),         active: location.pathname === '/about',    color: 'default' },
    { label: 'People Review',     onClick: () => navigate('/reviews'),       active: location.pathname === '/reviews',  color: 'green'   },
    { label: 'Submit Request',    onClick: () => navigate('/submit'),        active: location.pathname === '/submit',   color: 'teal'    },
  ];

  return (
    <header style={{ backgroundColor: '#AD2B0B', position: 'sticky', top: 0, zIndex: 100 }}>

      {/* Title row */}
      <div className="text-center" style={{ paddingTop: '10px', paddingBottom: '2px' }}>
        <span
          className="text-xs uppercase"
          style={{ letterSpacing: '0.22em', color: 'rgba(255, 234, 3, 0.84)', fontSize: "30px"}}
        >
          EXPLORER NYC (for now)
        </span>
        <p
          className="text-xs uppercase"
          style={{ letterSpacing: '0.22em', color: 'rgba(255, 96, 96, 0.82)', fontSize: "20px"}}
        >
          GDG City Tech (CUNY New York City of Technology)
        </p>
                <p
          className="text-xs uppercase"
          style={{ letterSpacing: '0.22em', color: 'rgba(255,255,255,0.85)', fontSize: "15px"}}
        >
          "Support local business and student success"
        </p>
      </div>

      {/* Nav buttons */}
      <nav
        className="flex items-center justify-center flex-wrap"
        style={{ gap: '8px', padding: '8px 20px 12px' }}
      >
        {navItems.map(item => {
          const colors: Record<string, [string, string, string]> = {
            default: ['#F04251',  'rgba(255,255,255,0.18)', 'none'],
            red:     ['#8b0000',  'rgba(139,0,0,0.45)',     'none'],
            blue:    ['#2563eb',  'rgba(74,158,224,0.35)',  '1px solid rgba(74,158,224,0.5)'],
            teal:    ['#00827f',  'rgba(0,130,127,0.35)',   '1px solid rgba(0,130,127,0.5)'],
            green:   ['#306030',  'rgba(48,96,48,0.35)',    '1px solid rgba(48,96,48,0.5)'],
          };
          const [activeBg, inactiveBg, inactiveBorder] = colors[item.color] ?? colors.default;
          const bg     = item.active ? activeBg  : inactiveBg;
          const border = item.active ? 'none'    : inactiveBorder;

          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className="rounded-full text-xs font-medium tracking-wide transition-all duration-150 hover:opacity-80 active:scale-95"
              style={{
                padding: '5px 16px',
                backgroundColor: bg,
                color: '#fff',
                border,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

    </header>
  );
}
