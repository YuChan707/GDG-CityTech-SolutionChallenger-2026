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

  const homeActive = ['/', '/questionnaire', '/results'].includes(location.pathname);

  const navItems = [
    { label: 'Home page',           onClick: handleHome,                       active: homeActive },
    { label: 'About the project',   onClick: () => navigate('/about'),          active: location.pathname === '/about' },
    { label: 'Review people',       onClick: () => navigate('/reviews'),        active: location.pathname === '/reviews' },
    { label: 'Submit request',      onClick: () => navigate('/submit'),         active: location.pathname === '/submit' },
  ];

  return (
    <header style={{ backgroundColor: '#AD2B0B', position: 'sticky', top: 0, zIndex: 100 }}>

      {/* Title row */}
      <div className="text-center" style={{ paddingTop: '10px', paddingBottom: '2px' }}>
        <span
          className="text-xs uppercase"
          style={{ letterSpacing: '0.22em', color: 'rgba(255, 234, 3, 0.84)', fontSize: "30px"}}
        >
          Google Solution Challenger 2026
        </span>
        <p
          className="text-xs uppercase"
          style={{ letterSpacing: '0.22em', color: 'rgba(255, 96, 96, 0.82)', fontSize: "20px"}}
        >
          GDG City Tech (CUNY New York City of Technology)
        </p>
                <p
          className="text-xs uppercase"
          style={{ letterSpacing: '0.22em', color: 'rgba(255,255,255,0.45)', fontSize: "15px"}}
        >
          "Support local business"
        </p>
      </div>

      {/* Nav buttons */}
      <nav
        className="flex items-center justify-center flex-wrap"
        style={{ gap: '8px', padding: '8px 20px 12px' }}
      >
        {navItems.map(item => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="rounded-full text-xs font-medium tracking-wide transition-all duration-150 hover:opacity-80 active:scale-95"
            style={{
              padding: '5px 16px',
              backgroundColor: item.active ? '#F04251' : 'rgba(255,255,255,0.18)',
              color: item.active ? '#fff' : 'rgba(255,255,255,0.8)',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

    </header>
  );
}
