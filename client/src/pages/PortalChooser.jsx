import { useState } from 'react';
import { Link } from 'react-router-dom';

function PortalChooser() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const roles = [
    {
      title: 'Admin',
      description: 'Pricing, users, orders, SMTP, payments, and CMS operations.',
      to: '/admin/login',
      icon: '⚙️',
      glow: 'rgba(30, 160, 133, 0.4)',
      glowShadow: '0 12px 30px rgba(30, 160, 133, 0.1)',
    },
    {
      title: 'User',
      description: 'Tenant workspace for inbox, automation, campaigns, contacts, and agents.',
      to: '/user/login',
      icon: '💼',
      glow: 'rgba(59, 130, 246, 0.4)',
      glowShadow: '0 12px 30px rgba(59, 130, 246, 0.1)',
    },
    {
      title: 'Agent',
      description: 'Assigned chats and task handling with restricted access.',
      to: '/agent/login',
      icon: '👥',
      glow: 'rgba(168, 85, 247, 0.4)',
      glowShadow: '0 12px 30px rgba(168, 85, 247, 0.1)',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f3eee7',
        color: '#10212d',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        padding: '40px 20px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Back to Public Site Link */}
      <Link
        to="/"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#475569',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 'bold',
          padding: '8px 16px',
          borderRadius: '50px',
          background: '#ffffff',
          border: '1px solid rgba(16, 33, 45, 0.12)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          transition: 'all 0.2s ease',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#10212d';
          e.currentTarget.style.background = '#fafafa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#475569';
          e.currentTarget.style.background = '#ffffff';
        }}
      >
        ← Back to Main Site
      </Link>

      <div
        style={{
          zIndex: 1,
          maxWidth: '1000px',
          width: '100%',
          textAlign: 'center',
          marginBottom: '48px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(30, 160, 133, 0.12)',
            color: '#1ea085',
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            padding: '6px 16px',
            borderRadius: '50px',
            border: '1px solid rgba(30, 160, 133, 0.25)',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(30, 160, 133, 0.08)',
          }}
        >
          Portal Entry
        </span>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: '800',
            margin: '0 0 16px 0',
            lineHeight: '1.2',
            color: '#10212d',
          }}
        >
          Choose the workspace you need.
        </h1>
        <p
          style={{
            fontSize: 'clamp(14px, 2vw, 17px)',
            color: '#475569',
            margin: 0,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.5',
          }}
        >
          Access the correct workspace dashboard based on your role privileges and operations.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          maxWidth: '1000px',
          width: '100%',
          zIndex: 1,
          boxSizing: 'border-box',
        }}
      >
        {roles.map((role, index) => {
          const isHovered = hoveredIndex === index;
          return (
            <Link
              key={role.title}
              to={role.to}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                border: isHovered ? `1px solid ${role.glow}` : '1px solid rgba(16, 33, 45, 0.12)',
                borderRadius: '20px',
                padding: '40px 30px',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                boxShadow: isHovered ? role.glowShadow : '0 4px 20px rgba(0, 0, 0, 0.02)',
                cursor: 'pointer',
              }}
            >
              {/* Icon Container */}
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '20px',
                  alignSelf: 'flex-start',
                  background: isHovered ? 'rgba(16, 33, 45, 0.05)' : 'rgba(16, 33, 45, 0.02)',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  border: '1px solid rgba(16, 33, 45, 0.08)',
                  transition: 'all 0.3s ease',
                }}
              >
                {role.icon}
              </div>

              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  margin: '0 0 12px 0',
                  color: '#10212d',
                  transition: 'color 0.2s ease',
                }}
              >
                {role.title}
              </h2>

              <p
                style={{
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                {role.description}
              </p>

              {/* Action link styling */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isHovered ? '#1ea085' : '#475569',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                }}
              >
                Enter Dashboard{' '}
                <span
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default PortalChooser;
