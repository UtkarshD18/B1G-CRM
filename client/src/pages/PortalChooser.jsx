import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../shared/theme';

function PortalChooser() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const roles = [
    {
      title: 'Business Workspace',
      badge: 'Teams & Owners',
      badgeBg: isDarkMode ? '#1e293b' : '#eff6ff',
      badgeColor: '#3b82f6',
      badgeBorder: isDarkMode ? '#334155' : '#dbeafe',
      description:
        'Access your omnichannel inbox, AI chatbot automation flows, customer contacts, and team members.',
      to: '/user/login',
      cta: 'Sign In to Workspace',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      signupLink: { text: 'New to OMNI CRM? Start 10-day free trial', to: '/signup?plan=trial' },
    },
    {
      title: 'Support Agent',
      badge: 'Live Operations',
      badgeBg: isDarkMode ? '#1c1917' : '#f1f5f9',
      badgeColor: isDarkMode ? '#a8a29e' : '#475569',
      badgeBorder: isDarkMode ? '#292524' : '#e2e8f0',
      description:
        'Handle assigned customer conversations across WhatsApp, Instagram, and webchat with real-time tools.',
      to: '/agent/login',
      cta: 'Agent Sign In',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isDarkMode ? '#a8a29e' : '#475569'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h.01" />
          <path d="M12 10h.01" />
          <path d="M16 10h.01" />
        </svg>
      ),
      signupLink: null,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDarkMode ? '#0a0a0a' : '#faf8f5',
        color: isDarkMode ? '#ededed' : '#1c1917',
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '32px 20px 60px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation */}
      <header
        style={{
          width: '100%',
          maxWidth: '1080px',
          margin: '0 auto 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            color: isDarkMode ? '#ededed' : '#1c1917',
            textDecoration: 'none',
          }}
        >
          <img
            src={isDarkMode ? '/favicon-dark.svg' : '/favicon-light.svg'}
            alt="OMNI CRM"
            style={{ width: '28px', height: '28px', borderRadius: '7px' }}
          />
          <span
            style={{
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              color: isDarkMode ? '#ededed' : '#1c1917',
            }}
          >
            OMNI CRM
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            className="liquid-glass-theme-btn"
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            style={{ height: '34px', padding: '0 12px', fontSize: '13px' }}
          >
            <span className="liquid-glass-icon" style={{ fontSize: '13px', lineHeight: 1 }}>
              {isDarkMode ? '☀️' : '🌙'}
            </span>
            <span style={{ fontWeight: '600', letterSpacing: '-0.01em' }}>
              {isDarkMode ? 'Light' : 'Dark'}
            </span>
            <span className="liquid-ripple-wave" />
          </button>
          <Link
            to="/"
            style={{
              color: isDarkMode ? '#a1a1aa' : '#64748b',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.target.style.color = isDarkMode ? '#ffffff' : '#0f172a')}
            onMouseLeave={(e) => (e.target.style.color = isDarkMode ? '#a1a1aa' : '#64748b')}
          >
            Back to Home
          </Link>
          <Link
            to="/signup?plan=trial"
            style={{
              background: '#2563eb',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#1d4ed8')}
            onMouseLeave={(e) => (e.target.style.background = '#2563eb')}
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          maxWidth: '840px',
          width: '100%',
          margin: '0 auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Header Lockup */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isDarkMode ? '#1e293b' : '#eff6ff',
              color: '#3b82f6',
              fontSize: '12px',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '9999px',
              border: isDarkMode ? '1px solid #334155' : '1px solid #dbeafe',
              marginBottom: '16px',
            }}
          >
            OMNI CRM Authentication
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: '700',
              margin: '0 0 12px 0',
              lineHeight: '1.15',
              color: isDarkMode ? '#ededed' : '#1c1917',
              letterSpacing: '-0.03em',
            }}
          >
            Sign in to your workspace
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: isDarkMode ? '#888888' : '#78716c',
              margin: 0,
              maxWidth: '540px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: '1.6',
            }}
          >
            Select your portal to access live conversation queues, customer contacts, and automated
            workflows.
          </p>
        </div>

        {/* 2-Card Grid: Business Workspace & Support Agent */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {roles.map((role, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={role.title}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: isDarkMode ? '#121212' : '#ffffff',
                  border: isHovered
                    ? '1px solid #3b82f6'
                    : isDarkMode
                      ? '1px solid #242424'
                      : '1px solid #e7e3da',
                  borderRadius: '16px',
                  padding: '32px 26px',
                  boxShadow: isHovered
                    ? isDarkMode
                      ? '0 10px 25px -5px rgba(0, 0, 0, 0.6)'
                      : '0 10px 25px -5px rgba(40, 30, 20, 0.08), 0 8px 10px -6px rgba(40, 30, 20, 0.04)'
                    : isDarkMode
                      ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                      : '0 2px 10px rgba(40, 30, 20, 0.04)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: role.badgeBg,
                      border: `1px solid ${role.badgeBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {role.icon}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '3px 9px',
                      borderRadius: '9999px',
                      background: role.badgeBg,
                      color: role.badgeColor,
                      border: `1px solid ${role.badgeBorder}`,
                    }}
                  >
                    {role.badge}
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: '19px',
                    fontWeight: '700',
                    margin: '0 0 8px 0',
                    color: isDarkMode ? '#ededed' : '#1c1917',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {role.title}
                </h2>

                <p
                  style={{
                    fontSize: '14px',
                    color: isDarkMode ? '#888888' : '#78716c',
                    lineHeight: '1.55',
                    margin: '0 0 24px 0',
                    flexGrow: 1,
                  }}
                >
                  {role.description}
                </p>

                <Link
                  to={role.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '11px 18px',
                    borderRadius: '8px',
                    background: index === 0 ? '#2563eb' : isDarkMode ? '#ffffff' : '#0f172a',
                    color: index === 0 ? '#ffffff' : isDarkMode ? '#0f172a' : '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'opacity 0.15s ease',
                    boxShadow: index === 0 ? '0 1px 3px rgba(37, 99, 235, 0.3)' : 'none',
                  }}
                  onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.target.style.opacity = '1')}
                >
                  {role.cta}
                </Link>

                {role.signupLink && (
                  <div style={{ marginTop: '14px', textAlign: 'center' }}>
                    <Link
                      to={role.signupLink.to}
                      style={{
                        fontSize: '12px',
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontWeight: '600',
                      }}
                    >
                      {role.signupLink.text}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Discrete Administrator link */}
        <div
          style={{
            marginTop: '48px',
            textAlign: 'center',
            fontSize: '13px',
            color: isDarkMode ? '#888888' : '#78716c',
          }}
        >
          <span>Platform developer or system owner? </span>
          <Link
            to="/admin/login"
            style={{
              color: isDarkMode ? '#ededed' : '#1c1917',
              textDecoration: 'underline',
              fontWeight: '600',
              marginLeft: '4px',
            }}
          >
            Sign in to Admin Console
          </Link>
        </div>
      </main>
    </div>
  );
}

export default PortalChooser;
