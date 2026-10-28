import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../shared/auth';
import { classNames } from '../shared/format';
import { useTheme } from '../shared/theme';
import { FiHome, FiMenu, FiSidebar, FiChevronRight } from 'react-icons/fi';
import './PortalLayout.css';
import '../shared/assignment-badges.css';

function PortalLayout({ role, title, navItems }) {
  const { tokens, clearRoleToken } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [liveAgentPermissions, setLiveAgentPermissions] = useState(null);
  useEffect(() => {
    setLiveAgentPermissions(null);
    const update = (event) => setLiveAgentPermissions(event.detail);
    if (role === 'agent') window.addEventListener('omnicrm-agent-permissions', update);
    return () => window.removeEventListener('omnicrm-agent-permissions', update);
  }, [role, tokens.agent]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMotion, setSidebarMotion] = useState(true);

  function toggleSidebar(event) {
    setSidebarMotion(event.detail !== 0);
    setSidebarCollapsed((collapsed) => !collapsed);
  }

  let agentPermissions = [];
  if (role === 'agent' && tokens.agent) {
    try {
      const payload = JSON.parse(atob(tokens.agent.split('.')[1]));
      agentPermissions = payload.permissions || [];
    } catch (e) {
      console.error('Failed to decode token', e);
    }
  }

  if (role === 'agent' && liveAgentPermissions) agentPermissions = liveAgentPermissions;

  const permissionNavMappings = [
    { key: 'inbox_access', label: 'Assigned Chats', path: '/agent/chats', icon: '📥' },
    { key: 'contacts_access', label: 'Contacts', path: '/agent/contacts', icon: '👥' },
    { key: 'kanban_access', label: 'Kanban', path: '/agent/kanban', icon: '📋' },
    { key: 'leads_access', label: 'Lead Pipeline', path: '/agent/pipeline', icon: '📈' },
    { key: 'campaigns_access', label: 'Campaigns', path: '/agent/campaigns', icon: '📣' },
    { key: 'flows_access', label: 'Automation Flows', path: '/agent/automation-flows', icon: '⚡' },
    { key: 'chatbot_access', label: 'ChatBot', path: '/agent/chatbot', icon: '🤖' },
    {
      key: 'knowledgebase_access',
      label: 'Knowledge Base',
      path: '/agent/knowledge-base',
      icon: '📚',
    },
    {
      key: 'website_access',
      label: 'Websites Manager',
      path: '/agent/website-manager',
      icon: '🌐',
    },
    {
      key: 'reports_access',
      label: 'Supervisor Dashboard',
      path: '/agent/supervisor-dashboard',
      icon: '👁️',
    },
    { key: 'billing_access', label: 'Billing', path: '/agent/billing', icon: '💳' },
    { key: 'api_access', label: 'API & Webhooks', path: '/agent/api-dashboard', icon: '🔌' },
    { key: 'settings_access', label: 'Settings', path: '/agent/settings', icon: '⚙️' },
  ];

  const legacyToModernMap = {
    inbox_access: ['inbox.read', 'inbox.reply'],
    contacts_access: ['contacts.read', 'contacts.write'],
    kanban_access: ['inbox.read'],
    leads_access: ['contacts.read'],
    campaigns_access: ['inbox.read'],
    flows_access: ['automation.read', 'automation.edit', 'automation.publish'],
    chatbot_access: ['automation.read'],
    knowledgebase_access: ['kb.read', 'kb.write', 'kb.delete', 'kb.reindex'],
    website_access: ['settings.users'],
    settings_access: ['settings.users'],
  };

  const activeNavItems =
    role === 'agent'
      ? [
          { label: 'Workspace', path: '/agent/dashboard', icon: '📊' },
          ...permissionNavMappings.filter((item) => {
            if (agentPermissions.includes(item.key)) return true;
            const equivalents = legacyToModernMap[item.key] || [];
            return equivalents.some((eq) => agentPermissions.includes(eq));
          }),
        ]
      : navItems;

  function signOut() {
    clearRoleToken(role);
    navigate(`/${role}/login`, { replace: true });
  }

  const filteredItems = activeNavItems.filter((item) => {
    if (item.section) return true;
    if (!searchQuery) return true;
    return item.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Remove orphaned section headers (sections with no visible items after them)
  const cleanedItems = filteredItems.filter((item, index) => {
    if (!item.section) return true;
    const nextItems = filteredItems.slice(index + 1);
    const nextSectionIndex = nextItems.findIndex((i) => i.section);
    const itemsAfter = nextSectionIndex === -1 ? nextItems : nextItems.slice(0, nextSectionIndex);
    return itemsAfter.some((i) => !i.section);
  });

  return (
    <div
      className={classNames(
        'portal-shell',
        'portal-navigation-shell',
        sidebarCollapsed ? 'is-sidebar-collapsed' : '',
        !sidebarMotion ? 'sidebar-instant' : '',
        /\/(inbox|chats)\/?$/.test(location.pathname) ? 'portal-inbox-shell' : '',
      )}
    >
      <aside
        className="portal-sidebar"
        id="portal-navigation"
        aria-label="Main navigation"
        aria-hidden={sidebarCollapsed}
        inert={sidebarCollapsed}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img
              src={isDarkMode ? '/favicon-dark.svg' : '/favicon-light.svg'}
              alt="OMNI CRM Logo"
              className="sidebar-logo-img"
            />
          </div>
          <span className="sidebar-brand-name">OMNI CRM</span>
        </div>
        {role === 'admin' && (
          <div className="sidebar-search">
            <span className="sidebar-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        <nav className="sidebar-nav">
          {cleanedItems.map((item, index) => {
            if (item.section) {
              return (
                <div className="sidebar-section" key={`section-${index}`}>
                  {item.section}
                </div>
              );
            }
            return (
              <Link
                className={classNames(
                  'sidebar-link',
                  location.pathname === item.path ? 'active' : '',
                )}
                key={item.path}
                to={item.path}
              >
                {item.icon && <span className="sidebar-link-icon">{item.icon}</span>}
                <span className="sidebar-link-label">{item.label}</span>
                {item.badge && <span className="sidebar-link-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="secondary-button sidebar-signout" type="button" onClick={signOut}>
            Sign out
          </button>
          <span className="sidebar-version">
            OMNI CRM <span className="version-badge">5.9.5</span>
          </span>
        </div>
      </aside>
      <section className="portal-main">
        <div className="portal-topbar">
          <div className="portal-navigation-controls">
            <button
              type="button"
              className="portal-sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Show navigation menu' : 'Hide navigation menu'}
              title={sidebarCollapsed ? 'Show navigation menu' : 'Hide navigation menu'}
              aria-expanded={!sidebarCollapsed}
              aria-controls="portal-navigation"
            >
              {sidebarCollapsed ? <FiMenu aria-hidden="true" /> : <FiSidebar aria-hidden="true" />}
            </button>
            <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
              <Link
                className="topbar-home"
                to={`/${role}/dashboard`}
                aria-label="Go to dashboard"
                title="Go to dashboard"
              >
                <FiHome aria-hidden="true" />
              </Link>
              <FiChevronRight className="topbar-separator" aria-hidden="true" />
              <span className="topbar-page" aria-current="page">
                {location.pathname.split('/').pop().replace(/-/g, ' ')}
              </span>
            </nav>
          </div>
          <div className="topbar-actions">
            <button
              id="portal-theme-toggle-btn"
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
            <span className="topbar-lang">🌐 English</span>
          </div>
        </div>
        <Outlet />
      </section>
    </div>
  );
}

export default PortalLayout;
