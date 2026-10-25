import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../shared/api';
import { DEFAULT_PLANS } from '../shared/constants';
import { formatMoney } from '../shared/format';
import { useTheme } from '../shared/theme';

function PublicSite() {
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const { isDarkMode, toggleTheme } = useTheme();
  const [showBanner, setShowBanner] = useState(true);
  const [activeChannel, setActiveChannel] = useState('whatsapp');
  const [activePillar, setActivePillar] = useState(0);
  const themeButtonRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadPlans() {
      try {
        const result = await apiRequest('/api/admin/get_plans');
        if (active && Array.isArray(result?.data) && result.data.length > 0) {
          setPlans(result.data);
        }
      } catch {
        // Fallback to DEFAULT_PLANS
      }
    }

    loadPlans();

    return () => {
      active = false;
    };
  }, []);

  const conversationDemos = {
    whatsapp: {
      customer: 'Rahul Sharma',
      channel: 'WhatsApp Cloud API',
      phone: '+91 98765 43210',
      initialMsg:
        'Hi! Can we automate product ordering and order tracking for 2,000 daily customers?',
      botReply:
        'Yes! OMNI CRM connects directly to WhatsApp Cloud API with catalog syncing and auto-responder bot journeys.',
      agentStatus: 'Assigned to Enterprise Sales • Just now',
    },
    instagram: {
      customer: 'Amina Yusuf',
      channel: 'Instagram Direct',
      phone: '@aminadesigns',
      initialMsg: 'Do you support automated replies to Instagram story mentions and reel comments?',
      botReply:
        'Yes! All story mentions and DMs route into your unified inbox with instant AI triage.',
      agentStatus: 'Assigned to Support Rep • 2m ago',
    },
    webchat: {
      customer: 'Acme Retail Inc.',
      channel: 'Website Live Widget',
      phone: 'web-session-#4829',
      initialMsg: 'Can we embed the live chat widget on our Shopify store and custom React app?',
      botReply:
        'Absolutely! Our lightweight snippet installs in 60 seconds with full webhook sync.',
      agentStatus: 'Assigned to Customer Success • 5m ago',
    },
  };

  const activeDemo = conversationDemos[activeChannel] || conversationDemos.whatsapp;

  // The 5 Attio-style interactive pillars extracted from the reverse engineering report
  const pillars = [
    {
      id: 'pipeline',
      title: 'Build pipeline',
      subtitle: 'Unify incoming conversations into enriched revenue pipeline.',
      badge: 'Omnichannel Capture',
      preview: {
        heading: 'Omnichannel Deal Pipeline',
        metric: '$420,000',
        metricLabel: 'Active Pipeline Value',
        items: [
          {
            name: 'Stripe Global',
            channel: 'WhatsApp',
            value: '$84,000',
            stage: 'Qualified • AI Scored 98/100',
            color: '#10b981',
          },
          {
            name: 'Linear Systems',
            channel: 'Instagram',
            value: '$120,000',
            stage: 'Contract Sent • In Review',
            color: '#2563eb',
          },
          {
            name: 'Vercel Labs',
            channel: 'Webchat',
            value: '$216,000',
            stage: 'Discovery Demo Scheduled',
            color: '#8b5cf6',
          },
        ],
      },
    },
    {
      id: 'leads',
      title: 'Convert leads',
      subtitle: 'AI agents qualify intent, sync catalogs, and triage in seconds.',
      badge: 'Autonomous Agents',
      preview: {
        heading: 'Autonomous Lead Qualification',
        metric: '< 4 seconds',
        metricLabel: 'Average First Response',
        items: [
          {
            name: 'Intent Classifier',
            channel: 'AI Model',
            value: 'High Intent',
            stage: 'Route to Account Exec',
            color: '#2563eb',
          },
          {
            name: 'Budget Verification',
            channel: 'AI Workflow',
            value: '$50k+ ARR',
            stage: 'Threshold Met',
            color: '#10b981',
          },
          {
            name: 'Calendar Booking',
            channel: 'Sync Engine',
            value: 'Booked',
            stage: 'Meeting confirmed for 2 PM',
            color: '#f59e0b',
          },
        ],
      },
    },
    {
      id: 'motions',
      title: 'Run sales motions',
      subtitle: 'Targeted WhatsApp broadcasts and segmented lead playbooks.',
      badge: 'Targeted Outreach',
      preview: {
        heading: 'Broadcast Campaigns & Lists',
        metric: '98.4%',
        metricLabel: 'WhatsApp Open Rate',
        items: [
          {
            name: 'Q4 Enterprise Upgrade',
            channel: 'WhatsApp Broadcast',
            value: '4,200 Recipients',
            stage: 'Delivered • 84% read',
            color: '#10b981',
          },
          {
            name: 'Product Drop Story Blast',
            channel: 'Instagram Direct',
            value: '1,850 Leads',
            stage: 'Active Automation Flow',
            color: '#ec4899',
          },
          {
            name: 'Re-engagement Sequence',
            channel: 'Multi-Channel',
            value: '620 Contacts',
            stage: 'Scheduled for Tomorrow',
            color: '#6366f1',
          },
        ],
      },
    },
    {
      id: 'forecast',
      title: 'Forecast revenue',
      subtitle: 'Predictable pipeline visibility across all multi-tenant channels.',
      badge: 'Predictive Intel',
      preview: {
        heading: 'Multi-Tenant Revenue Telemetry',
        metric: '3.4x',
        metricLabel: 'Faster Deal Velocity',
        items: [
          {
            name: 'Win Probability',
            channel: 'Predictive Model',
            value: '88%',
            stage: 'Projected Close: Friday',
            color: '#10b981',
          },
          {
            name: 'Agent Response Latency',
            channel: 'Performance SLA',
            value: '1.2m',
            stage: 'Exceeding Target SLA',
            color: '#2563eb',
          },
          {
            name: 'Channel Contribution',
            channel: 'WhatsApp: 62%',
            value: 'Web: 38%',
            stage: 'Balanced Distribution',
            color: '#8b5cf6',
          },
        ],
      },
    },
    {
      id: 'retain',
      title: 'Retain and expand',
      subtitle: 'Continuous customer lifecycle health scores and automated renewals.',
      badge: 'Customer Health',
      preview: {
        heading: 'Customer Health & Account Expansion',
        metric: '124%',
        metricLabel: 'Net Revenue Retention',
        items: [
          {
            name: 'Acme Retail Global',
            channel: 'Enterprise Tenant',
            value: 'Tier 3 VIP',
            stage: 'Expansion Opportunity',
            color: '#10b981',
          },
          {
            name: 'Monolith Logistics',
            channel: 'Mid-Market',
            value: 'Healthy (94)',
            stage: 'Contract Renews in 30d',
            color: '#2563eb',
          },
          {
            name: 'Apex Media Corp',
            channel: 'Growth Tenant',
            value: 'High Usage',
            stage: 'Seat Limit Approaching',
            color: '#f59e0b',
          },
        ],
      },
    },
  ];

  return (
    <div
      className={`public-page ${isDarkMode ? 'dark-theme' : ''}`}
      style={{
        background: isDarkMode ? '#0a0a0a' : '#faf8f5',
        minHeight: '100vh',
        color: isDarkMode ? '#ededed' : '#1c1917',
      }}
    >
      {/* 1. Attio Top Announcement Banner */}
      {showBanner && (
        <div
          style={{
            background: isDarkMode ? '#171717' : '#0f172a',
            color: '#ffffff',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            position: 'relative',
            borderBottom: isDarkMode ? '1px solid #262626' : '1px solid #1e293b',
          }}
        >
          <span>The new architecture for agentic revenue is here</span>
          <Link
            to="/signup?plan=trial"
            style={{
              color: '#60a5fa',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Explore evaluation →
          </Link>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            aria-label="Dismiss banner"
            style={{
              position: 'absolute',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Minimalist Attio Header */}
      <header
        className="public-header"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDarkMode
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(231, 227, 218, 0.85)',
          position: 'relative',
          zIndex: 100,
        }}
      >
        {/* Aesthetic Company Brand */}
        <Link to="/" className="brand-link">
          <div className="brand-icon-wrapper">
            <img
              src={isDarkMode ? '/favicon-dark.svg' : '/favicon-light.svg'}
              alt="OMNI CRM Logo"
              style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain' }}
            />
          </div>
          <div className="brand-typography">
            <span className="brand-name">OMNI</span>
            <span className="brand-badge">CRM</span>
          </div>
        </Link>

        {/* Center / Right Nav Items - Optically Centered & Aligned on Baseline */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px', height: '38px' }}>
          <a href="#features" className="nav-link-item">
            Platform ▾
          </a>
          <a href="#demo" className="nav-link-item">
            Solutions ▾
          </a>
          <a href="#pricing" className="nav-link-item">
            Pricing
          </a>
          <Link to="/signin" className="nav-link-item">
            Sign in
          </Link>
          <Link
            to="/signup?plan=trial"
            className="nav-cta-btn primary-button"
            style={{
              height: '38px',
              padding: '0 20px',
              fontSize: '13px',
              fontWeight: '600',
              borderRadius: '9999px',
              background: isDarkMode ? '#ffffff' : '#0f172a',
              color: isDarkMode ? '#0f172a' : '#ffffff',
              textDecoration: 'none',
              boxShadow: isDarkMode
                ? '0 2px 10px rgba(255,255,255,0.18)'
                : '0 2px 8px rgba(15,23,42,0.12)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ color: isDarkMode ? '#0f172a' : '#ffffff', fontWeight: '600' }}>
              Start free trial
            </span>
          </Link>
          <button
            ref={themeButtonRef}
            id="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="liquid-glass-theme-btn"
          >
            <span
              style={{
                fontSize: '14px',
                display: 'inline-block',
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </span>
            <span style={{ fontWeight: '600', letterSpacing: '-0.01em' }}>
              {isDarkMode ? 'Light' : 'Dark'}
            </span>
          </button>
        </nav>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* 3. Grand Centered Attio Hero Section */}
        <section style={{ textAlign: 'center', padding: '64px 0 52px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isDarkMode ? '#1e293b' : '#eff6ff',
              color: '#2563eb',
              border: isDarkMode ? '1px solid #334155' : '1px solid #dbeafe',
              fontSize: '12px',
              fontWeight: '600',
              padding: '5px 14px',
              borderRadius: '9999px',
              marginBottom: '20px',
              letterSpacing: '-0.01em',
            }}
          >
            OMNI 2.0 • The platform for agentic revenue ›
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.8rem, 5.8vw, 4.4rem)',
              fontWeight: '700',
              letterSpacing: '-0.04em',
              lineHeight: '1.05',
              color: isDarkMode ? '#ffffff' : '#0f172a',
              margin: '0 auto 18px',
              maxWidth: '900px',
            }}
          >
            Welcome to agentic revenue.
          </h1>

          <p
            className="hero-lead"
            style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
              fontWeight: '500',
              color: isDarkMode ? '#d4d4d8' : '#334155',
              margin: '0 auto 10px',
              maxWidth: '740px',
              lineHeight: '1.4',
            }}
          >
            One unified inbox for WhatsApp, Instagram, and web visitors.
          </p>

          <p
            className="hero-subtext"
            style={{
              fontSize: '16px',
              color: isDarkMode ? '#a1a1aa' : '#64748b',
              margin: '0 auto 32px',
              maxWidth: '640px',
              lineHeight: '1.6',
            }}
          >
            Attio-grade speed, multi-channel customer intelligence, and automated AI journeys that
            advance deals and close revenue around the clock.
          </p>

          {/* Centered Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              marginBottom: '28px',
            }}
          >
            <Link
              to="/signup?plan=trial"
              className="primary-button"
              style={{
                background: isDarkMode ? '#ffffff' : '#0f172a',
                border: isDarkMode ? '1px solid #ffffff' : '1px solid #0f172a',
                color: isDarkMode ? '#000000' : '#ffffff',
                padding: '13px 26px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                boxShadow: isDarkMode
                  ? '0 4px 14px rgba(255, 255, 255, 0.2)'
                  : '0 4px 14px rgba(15, 23, 42, 0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ color: isDarkMode ? '#000000' : '#ffffff', fontWeight: '600' }}>
                Start free trial
              </span>
              <span
                className="btn-arrow"
                style={{
                  transition: 'transform 0.2s ease',
                  color: isDarkMode ? '#000000' : '#ffffff',
                }}
              >
                →
              </span>
            </Link>
            <Link
              to="/signin"
              className="secondary-button"
              style={{
                background: isDarkMode ? '#141414' : '#ffffff',
                border: isDarkMode ? '1px solid #2a2a2a' : '1px solid #e2e8f0',
                color: isDarkMode ? '#ffffff' : '#0f172a',
                padding: '13px 26px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Talk to sales
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              fontSize: '13px',
              color: isDarkMode ? '#71717a' : '#64748b',
              flexWrap: 'wrap',
            }}
          >
            <span>✓ 10-day evaluation</span>
            <span>✓ No credit card required</span>
            <span>✓ Setup in 5 minutes</span>
          </div>
        </section>

        {/* 4. The Centered 3D Product Canvas (Mac Window Preview) */}
        <section id="demo" style={{ margin: '0 auto 80px', maxWidth: '1100px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: '20px',
              background: isDarkMode ? '#111111' : '#ffffff',
              border: isDarkMode ? '1px solid #262626' : '1px solid #e2e8f0',
              boxShadow:
                '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 1px 3px rgba(15, 23, 42, 0.05)',
              overflow: 'hidden',
            }}
          >
            {/* Window Title Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                background: isDarkMode ? '#171717' : '#f8fafc',
                borderBottom: isDarkMode ? '1px solid #242424' : '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ff5f56',
                  }}
                />
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ffbd2e',
                  }}
                />
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#27c93f',
                  }}
                />
                <span
                  style={{
                    marginLeft: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: isDarkMode ? '#a1a1aa' : '#475569',
                  }}
                >
                  Basepoint Workspace ▾
                </span>
                <span
                  style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isDarkMode ? '#262626' : '#e2e8f0',
                    fontSize: '11px',
                    color: isDarkMode ? '#a1a1aa' : '#64748b',
                  }}
                >
                  ⌘K
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#10b981' }}>
                  Live API Stream
                </span>
              </div>
            </div>

            {/* Window Canvas Body */}
            <div style={{ padding: '28px' }}>
              {/* AI Assistant Command Bar Header */}
              <div style={{ marginBottom: '24px' }}>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: isDarkMode ? '#ffffff' : '#0f172a',
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Good morning, Alex
                </h3>

                <div
                  style={{
                    background: isDarkMode ? '#18181b' : '#f8fafc',
                    border: isDarkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '14px', color: isDarkMode ? '#71717a' : '#94a3b8' }}>
                    How do I advance my active deal with {activeDemo.customer}?
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#eff6ff',
                        color: '#2563eb',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        border: '1px solid #dbeafe',
                      }}
                    >
                      Auto AI
                    </span>
                    <button
                      type="button"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ↑
                    </button>
                  </div>
                </div>

                {/* Prompt suggestion chips */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {[
                    'Prep for next meeting',
                    'Recap last conversation',
                    'Automate WhatsApp flow',
                  ].map((chip) => (
                    <span
                      key={chip}
                      style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: isDarkMode ? '#a1a1aa' : '#64748b',
                        background: isDarkMode ? '#18181b' : '#f1f5f9',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        border: isDarkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              {/* Channel Tabs */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '18px',
                  paddingBottom: '14px',
                  borderBottom: isDarkMode ? '1px solid #242424' : '1px solid #f1f5f9',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: isDarkMode ? '#ededed' : '#0f172a',
                  }}
                >
                  Live Channel Inbox
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['whatsapp', 'instagram', 'webchat'].map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => setActiveChannel(channel)}
                      style={{
                        border:
                          activeChannel === channel
                            ? '1px solid #2563eb'
                            : isDarkMode
                              ? '1px solid #262626'
                              : '1px solid #e2e8f0',
                        background:
                          activeChannel === channel
                            ? '#2563eb'
                            : isDarkMode
                              ? '#141414'
                              : '#ffffff',
                        color:
                          activeChannel === channel
                            ? '#ffffff'
                            : isDarkMode
                              ? '#888888'
                              : '#64748b',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        padding: '5px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Simulation Stage */}
              <div
                style={{
                  background: isDarkMode ? '#0a0a0a' : '#f8fafc',
                  border: isDarkMode ? '1px solid #202020' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* Inbound msg */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: isDarkMode ? '#ffffff' : '#0f172a',
                      }}
                    >
                      {activeDemo.customer}
                    </span>
                    <span style={{ fontSize: '11px', color: isDarkMode ? '#71717a' : '#94a3b8' }}>
                      via {activeDemo.channel}
                    </span>
                  </div>
                  <div
                    style={{
                      background: isDarkMode ? '#18181b' : '#ffffff',
                      border: isDarkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
                      borderRadius: '10px 10px 10px 2px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      maxWidth: '85%',
                      color: isDarkMode ? '#e4e4e7' : '#1e293b',
                    }}
                  >
                    {activeDemo.initialMsg}
                  </div>
                </div>

                {/* AI pill */}
                <div
                  style={{
                    alignSelf: 'center',
                    background: '#eff6ff',
                    border: '1px solid #dbeafe',
                    color: '#2563eb',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                  }}
                >
                  AI Auto-Response • Qualified
                </div>

                {/* Bot reply */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: isDarkMode ? '#ffffff' : '#0f172a',
                      marginBottom: '4px',
                    }}
                  >
                    OMNI AI Assistant
                  </span>
                  <div
                    style={{
                      background: '#2563eb',
                      borderRadius: '10px 10px 2px 10px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      maxWidth: '85%',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                    }}
                  >
                    {activeDemo.botReply}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '8px',
                    paddingTop: '12px',
                    borderTop: isDarkMode ? '1px solid #242424' : '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: isDarkMode ? '#71717a' : '#64748b',
                  }}
                >
                  <span>{activeDemo.agentStatus}</span>
                  <span style={{ color: '#2563eb', fontWeight: '600' }}>
                    Active Webhook Connected ✓
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 5. Attio Signature Interactive Sticky Pinned Stage (Section 2 from reverse engineering report) */}
        <section
          style={{
            padding: '64px 0 84px',
            borderTop: isDarkMode ? '1px solid #202020' : '1px solid #f1f5f9',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Sticky Navigation List */}
            <div style={{ position: 'sticky', top: '100px' }}>
              <div
                style={{
                  display: 'inline-block',
                  background: isDarkMode ? '#1e293b' : '#eff6ff',
                  color: '#2563eb',
                  border: isDarkMode ? '1px solid #334155' : '1px solid #dbeafe',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  marginBottom: '16px',
                }}
              >
                Pillars of Revenue
              </div>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                  fontWeight: '700',
                  letterSpacing: '-0.03em',
                  color: isDarkMode ? '#ffffff' : '#0f172a',
                  margin: '0 0 28px 0',
                  lineHeight: '1.15',
                }}
              >
                The platform built for high-velocity teams.
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pillars.map((pillar, idx) => {
                  const isActive = activePillar === idx;
                  return (
                    <div
                      key={pillar.id}
                      onClick={() => setActivePillar(idx)}
                      style={{
                        cursor: 'pointer',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                        background: isActive ? (isDarkMode ? '#18181b' : '#f8fafc') : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: isActive
                            ? isDarkMode
                              ? '#ffffff'
                              : '#0f172a'
                            : isDarkMode
                              ? '#71717a'
                              : '#94a3b8',
                          marginBottom: '4px',
                        }}
                      >
                        {pillar.title}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: isDarkMode ? '#a1a1aa' : '#64748b',
                          lineHeight: '1.45',
                        }}
                      >
                        {pillar.subtitle}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Dynamic Interactive Stage */}
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={pillars[activePillar].id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    background: isDarkMode ? '#121212' : '#ffffff',
                    border: isDarkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '28px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #dbeafe',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                      }}
                    >
                      {pillars[activePillar].badge}
                    </span>
                    <span style={{ fontSize: '12px', color: isDarkMode ? '#71717a' : '#94a3b8' }}>
                      Real-Time Workspace
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: isDarkMode ? '#ffffff' : '#0f172a',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {pillars[activePillar].preview.heading}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '8px',
                      margin: '12px 0 24px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: isDarkMode ? '#ffffff' : '#0f172a',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {pillars[activePillar].preview.metric}
                    </span>
                    <span style={{ fontSize: '13px', color: isDarkMode ? '#71717a' : '#64748b' }}>
                      {pillars[activePillar].preview.metricLabel}
                    </span>
                  </div>

                  {/* List Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pillars[activePillar].preview.items.map((item) => (
                      <div
                        key={item.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: isDarkMode ? '#18181b' : '#f8fafc',
                          borderRadius: '10px',
                          border: isDarkMode ? '1px solid #27272a' : '1px solid #f1f5f9',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: isDarkMode ? '#ffffff' : '#0f172a',
                            }}
                          >
                            {item.name}
                          </div>
                          <div
                            style={{ fontSize: '11px', color: isDarkMode ? '#71717a' : '#94a3b8' }}
                          >
                            {item.channel}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: item.color }}>
                            {item.value}
                          </div>
                          <div
                            style={{ fontSize: '11px', color: isDarkMode ? '#71717a' : '#64748b' }}
                          >
                            {item.stage}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Attio Dual Impact Highlight Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '16px',
                  marginTop: '24px',
                }}
              >
                <div
                  style={{
                    padding: '24px',
                    borderRadius: '14px',
                    background: isDarkMode ? '#141414' : '#f8fafc',
                    border: isDarkMode ? '1px solid #262626' : '1px solid #e2e8f0',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: isDarkMode ? '#ffffff' : '#0f172a',
                      margin: '0 0 6px 0',
                    }}
                  >
                    Free your reps to sell.
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: isDarkMode ? '#a1a1aa' : '#64748b',
                      margin: 0,
                      lineHeight: '1.5',
                    }}
                  >
                    AI agents handle triage and routine busywork. Reps focus their time where deals
                    get won.
                  </p>
                </div>

                <div
                  style={{
                    padding: '24px',
                    borderRadius: '14px',
                    background: isDarkMode ? '#141414' : '#f8fafc',
                    border: isDarkMode ? '1px solid #262626' : '1px solid #e2e8f0',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: isDarkMode ? '#ffffff' : '#0f172a',
                      margin: '0 0 6px 0',
                    }}
                  >
                    Agents dig. You close.
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: isDarkMode ? '#a1a1aa' : '#64748b',
                      margin: 0,
                      lineHeight: '1.5',
                    }}
                  >
                    Every lead is enriched and qualified in real time, so reps know exactly when and
                    why to engage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Feature Grid Section */}
        <section className="feature-grid-section" id="features" style={{ padding: '64px 0' }}>
          <div style={{ textAlign: 'left', marginBottom: '32px' }}>
            <span className="eyebrow" style={{ marginBottom: '10px', display: 'inline-block' }}>
              Platform Capabilities
            </span>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: isDarkMode ? '#ffffff' : '#0f172a',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Everything needed to scale customer engagement
            </h2>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <span className="eyebrow" style={{ marginBottom: '12px' }}>
                Channels
              </span>
              <h3>Unified Omnichannel Inbox</h3>
              <p>
                Consolidate WhatsApp Cloud API, Instagram Direct, and website live chat into one
                collaborative inbox with zero tab switching.
              </p>
            </article>
            <article className="feature-card">
              <span className="eyebrow" style={{ marginBottom: '12px' }}>
                Automation
              </span>
              <h3>Conversational Flow Builder</h3>
              <p>
                Design multi-node chatbot branches, keyword responses, and automatic lead
                qualification journeys on a visual drag-and-drop canvas.
              </p>
            </article>
            <article className="feature-card">
              <span className="eyebrow" style={{ marginBottom: '12px' }}>
                Outreach
              </span>
              <h3>Broadcast Campaigns & Lists</h3>
              <p>
                Segment contact phonebooks with custom tags, dispatch approved WhatsApp template
                broadcasts, and track delivery receipts in real time.
              </p>
            </article>
            <article className="feature-card">
              <span className="eyebrow" style={{ marginBottom: '12px' }}>
                Security
              </span>
              <h3>Multi-Tenant Team Roles</h3>
              <p>
                Keep front-line support focused on assigned chats while workspace managers inspect
                supervisor dashboards, analytics, and billing.
              </p>
            </article>
          </div>
        </section>

        {/* 7. Pricing Section */}
        <section className="pricing-section" id="pricing" style={{ padding: '64px 0' }}>
          <div style={{ textAlign: 'left', marginBottom: '32px' }}>
            <span className="eyebrow" style={{ marginBottom: '10px', display: 'inline-block' }}>
              Pricing
            </span>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: isDarkMode ? '#ffffff' : '#0f172a',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Simple, transparent plans for every team
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {plans.map((plan, index) => {
              const price = Number(plan.price || 0);
              const isTrial = price === 0 || plan.is_trial === 1 || String(plan.id) === 'trial';
              const isPopular = index === 1;

              return (
                <article
                  key={plan.id || plan.title}
                  className="pricing-card"
                  style={{
                    position: 'relative',
                    border: isPopular
                      ? '2px solid #2563eb'
                      : isDarkMode
                        ? '1px solid #2a2a2a'
                        : '1px solid #e2e8f0',
                    padding: '32px 24px',
                    borderRadius: '16px',
                    background: isDarkMode ? '#121212' : '#ffffff',
                  }}
                >
                  {isPopular && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '24px',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Popular
                    </span>
                  )}
                  <p
                    style={{
                      fontSize: '17px',
                      fontWeight: '700',
                      color: isDarkMode ? '#ffffff' : '#0f172a',
                      margin: '0 0 6px 0',
                    }}
                  >
                    {plan.title}
                  </p>
                  <div
                    style={{
                      margin: '12px 0 4px',
                      fontSize: '32px',
                      fontWeight: '700',
                      color: isDarkMode ? '#ffffff' : '#0f172a',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {formatMoney(price)}
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: isDarkMode ? '#71717a' : '#64748b',
                      margin: '0 0 16px 0',
                    }}
                  >
                    {plan.plan_duration_in_days || (isTrial ? 10 : 365)}-day access window
                  </p>
                  <p
                    style={{
                      minHeight: '40px',
                      fontSize: '14px',
                      color: isDarkMode ? '#a1a1aa' : '#64748b',
                      lineHeight: '1.5',
                    }}
                  >
                    {plan.short_description ||
                      (isTrial
                        ? 'Full evaluation access to inbox, flow builder, and campaigns.'
                        : 'Unlimited conversations, webhooks, and team collaboration.')}
                  </p>
                  <Link
                    to={`/signup?plan=${encodeURIComponent(plan.id || '')}`}
                    className="primary-button"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      marginTop: '16px',
                      textAlign: 'center',
                      borderRadius: '8px',
                      padding: '12px',
                      fontWeight: '600',
                    }}
                  >
                    {isTrial ? 'Start 10-Day Free Trial' : `Get Started with ${plan.title}`}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        {/* 8. Role Consoles Section */}
        <section className="roles-section" id="roles" style={{ padding: '48px 0 64px' }}>
          <div
            className="role-card"
            style={{
              padding: '28px',
              borderRadius: '16px',
              border: isDarkMode ? '1px solid #262626' : '1px solid #e2e8f0',
            }}
          >
            <span className="eyebrow" style={{ marginBottom: '12px', display: 'inline-block' }}>
              Tenant Console
            </span>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: isDarkMode ? '#ffffff' : '#0f172a',
                margin: '0 0 8px 0',
              }}
            >
              Business Workspace
            </h3>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: isDarkMode ? '#a1a1aa' : '#64748b',
                lineHeight: '1.55',
              }}
            >
              Full operational controls for customer lists, automated chatbot journeys, broadcast
              campaigns, and billing.
            </p>
            <Link
              to="/signin"
              style={{
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Sign In to Workspace →
            </Link>
          </div>

          <div
            className="role-card"
            style={{
              padding: '28px',
              borderRadius: '16px',
              border: isDarkMode ? '1px solid #262626' : '1px solid #e2e8f0',
            }}
          >
            <span className="eyebrow" style={{ marginBottom: '12px', display: 'inline-block' }}>
              Staff Console
            </span>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: isDarkMode ? '#ffffff' : '#0f172a',
                margin: '0 0 8px 0',
              }}
            >
              Support Agent
            </h3>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: isDarkMode ? '#a1a1aa' : '#64748b',
                lineHeight: '1.55',
              }}
            >
              Dedicated, streamlined portal for responding to assigned WhatsApp, Instagram, and web
              visitors without administrative friction.
            </p>
            <Link
              to="/signin"
              style={{
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Agent Sign In →
            </Link>
          </div>
        </section>
      </main>

      {/* 9. Attio Footer */}
      <footer
        style={{
          borderTop: isDarkMode ? '1px solid #202020' : '1px solid #f1f5f9',
          marginTop: '48px',
          padding: '36px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '48px auto 0',
          color: isDarkMode ? '#71717a' : '#64748b',
          fontSize: '13px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={isDarkMode ? '/favicon-dark.svg' : '/favicon-light.svg'}
            alt="OMNI CRM"
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontWeight: '600', color: isDarkMode ? '#ffffff' : '#0f172a' }}>
            OMNI CRM
          </span>
          <span>• The platform for agentic revenue</span>
        </div>
        <div style={{ display: 'flex', gap: '18px' }}>
          <Link to="/signin" style={{ color: 'inherit', textDecoration: 'none' }}>
            Portals
          </Link>
          <Link to="/admin/login" style={{ color: 'inherit', textDecoration: 'none' }}>
            Admin Console
          </Link>
          <span>© {new Date().getFullYear()} OMNI CRM</span>
        </div>
      </footer>
    </div>
  );
}

export default PublicSite;
