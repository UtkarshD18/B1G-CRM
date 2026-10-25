import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../../shared/api';
import { useAuth } from '../../shared/auth';
import { useTheme } from '../../shared/theme';

function LoginPage({ role, title, subtitle, endpoint, allowSignup = false }) {
  const { setRoleToken } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const tokenHandled = useRef(false);

  function getNextPath() {
    const params = new URLSearchParams(location.search);
    const nextPath = params.get('next');
    if (nextPath && nextPath.startsWith(`/${role}/`)) {
      return nextPath;
    }

    return `/${role}/dashboard`;
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const incomingToken = params.get('token');
    if (!incomingToken || tokenHandled.current) {
      return;
    }

    tokenHandled.current = true;
    setRoleToken(role, incomingToken);
    navigate(getNextPath(), { replace: true });
  }, [location.search, role]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: { email, password },
      });

      if (!result?.success || !result?.token) {
        setStatus(result?.msg || 'Login failed');
        return;
      }

      setRoleToken(role, result.token);
      navigate(getNextPath(), { replace: true });
    } catch (error) {
      setStatus(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const roleMeta = {
    user: {
      badge: 'Business Workspace',
      badgeBg: '#eff6ff',
      badgeColor: '#2563eb',
      badgeBorder: '#dbeafe',
      heading: 'User Sign In',
      subtext: 'Manage omnichannel conversations, team agents, and automated chatbot journeys.',
    },
    agent: {
      badge: 'Support Agent Console',
      badgeBg: '#f1f5f9',
      badgeColor: '#475569',
      badgeBorder: '#e2e8f0',
      heading: 'Agent Sign In',
      subtext: 'Respond to assigned WhatsApp, Instagram, and live web inquiries in real time.',
    },
    admin: {
      badge: 'Platform Administration',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      badgeBorder: '#fde68a',
      heading: 'Admin Sign In',
      subtext:
        'Oversee multi-tenant accounts, subscription plans, platform settings, and telemetry.',
    },
  };

  const meta = roleMeta[role] || {
    badge: `${role} portal`,
    badgeBg: '#f1f5f9',
    badgeColor: '#475569',
    badgeBorder: '#e2e8f0',
    heading: title,
    subtext: subtitle,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDarkMode ? '#0a0a0a' : '#faf8f5',
        color: isDarkMode ? '#ededed' : '#1c1917',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 20px',
        boxSizing: 'border-box',
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Brand Header */}
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          marginBottom: '32px',
        }}
      >
        <img
          src={isDarkMode ? '/favicon-dark.svg' : '/favicon-light.svg'}
          alt="OMNI CRM"
          style={{ width: '32px', height: '32px', borderRadius: '8px' }}
        />
        <span
          style={{
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            color: isDarkMode ? '#ededed' : '#1c1917',
          }}
        >
          OMNI CRM
        </span>
      </Link>

      {/* Attio-Style Centered Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: isDarkMode ? '#121212' : '#ffffff',
          border: isDarkMode ? '1px solid #242424' : '1px solid #e7e3da',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: isDarkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.45)'
            : '0 4px 20px -2px rgba(35, 25, 15, 0.05), 0 1px 3px rgba(35, 25, 15, 0.03)',
          boxSizing: 'border-box',
        }}
      >
        {/* Role Badge & Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span
            style={{
              display: 'inline-block',
              background: meta.badgeBg,
              color: meta.badgeColor,
              border: `1px solid ${meta.badgeBorder}`,
              fontSize: '12px',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '9999px',
              marginBottom: '14px',
              letterSpacing: '-0.01em',
            }}
          >
            {meta.badge}
          </span>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: isDarkMode ? '#ededed' : '#1c1917',
              margin: '0 0 8px 0',
              letterSpacing: '-0.025em',
            }}
          >
            {meta.heading}
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: isDarkMode ? '#888888' : '#78716c',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            {meta.subtext}
          </p>
        </div>

        {/* Auth Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '6px',
              }}
            >
              Email address
            </label>
            <input
              autoComplete="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0f172a',
                }}
              >
                Password
              </label>
            </div>
            <input
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {status && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              {status}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '8px',
              background: '#2563eb',
              border: '1px solid #2563eb',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease, transform 0.1s ease',
              marginTop: '4px',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)',
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#1d4ed8')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#2563eb')}
          >
            {loading ? 'Authenticating...' : 'Sign in'}
          </button>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
              fontSize: '13px',
            }}
          >
            <Link
              to="/signin"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#0f172a')}
              onMouseLeave={(e) => (e.target.style.color = '#64748b')}
            >
              ← Back to portal chooser
            </Link>

            {allowSignup && (
              <div style={{ color: '#64748b' }}>
                New to OMNI CRM?{' '}
                <Link
                  to="/signup?plan=trial"
                  style={{
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: '600',
                  }}
                >
                  Start 10-day free trial
                </Link>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: '40px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#94a3b8',
          display: 'flex',
          gap: '16px',
        }}
      >
        <span>© {new Date().getFullYear()} OMNI CRM</span>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          Home
        </Link>
        <Link to="/signin" style={{ color: 'inherit', textDecoration: 'none' }}>
          Portals
        </Link>
      </footer>
    </div>
  );
}

export default LoginPage;
