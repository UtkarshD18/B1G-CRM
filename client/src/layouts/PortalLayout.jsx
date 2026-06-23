import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../shared/auth'
import { classNames } from '../shared/format'

function PortalLayout({ role, title, navItems }) {
  const { tokens, clearRoleToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')

  let agentPermissions = []
  if (role === 'agent' && tokens.agent) {
    try {
      const payload = JSON.parse(atob(tokens.agent.split('.')[1]))
      agentPermissions = payload.permissions || []
    } catch (e) {
      console.error("Failed to decode token", e)
    }
  }

  const permissionNavMappings = [
    { key: 'inbox_access', label: 'Assigned Chats', path: '/agent/chats', icon: '📥' },
    { key: 'contacts_access', label: 'Contacts', path: '/agent/contacts', icon: '👥' },
    { key: 'kanban_access', label: 'Kanban', path: '/agent/kanban', icon: '📋' },
    { key: 'leads_access', label: 'Lead Pipeline', path: '/agent/pipeline', icon: '📈' },
    { key: 'campaigns_access', label: 'Campaigns', path: '/agent/campaigns', icon: '📣' },
    { key: 'flows_access', label: 'Automation Flows', path: '/agent/automation-flows', icon: '⚡' },
    { key: 'chatbot_access', label: 'ChatBot', path: '/agent/chatbot', icon: '🤖' },
    { key: 'knowledgebase_access', label: 'Knowledge Base', path: '/agent/knowledge-base', icon: '📚' },
    { key: 'website_access', label: 'Websites Manager', path: '/agent/website-manager', icon: '🌐' },
    { key: 'reports_access', label: 'Supervisor Dashboard', path: '/agent/supervisor-dashboard', icon: '👁️' },
    { key: 'billing_access', label: 'Billing', path: '/agent/billing', icon: '💳' },
    { key: 'api_access', label: 'API & Webhooks', path: '/agent/api-dashboard', icon: '🔌' },
    { key: 'settings_access', label: 'Settings', path: '/agent/settings', icon: '⚙️' }
  ]

  const activeNavItems = role === 'agent'
    ? [
        { label: 'Workspace', path: '/agent/dashboard', icon: '📊' },
        ...permissionNavMappings.filter(item => agentPermissions.includes(item.key))
      ]
    : navItems

  function signOut() {
    clearRoleToken(role)
    navigate(`/${role}/login`, { replace: true })
  }

  const filteredItems = activeNavItems.filter((item) => {
    if (item.section) return true
    if (!searchQuery) return true
    return item.label.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Remove orphaned section headers (sections with no visible items after them)
  const cleanedItems = filteredItems.filter((item, index) => {
    if (!item.section) return true
    const nextItems = filteredItems.slice(index + 1)
    const nextSectionIndex = nextItems.findIndex((i) => i.section)
    const itemsAfter = nextSectionIndex === -1 ? nextItems : nextItems.slice(0, nextSectionIndex)
    return itemsAfter.some((i) => !i.section)
  })

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">W</span>
          </div>
          <span className="sidebar-brand-name">whatsCRM</span>
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
              )
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
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="secondary-button sidebar-signout" type="button" onClick={signOut}>
            Sign out
          </button>
          <span className="sidebar-version">whatsCRM <span className="version-badge">5.9.5</span></span>
        </div>
      </aside>
      <section className="portal-main">
        <div className="portal-topbar">
          <div className="topbar-breadcrumb">
            <span className="topbar-home">🏠</span>
            <span className="topbar-separator">›</span>
            <span className="topbar-page">{location.pathname.split('/').pop().replace(/-/g, '-')}</span>
          </div>
          <div className="topbar-actions">
            <span className="topbar-lang">🌐 English</span>
          </div>
        </div>
        <Outlet />
      </section>
    </div>
  )
}

export default PortalLayout
