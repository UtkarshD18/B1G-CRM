import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../shared/auth'
import { classNames } from '../shared/format'
import { apiRequest } from '../shared/api'

function PortalLayout({ role, title, navItems }) {
  const { clearRoleToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isRtl, setIsRtl] = useState(false)
  const dropdownRef = useRef(null)

  const [defaultLang, setDefaultLang] = useState(localStorage.getItem('b1gcrm-default-lang') || 'English')
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langRef = useRef(null)
  const [langsList, setLangsList] = useState(['English', 'German', 'Hebrew', 'Hindi', 'Italian', 'Spanish', 'Swahili', 'Turkish'])

  // Load language list dynamically from backend
  useEffect(() => {
    async function loadLangs() {
      try {
        const res = await apiRequest('/api/web/get-all-translation-name')
        if (res?.success && Array.isArray(res.data)) {
          const cleanNames = res.data.map(name => name.replace('.json', ''))
          setLangsList(cleanNames)
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadLangs()
    window.addEventListener('local-lang-change', loadLangs)
    return () => {
      window.removeEventListener('local-lang-change', loadLangs)
    }
  }, [])

  // Sync defaultLang on storage/custom event changes
  useEffect(() => {
    function handleStorageChange() {
      setDefaultLang(localStorage.getItem('b1gcrm-default-lang') || 'English')
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('local-lang-change', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('local-lang-change', handleStorageChange)
    }
  }, [])

  function changeLanguage(langCode) {
    localStorage.setItem('b1gcrm-default-lang', langCode)
    window.dispatchEvent(new Event('local-lang-change'))
    setLangMenuOpen(false)
  }

  function signOut() {
    clearRoleToken(role)
    navigate(`/${role}/login`, { replace: true })
  }

  const filteredItems = navItems.filter((item) => {
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

  function toggleDarkMode() {
    const next = !isDarkMode
    setIsDarkMode(next)
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleRtl() {
    const next = !isRtl
    setIsRtl(next)
    if (next) {
      document.documentElement.setAttribute('dir', 'rtl')
    } else {
      document.documentElement.setAttribute('dir', 'ltr')
    }
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const avatarChar = role === 'admin' ? 'A' : role === 'agent' ? 'G' : 'U'
  const profilePath = role === 'admin' ? '/admin/site-settings' : role === 'user' ? '/user/settings' : '#'

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">W</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="sidebar-brand-name">whatsCRM</span>
            <span style={{ fontSize: '11px', opacity: 0.6, marginTop: '-2px' }}>v5.9.5</span>
          </div>
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
        <div className="sidebar-footer" style={{ justifyContent: 'center', padding: '12px' }}>
          <span className="sidebar-version" style={{ fontSize: '12px', opacity: 0.8 }}>whatsCRM 5.9.5</span>
        </div>
      </aside>
      <section className="portal-main">
        <div className="portal-topbar">
          <div className="topbar-breadcrumb">
            <span className="topbar-home">🏠</span>
            <span className="topbar-separator">›</span>
            <span className="topbar-page" style={{ textTransform: 'capitalize' }}>
              {location.pathname.split('/').pop().replace(/-/g, ' ')}
            </span>
          </div>
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                className="topbar-lang"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                style={{ cursor: 'pointer', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🌐 {defaultLang}
              </button>
              {langMenuOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '44px',
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '130px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px 0',
                  maxHeight: '240px',
                  overflowY: 'auto'
                }}>
                  {langsList.map(l => (
                    <button
                      key={l}
                      onClick={() => changeLanguage(l)}
                      style={{
                        padding: '8px 16px',
                        background: 'none',
                        border: 'none',
                        color: defaultLang === l ? '#1ea085' : '#333',
                        fontWeight: defaultLang === l ? 'bold' : 'normal',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        display: 'block'
                      }}
                      className="dropdown-item-hover"
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={toggleRtl}
              aria-label="Switch to RTL"
              title="Switch to RTL"
              style={{ cursor: 'pointer', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              🔄
            </button>
            <button
              onClick={toggleDarkMode}
              aria-label="Dark Mode"
              title="Toggle Dark Mode"
              style={{ cursor: 'pointer', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              🌙
            </button>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  cursor: 'pointer',
                  background: '#1ea085',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {avatarChar}
              </button>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '44px',
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '150px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px 0'
                }}>
                  {profilePath !== '#' && (
                    <Link
                      to={profilePath}
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        padding: '8px 16px',
                        textDecoration: 'none',
                        color: '#333',
                        fontSize: '14px',
                        textAlign: 'left'
                      }}
                      className="dropdown-item-hover"
                    >
                      ⚙️ Settings
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      signOut()
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'none',
                      border: 'none',
                      color: '#e53e3e',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    className="dropdown-item-hover"
                  >
                    🚪 Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <Outlet />
      </section>
    </div>
  )
}

export default PortalLayout

