import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../shared/auth'
import { classNames } from '../shared/format'

function PortalLayout({ role, title, navItems }) {
  const { clearRoleToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function signOut() {
    clearRoleToken(role)
    navigate(`/${role}/login`, { replace: true })
  }

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div>
          <span className="eyebrow">b1gcrm</span>
          <h1>{title}</h1>
          <p className="sidebar-copy">Built from the verified live portal model, not a placeholder mock.</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              className={classNames(
                'sidebar-link',
                location.pathname === item.path ? 'active' : '',
              )}
              key={item.path}
              to={item.path}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="secondary-button sidebar-signout" type="button" onClick={signOut}>
          Sign out
        </button>
      </aside>
      <section className="portal-main">
        <Outlet />
      </section>
    </div>
  )
}

export default PortalLayout
