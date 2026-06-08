import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { io } from 'socket.io-client'
import './App.css'

const API_BASE =
  typeof window !== 'undefined' && typeof window.__B1GCRM_API_URL__ === 'string'
    ? window.__B1GCRM_API_URL__.replace(/\/$/, '')
    : ''
const STORAGE_KEY = 'b1gcrm-auth'

const PUBLIC_FEATURES = [
  'AI voice calling and task-aware follow-up flows',
  'Smart inbox for WhatsApp, Instagram, and website chat',
  'Automation flows, chatbots, and webhook-triggered journeys',
  'Campaigns, phonebook segmentation, and agent handoff controls',
]

const USER_MODULES = [
  'Inbox',
  'Automation Flows',
  'Send Campaign',
  'Phonebook',
  'Agent Login',
  'Agent Task',
  'Chat Widget',
  'Manage Webhooks',
]

const ADMIN_MODULES = [
  'Manage Plans',
  'Manage Users',
  'Orders',
  'Payment Gateways',
  'SMTP',
  'Site Settings',
]

const AGENT_MODULES = ['Assigned chats', 'Task queue', 'Restricted visibility']

const DEFAULT_PLANS = [
  {
    id: 'trial',
    title: 'Trial',
    short_description: '10-day evaluation for onboarding teams',
    plan_duration_in_days: 10,
    price: 0,
    is_trial: 1,
  },
  {
    id: 'premium',
    title: 'Premium',
    short_description: 'Core inbox, automation, and campaign workspace',
    plan_duration_in_days: 365,
    price: 149,
  },
  {
    id: 'platinum',
    title: 'Platinum',
    short_description: 'Broader automation, API, and scaling controls',
    plan_duration_in_days: 365,
    price: 299,
  },
]

const AuthContext = createContext(null)

const ADMIN_NAV = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Manage Plans', path: '/admin/manage-plans' },
  { label: 'Manage Users', path: '/admin/manage-users' },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Settings', path: '/admin/settings' },
]

const USER_NAV = [
  { label: 'Dashboard', path: '/user/dashboard' },
  { label: 'Inbox', path: '/user/inbox' },
  { label: 'Contacts', path: '/user/contacts' },
  { label: 'Campaigns', path: '/user/campaigns' },
  { label: 'Automation Flows', path: '/user/automation-flows' },
  { label: 'ChatBot', path: '/user/chatbot' },
  { label: 'Integrations', path: '/user/integrations' },
  { label: 'Agent Login', path: '/user/agent-login' },
  { label: 'Agent Task', path: '/user/agent-task' },
  { label: 'Chat Widget', path: '/user/chat-widget' },
  { label: 'Settings', path: '/user/settings' },
]

const AGENT_NAV = [
  { label: 'Workspace', path: '/agent/dashboard' },
  { label: 'Assigned Chats', path: '/agent/chats' },
]

function loadStoredAuth() {
  if (typeof window === 'undefined') {
    return { admin: '', user: '', agent: '' }
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      admin: parsed.admin || '',
      user: parsed.user || '',
      agent: parsed.agent || '',
    }
  } catch {
    return { admin: '', user: '', agent: '' }
  }
}

function saveStoredAuth(next) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const headers = {}

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  return response.json()
}

async function apiFormRequest(path, { token, formData } = {}) {
  const headers = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  return response.json()
}

function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}

function formatMoney(value) {
  if (!value) {
    return 'Free'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatMonthSeries(series) {
  if (!Array.isArray(series)) {
    return []
  }

  return series
    .map((entry, index) => ({
      label: entry?.month || `M${index + 1}`,
      value: Number(entry?.count || entry?.value || 0),
    }))
    .slice(-6)
}

function decodeTokenPayload(token) {
  if (!token) {
    return null
  }

  try {
    const [, payload] = token.split('.')
    return JSON.parse(window.atob(payload))
  } catch {
    return null
  }
}

function createFlowId() {
  return globalThis.crypto?.randomUUID?.() || `flow-${Date.now()}`
}

function prettyJson(value) {
  return JSON.stringify(value, null, 2)
}

function parseJsonField(value, label) {
  try {
    const parsed = JSON.parse(value)
    return { success: true, data: parsed }
  } catch {
    return { success: false, error: `${label} must be valid JSON.` }
  }
}

function normalizeConversationMessage(message) {
  if (message?.type === 'text') {
    return message?.msgContext?.text?.body || ''
  }

  if (message?.type === 'image') {
    return message?.msgContext?.image?.caption || 'Image'
  }

  if (message?.type === 'video') {
    return message?.msgContext?.video?.caption || 'Video'
  }

  if (message?.type === 'document') {
    return message?.msgContext?.document?.caption || 'Document'
  }

  if (message?.type === 'audio') {
    return 'Audio'
  }

  return message?.type || 'Message'
}

function formatRelativeTimestamp(value) {
  if (!value) {
    return 'N/A'
  }

  const timestamp = Number(value)
  if (!Number.isFinite(timestamp)) {
    return String(value)
  }

  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(loadStoredAuth)

  const value = useMemo(
    () => ({
      tokens,
      setRoleToken(role, token) {
        const next = { ...tokens, [role]: token }
        setTokens(next)
        saveStoredAuth(next)
      },
      clearRoleToken(role) {
        const next = { ...tokens, [role]: '' }
        setTokens(next)
        saveStoredAuth(next)
      },
    }),
    [tokens],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('Auth context unavailable')
  }
  return ctx
}

function RoleGate({ role, children }) {
  const { tokens } = useAuth()
  const location = useLocation()

  if (!tokens[role]) {
    return <Navigate to={`/${role}/login`} replace state={{ from: location.pathname }} />
  }

  return children
}

function LoginPage({ role, title, subtitle, endpoint, allowSignup = false }) {
  const { setRoleToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const incomingToken = searchParams.get('token')
    if (!incomingToken) {
      return
    }

    setRoleToken(role, incomingToken)
    setSearchParams({}, { replace: true })
    navigate(`/${role}/dashboard`, { replace: true })
  }, [navigate, role, searchParams, setRoleToken, setSearchParams])

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: { email, password },
      })

      if (!result?.success || !result?.token) {
        setStatus(result?.msg || 'Login failed')
        return
      }

      setRoleToken(role, result.token)
      navigate(`/${role}/dashboard`, { replace: true })
    } catch (error) {
      setStatus(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="auth-copy">
          <span className="eyebrow">{role} portal</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {status ? <p className="status-line">{status}</p> : null}
          <div className="auth-links">
            <Link to="/signin">Back to portal chooser</Link>
            {allowSignup ? <Link to="/user/signup">Create tenant account</Link> : null}
          </div>
        </form>
      </div>
    </div>
  )
}

function UnifiedLoginPage() {
  const [role, setRole] = useState('user')
  const loginConfig = {
    admin: {
      title: 'Admin Sign In',
      subtitle: 'Global SaaS operations for plans, tenants, orders, payments, and site configuration.',
      endpoint: '/api/admin/login',
    },
    user: {
      title: 'User Sign In',
      subtitle: 'Tenant workspace for inbox, automation, campaigns, contacts, and agent management.',
      endpoint: '/api/user/login',
      allowSignup: true,
    },
    agent: {
      title: 'Agent Sign In',
      subtitle: 'Restricted portal for assigned chats and tasks.',
      endpoint: '/api/agent/login',
    },
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="role-toggle">
          {Object.keys(loginConfig).map((nextRole) => (
            <button
              className={classNames(role === nextRole ? 'active' : '')}
              key={nextRole}
              type="button"
              onClick={() => setRole(nextRole)}
            >
              {nextRole}
            </button>
          ))}
        </div>
        <LoginPage role={role} {...loginConfig[role]} />
      </div>
    </div>
  )
}

function UserSignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mobile_with_country_code: '',
    acceptPolicy: true,
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const result = await apiRequest('/api/user/signup', {
        method: 'POST',
        body: form,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Signup failed')
        return
      }

      navigate('/user/login', { replace: true })
    } catch (error) {
      setStatus(error.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="auth-copy">
          <span className="eyebrow">tenant onboarding</span>
          <h1>Create a CRM workspace</h1>
          <p>Match the live pre-purchase funnel with a real signup path instead of a dead shell.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Amina Yusuf"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="owner@company.com"
            />
          </label>
          <label>
            Mobile with country code
            <input
              value={form.mobile_with_country_code}
              onChange={(event) =>
                setForm({ ...form, mobile_with_country_code: event.target.value })
              }
              placeholder="+1 202 555 0184"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Create password"
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.acceptPolicy}
              onChange={(event) => setForm({ ...form, acceptPolicy: event.target.checked })}
            />
            <span>I accept the privacy policy and terms.</span>
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Start workspace'}
          </button>
          {status ? <p className="status-line">{status}</p> : null}
          <div className="auth-links">
            <Link to="/user/login">Already have a tenant account?</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

function PublicSite() {
  const [plans, setPlans] = useState(DEFAULT_PLANS)

  useEffect(() => {
    let active = true

    async function loadPlans() {
      try {
        const result = await apiRequest('/api/admin/get_plans')
        if (active && Array.isArray(result?.data) && result.data.length > 0) {
          setPlans(result.data)
        }
      } catch {
        // Keep fallback marketing content when the API is unavailable.
      }
    }

    loadPlans()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="public-page">
      <header className="public-header">
        <Link className="brand" to="/">
          B1GCRM
        </Link>
        <nav>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#roles">Portals</a>
          <Link to="/signin">Sign in</Link>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">multi-portal saas crm</span>
            <h1>Public site, tenant workspace, staff portal, and admin controls in one product.</h1>
            <p>
              The live reference app is not a single dashboard. It is a complete SaaS flow with
              pricing, checkout intent, tenant automation, and agent handoff.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" to="/user/signup">
                Start free trial
              </Link>
              <Link className="secondary-button" to="/signin">
                Explore portals
              </Link>
            </div>
          </div>
          <div className="hero-panel">
            <h2>Confirmed live model</h2>
            <ul className="signal-list">
              <li>Admin portal manages plans, users, orders, settings, and CMS.</li>
              <li>User portal runs inbox, flows, campaigns, phonebook, and agents.</li>
              <li>Agent portal stays constrained to assigned chats and tasks.</li>
            </ul>
          </div>
        </section>

        <section className="feature-grid-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">feature positioning</span>
            <h2>Modules confirmed in the live product</h2>
          </div>
          <div className="feature-grid">
            {PUBLIC_FEATURES.map((feature) => (
              <article className="feature-card" key={feature}>
                <h3>{feature}</h3>
                <p>Aligned to the parity audit so frontend work follows the real product, not guesses.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pricing-section" id="pricing">
          <div className="section-heading">
            <span className="eyebrow">pricing and plans</span>
            <h2>Marketing and pre-purchase flow now have a real surface locally.</h2>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article className="pricing-card" key={plan.id || plan.title}>
                <p className="plan-name">{plan.title}</p>
                <div className="plan-price">{formatMoney(Number(plan.price || 0))}</div>
                <p className="plan-period">{plan.plan_duration_in_days}-day access window</p>
                <p>{plan.short_description || 'Plan details will be expanded from the admin portal.'}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="roles-section" id="roles">
          <div className="role-card">
            <span className="eyebrow">admin</span>
            <h3>Global SaaS owner portal</h3>
            <ul className="signal-list">
              {ADMIN_MODULES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="role-card">
            <span className="eyebrow">user</span>
            <h3>Tenant operations workspace</h3>
            <ul className="signal-list">
              {USER_MODULES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="role-card">
            <span className="eyebrow">agent</span>
            <h3>Restricted staff workspace</h3>
            <ul className="signal-list">
              {AGENT_MODULES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

function PortalChooser() {
  return (
    <div className="chooser-page">
      <div className="section-heading">
        <span className="eyebrow">portal entry</span>
        <h1>Choose the workspace you need.</h1>
      </div>
      <div className="chooser-grid">
        <Link className="chooser-card" to="/admin/login">
          <h2>Admin</h2>
          <p>Pricing, users, orders, SMTP, payments, and CMS operations.</p>
        </Link>
        <Link className="chooser-card" to="/user/login">
          <h2>User</h2>
          <p>Tenant workspace for inbox, automation, campaigns, contacts, and agents.</p>
        </Link>
        <Link className="chooser-card" to="/agent/login">
          <h2>Agent</h2>
          <p>Assigned chats and task handling with restricted access.</p>
        </Link>
      </div>
    </div>
  )
}

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

function DashboardCard({ title, value, detail }) {
  return (
    <article className="dashboard-card">
      <p className="dashboard-label">{title}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  )
}

function DashboardSeries({ title, data }) {
  return (
    <article className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="bar-series">
        {data.length ? (
          data.map((item) => (
            <div className="bar-row" key={`${title}-${item.label}`}>
              <span>{item.label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.max(item.value * 8, 8)}px` }} />
              </div>
              <strong>{item.value}</strong>
            </div>
          ))
        ) : (
          <p className="empty-state">No chart data yet.</p>
        )}
      </div>
    </article>
  )
}

function AdminDashboardPage() {
  const { tokens } = useAuth()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('Loading dashboard...')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const result = await apiRequest('/api/admin/get_dashboard_for_user', {
          token: tokens.admin,
        })

        if (!active) {
          return
        }

        if (!result?.success) {
          setStatus(result?.msg || 'Unable to load admin dashboard')
          return
        }

        setData(result.data)
        setStatus('')
      } catch (error) {
        if (active) {
          setStatus(error.message || 'Unable to load admin dashboard')
        }
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [tokens.admin])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">admin dashboard</span>
          <h2>Operational SaaS overview</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="dashboard-grid">
        <DashboardCard title="Tenants" value={data?.userLength ?? '-'} detail="Total user accounts" />
        <DashboardCard title="Orders" value={data?.orderLength ?? '-'} detail="Transactions recorded" />
        <DashboardCard
          title="Contact Leads"
          value={data?.contactLength ?? '-'}
          detail="Public site inquiries"
        />
      </div>
      <div className="two-column-grid">
        <DashboardSeries title="Paid signups" data={formatMonthSeries(data?.paid)} />
        <DashboardSeries title="Orders by month" data={formatMonthSeries(data?.orders)} />
      </div>
    </div>
  )
}

function AdminPlansPage() {
  const { tokens } = useAuth()
  const [plans, setPlans] = useState([])
  const [status, setStatus] = useState('Loading plans...')

  useEffect(() => {
    let active = true

    async function loadPlans() {
      try {
        const result = await apiRequest('/api/admin/get_plans', { token: tokens.admin })
        if (!active) {
          return
        }
        setPlans(Array.isArray(result?.data) ? result.data : [])
        setStatus('')
      } catch (error) {
        if (active) {
          setStatus(error.message || 'Unable to load plans')
        }
      }
    }

    loadPlans()
    return () => {
      active = false
    }
  }, [tokens.admin])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">manage plans</span>
          <h2>Pricing and entitlement surface</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="pricing-grid">
        {plans.map((plan) => (
          <article className="pricing-card" key={plan.id}>
            <p className="plan-name">{plan.title}</p>
            <div className="plan-price">{formatMoney(Number(plan.price || 0))}</div>
            <p className="plan-period">{plan.plan_duration_in_days} days</p>
            <p>{plan.short_description}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function AdminUsersPage() {
  const { tokens } = useAuth()
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('Loading users...')
  const [autoLoginStatus, setAutoLoginStatus] = useState('')

  useEffect(() => {
    let active = true

    async function loadUsers() {
      try {
        const result = await apiRequest('/api/admin/get_users', { token: tokens.admin })
        if (!active) {
          return
        }
        setUsers(Array.isArray(result?.data) ? result.data : [])
        setStatus('')
      } catch (error) {
        if (active) {
          setStatus(error.message || 'Unable to load users')
        }
      }
    }

    loadUsers()
    return () => {
      active = false
    }
  }, [tokens.admin])

  async function handleAutoLogin(uid) {
    setAutoLoginStatus('Creating tenant auto-login token...')
    try {
      const result = await apiRequest('/api/admin/auto_login', {
        method: 'POST',
        token: tokens.admin,
        body: { uid },
      })

      if (!result?.success || !result?.token) {
        setAutoLoginStatus(result?.msg || 'Unable to create auto-login token')
        return
      }

      window.open(`/user/login?token=${encodeURIComponent(result.token)}`, '_blank', 'noopener')
      setAutoLoginStatus('Tenant auto-login tab opened.')
    } catch (error) {
      setAutoLoginStatus(error.message || 'Unable to create auto-login token')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">manage users</span>
          <h2>Tenant roster with impersonation handoff</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      {autoLoginStatus ? <p className="status-line">{autoLoginStatus}</p> : null}
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Expiry</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.plan || 'Unassigned'}</td>
                <td>{user.plan_expire || 'N/A'}</td>
                <td>
                  <button className="mini-button" type="button" onClick={() => handleAutoLogin(user.uid)}>
                    Auto login
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminOrdersPage() {
  const { tokens } = useAuth()
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('Loading orders...')

  useEffect(() => {
    let active = true

    async function loadOrders() {
      try {
        const result = await apiRequest('/api/admin/get_orders', { token: tokens.admin })
        if (!active) {
          return
        }
        setOrders(Array.isArray(result?.data) ? result.data : [])
        setStatus('')
      } catch (error) {
        if (active) {
          setStatus(error.message || 'Unable to load orders')
        }
      }
    }

    loadOrders()
    return () => {
      active = false
    }
  }, [tokens.admin])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">orders</span>
          <h2>Recent transactions</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.name || order.email || order.uid}</td>
                <td>{formatMoney(Number(order.amount || 0))}</td>
                <td>{order.payment_mode || 'Unknown'}</td>
                <td>{order.orderCreatedAt || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminSettingsPage() {
  return (
    <PlaceholderModule
      eyebrow="admin settings"
      title="SaaS configuration checklist"
      description="demo-live exposes a dedicated settings area. The current backend already stores payment, SMTP, branding, pages, and social-login settings through admin routes."
      bullets={[
        'Payment gateway settings are available through existing admin payment routes.',
        'SMTP and email recovery settings are available through existing admin SMTP routes.',
        'Branding, RTL, public web configuration, pages, FAQs, partners, and testimonials are existing backend modules.',
        'Next step for production polish: split these backend capabilities into focused settings forms.',
      ]}
    />
  )
}

function UserDashboardPage() {
  const { tokens } = useAuth()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('Loading dashboard...')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const result = await apiRequest('/api/user/get_dashboard', { token: tokens.user })
        if (!active) {
          return
        }
        if (!result?.success) {
          setStatus(result?.msg || 'Unable to load user dashboard')
          return
        }
        setData(result)
        setStatus('')
      } catch (error) {
        if (active) {
          setStatus(error.message || 'Unable to load user dashboard')
        }
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [tokens.user])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">user dashboard</span>
          <h2>Tenant operations snapshot</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="dashboard-grid">
        <DashboardCard title="Chats" value={data?.totalChats ?? '-'} detail="Inbox volume" />
        <DashboardCard title="Chatbots" value={data?.totalChatbots ?? '-'} detail="Configured bots" />
        <DashboardCard title="Contacts" value={data?.totalContacts ?? '-'} detail="Phonebook size" />
        <DashboardCard title="Flows" value={data?.totalFlows ?? '-'} detail="Automation definitions" />
      </div>
      <div className="two-column-grid">
        <DashboardSeries title="Open chats" data={formatMonthSeries(data?.opened)} />
        <DashboardSeries title="Resolved chats" data={formatMonthSeries(data?.resolved)} />
      </div>
    </div>
  )
}

function UserContactsPage() {
  const { tokens } = useAuth()
  const [phonebooks, setPhonebooks] = useState([])
  const [contacts, setContacts] = useState([])
  const [status, setStatus] = useState('Loading contacts...')
  const [selectedIds, setSelectedIds] = useState([])
  const [phonebookName, setPhonebookName] = useState('')
  const [csvFile, setCsvFile] = useState(null)
  const [contactForm, setContactForm] = useState({
    phonebookId: '',
    name: '',
    mobile: '',
    var1: '',
    var2: '',
    var3: '',
    var4: '',
    var5: '',
  })

  const loadContactsData = useCallback(async () => {
    setStatus('Loading contacts...')
    try {
      const [phonebookResult, contactResult] = await Promise.all([
        apiRequest('/api/phonebook/get_by_uid', { token: tokens.user }),
        apiRequest('/api/phonebook/get_uid_contacts', { token: tokens.user }),
      ])

      setPhonebooks(Array.isArray(phonebookResult?.data) ? phonebookResult.data : [])
      setContacts(Array.isArray(contactResult?.data) ? contactResult.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load contacts')
    }
  }, [tokens.user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadContactsData()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadContactsData])

  const selectedPhonebook = phonebooks.find(
    (phonebook) => String(phonebook.id) === String(contactForm.phonebookId),
  )

  async function createPhonebook(event) {
    event.preventDefault()
    setStatus('Creating phonebook...')

    try {
      const result = await apiRequest('/api/phonebook/add', {
        method: 'POST',
        token: tokens.user,
        body: { name: phonebookName },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create phonebook')
        return
      }

      setPhonebookName('')
      setStatus('Phonebook created.')
      loadContactsData()
    } catch (error) {
      setStatus(error.message || 'Unable to create phonebook')
    }
  }

  async function deletePhonebook(id) {
    setStatus('Deleting phonebook and its contacts...')

    try {
      const result = await apiRequest('/api/phonebook/del_phonebook', {
        method: 'POST',
        token: tokens.user,
        body: { id },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete phonebook')
        return
      }

      setStatus('Phonebook deleted.')
      loadContactsData()
    } catch (error) {
      setStatus(error.message || 'Unable to delete phonebook')
    }
  }

  async function createContact(event) {
    event.preventDefault()

    if (!selectedPhonebook) {
      setStatus('Select a phonebook before adding a contact.')
      return
    }

    setStatus('Creating contact...')

    try {
      const result = await apiRequest('/api/phonebook/add_single_contact', {
        method: 'POST',
        token: tokens.user,
        body: {
          id: selectedPhonebook.id,
          phonebook_name: selectedPhonebook.name,
          mobile: contactForm.mobile,
          name: contactForm.name,
          var1: contactForm.var1,
          var2: contactForm.var2,
          var3: contactForm.var3,
          var4: contactForm.var4,
          var5: contactForm.var5,
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create contact')
        return
      }

      setContactForm({
        ...contactForm,
        name: '',
        mobile: '',
        var1: '',
        var2: '',
        var3: '',
        var4: '',
        var5: '',
      })
      setStatus('Contact created.')
      loadContactsData()
    } catch (error) {
      setStatus(error.message || 'Unable to create contact')
    }
  }

  async function importContacts(event) {
    event.preventDefault()

    if (!selectedPhonebook || !csvFile) {
      setStatus('Select a phonebook and CSV file before importing.')
      return
    }

    const formData = new FormData()
    formData.append('id', selectedPhonebook.id)
    formData.append('phonebook_name', selectedPhonebook.name)
    formData.append('file', csvFile)

    setStatus('Importing CSV contacts...')

    try {
      const result = await apiFormRequest('/api/phonebook/import_contacts', {
        token: tokens.user,
        formData,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to import contacts')
        return
      }

      setCsvFile(null)
      setStatus('Contacts imported.')
      loadContactsData()
    } catch (error) {
      setStatus(error.message || 'Unable to import contacts')
    }
  }

  async function deleteSelectedContacts() {
    if (!selectedIds.length) {
      setStatus('Select at least one contact to delete.')
      return
    }

    setStatus('Deleting selected contacts...')

    try {
      const result = await apiRequest('/api/phonebook/del_contacts', {
        method: 'POST',
        token: tokens.user,
        body: { selected: selectedIds },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete contacts')
        return
      }

      setSelectedIds([])
      setStatus('Contacts deleted.')
      loadContactsData()
    } catch (error) {
      setStatus(error.message || 'Unable to delete contacts')
    }
  }

  function toggleContact(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    )
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">contacts</span>
          <h2>Phonebooks and contact records</h2>
          <p>Core CRM database for segmentation, inbox context, and broadcast targeting.</p>
        </div>
        <button className="primary-button" type="button" onClick={loadContactsData}>
          Refresh
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="dashboard-grid">
        <DashboardCard title="Phonebooks" value={phonebooks.length} detail="Contact groups" />
        <DashboardCard title="Contacts" value={contacts.length} detail="Total records" />
        <DashboardCard title="Selected" value={selectedIds.length} detail="Bulk operation set" />
      </div>

      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={createPhonebook}>
          <div className="panel-header">
            <h2>Create phonebook</h2>
          </div>
          <label>
            Phonebook name
            <input
              value={phonebookName}
              onChange={(event) => setPhonebookName(event.target.value)}
              placeholder="Enterprise leads"
            />
          </label>
          <button className="primary-button" type="submit">
            Add phonebook
          </button>
        </form>

        <form className="panel form-panel" onSubmit={importContacts}>
          <div className="panel-header">
            <h2>Import CSV</h2>
          </div>
          <label>
            Target phonebook
            <select
              value={contactForm.phonebookId}
              onChange={(event) =>
                setContactForm({ ...contactForm, phonebookId: event.target.value })
              }
            >
              <option value="">Select phonebook</option>
              {phonebooks.map((phonebook) => (
                <option key={phonebook.id} value={phonebook.id}>
                  {phonebook.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            CSV file
            <input
              accept=".csv,text/csv"
              type="file"
              onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
            />
          </label>
          <p className="muted-copy">CSV columns: name, mobile, var1, var2, var3, var4, var5.</p>
          <button className="primary-button" type="submit">
            Import contacts
          </button>
        </form>
      </div>

      <form className="panel form-panel" onSubmit={createContact}>
        <div className="panel-header">
          <h2>Add single contact</h2>
        </div>
        <div className="form-grid">
          <label>
            Phonebook
            <select
              value={contactForm.phonebookId}
              onChange={(event) =>
                setContactForm({ ...contactForm, phonebookId: event.target.value })
              }
            >
              <option value="">Select phonebook</option>
              {phonebooks.map((phonebook) => (
                <option key={phonebook.id} value={phonebook.id}>
                  {phonebook.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input
              value={contactForm.name}
              onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
              placeholder="Aarav Mehta"
            />
          </label>
          <label>
            Mobile
            <input
              value={contactForm.mobile}
              onChange={(event) => setContactForm({ ...contactForm, mobile: event.target.value })}
              placeholder="+919999999999"
            />
          </label>
          {['var1', 'var2', 'var3', 'var4', 'var5'].map((field) => (
            <label key={field}>
              {field}
              <input
                value={contactForm[field]}
                onChange={(event) => setContactForm({ ...contactForm, [field]: event.target.value })}
                placeholder={`Optional ${field}`}
              />
            </label>
          ))}
        </div>
        <button className="primary-button" type="submit">
          Add contact
        </button>
      </form>

      <div className="two-column-grid">
        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Phonebooks</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {phonebooks.map((phonebook) => (
                <tr key={phonebook.id}>
                  <td>{phonebook.name}</td>
                  <td>{phonebook.id}</td>
                  <td>
                    <button
                      className="mini-button subtle-danger"
                      type="button"
                      onClick={() => deletePhonebook(phonebook.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Contacts</h2>
            <button className="mini-button subtle-danger" type="button" onClick={deleteSelectedContacts}>
              Delete selected
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th />
                <th>Name</th>
                <th>Mobile</th>
                <th>Phonebook</th>
                <th>Variables</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    <input
                      checked={selectedIds.includes(contact.id)}
                      type="checkbox"
                      onChange={() => toggleContact(contact.id)}
                    />
                  </td>
                  <td>{contact.name || 'N/A'}</td>
                  <td>{contact.mobile}</td>
                  <td>{contact.phonebook_name || contact.phonebook_id}</td>
                  <td>
                    {[contact.var1, contact.var2, contact.var3, contact.var4, contact.var5]
                      .filter(Boolean)
                      .join(', ') || 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UserCampaignsPage() {
  return (
    <PlaceholderModule
      eyebrow="campaigns"
      title="Broadcast campaign workspace"
      description="Broadcast creation, logs, status changes, and delivery updates are already represented in backend routes and the campaign loop."
      bullets={[
        'Create campaigns through /api/broadcast.',
        'Review campaign logs through /api/broadcast/get_broadcast_logs.',
        'Pause/resume/delete campaigns through broadcast status routes.',
        'Campaign processing runs from loops/campaignLoop.js.',
      ]}
    />
  )
}

function UserChatBotPage() {
  return (
    <PlaceholderModule
      eyebrow="chatbot"
      title="Chatbot and flow automation"
      description="demo-live separates ChatBot as a named module. In local main, this is backed by automation flows plus chatbot routes."
      bullets={[
        'Build and edit flows in Automation Flows.',
        'Create chatbot records through /api/chatbot.',
        'Flow runtime state is handled through flow_data and helper/chatbot modules.',
        'Recommended next step: add a visual bot list connected to /api/chatbot/get.',
      ]}
    />
  )
}

function UserIntegrationsPage() {
  return (
    <PlaceholderModule
      eyebrow="integrations"
      title="Meta, QR, API, and webhook integration points"
      description="The backend already includes Meta API settings, QR instances, generated API keys, webhook handling, and public API v1 routes."
      bullets={[
        'Meta WhatsApp credentials are managed by user routes.',
        'QR session instances are managed by /api/qr.',
        'Public API access is exposed through /api/v1.',
        'Webhook and inbox callbacks are handled under /api/inbox.',
      ]}
    />
  )
}

function UserSettingsPage() {
  return (
    <PlaceholderModule
      eyebrow="settings"
      title="Tenant profile and workspace settings"
      description="This named demo-live route groups user profile, plan, API key, widget, and integration settings into one navigation target."
      bullets={[
        'Profile data is available from /api/user/get_me.',
        'Plan and order flows are already implemented under /api/user.',
        'API keys can be created from existing user API key routes.',
        'Chat Widget remains available as a dedicated page.',
      ]}
    />
  )
}

function PlaceholderModule({ eyebrow, title, description, bullets }) {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="panel">
        <ul className="signal-list">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function UserInboxPage() {
  const { tokens } = useAuth()
  const socketRef = useRef(null)
  const decoded = decodeTokenPayload(tokens.user)
  const [chats, setChats] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [status, setStatus] = useState('Loading inbox...')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedChat, setSelectedChat] = useState(null)
  const [conversation, setConversation] = useState([])
  const [chatNote, setChatNote] = useState('')
  const [labelsAdded, setLabelsAdded] = useState([])
  const [agentData, setAgentData] = useState([])
  const [chatAssignAgent, setChatAssignAgent] = useState({})
  const [assignAgentUid, setAssignAgentUid] = useState('')
  const [messageDraft, setMessageDraft] = useState('')

  function openChat(chat) {
    if (!socketRef.current || !chat?.chat_id) {
      return
    }

    setStatus(`Opening ${chat.sender_name || chat.sender_mobile}...`)
    socketRef.current.emit('on_open_chat', {
      data: {
        chatId: chat.chat_id,
        limit: 200,
        chat,
      },
    })
  }

  const refreshChatList = useCallback((nextSearch = search, nextFilter = filterType) => {
    if (!socketRef.current) {
      return
    }

    socketRef.current.emit('get_chat_filter', {
      data: {
        search: nextSearch,
        filterType: nextFilter,
      },
    })
  }, [filterType, search])

  useEffect(() => {
    if (!decoded?.uid) {
      return undefined
    }

    const socket = io(API_BASE || window.location.origin, {
      query: {
        uid: decoded.uid,
        userToken: tokens.user,
      },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnectionStatus('Live')
      socket.emit('get_chat', { data: { limit: 40 } })
    })

    socket.on('disconnect', () => {
      setConnectionStatus('Disconnected')
    })

    socket.on('connection_ack', () => {
      setConnectionStatus('Live')
    })

    socket.on('get_chat', (data) => {
      setChats(Array.isArray(data) ? data : [])
      setStatus('')
    })

    socket.on('update_chat_list', (data) => {
      setChats(Array.isArray(data) ? data : [])
    })

    socket.on('on_open_chat', (payload) => {
      setConversation(Array.isArray(payload?.conversation) ? payload.conversation : [])
      setSelectedChat(payload?.chatinfo || null)
      setChatNote(payload?.chatnote || '')
      setLabelsAdded(Array.isArray(payload?.labelsAdded) ? payload.labelsAdded : [])
      setAgentData(Array.isArray(payload?.agentData) ? payload.agentData : [])
      setChatAssignAgent(payload?.chatAssignAgent || {})
      setAssignAgentUid(payload?.chatAssignAgent?.uid || '')
      setStatus('')
    })

    socket.on('error', (payload) => {
      setStatus(payload?.msg || 'Inbox socket error')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [decoded?.uid, tokens.user])

  useEffect(() => {
    if (!socketRef.current) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      refreshChatList(search, filterType)
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [refreshChatList])

  async function saveNote() {
    if (!selectedChat?.chat_id) {
      return
    }

    setStatus('Saving note...')
    try {
      const result = await apiRequest('/api/user/save_note', {
        method: 'POST',
        token: tokens.user,
        body: {
          chatId: selectedChat.chat_id,
          note: chatNote,
        },
      })

      setStatus(result?.success ? 'Note updated.' : result?.msg || 'Unable to save note')
    } catch (error) {
      setStatus(error.message || 'Unable to save note')
    }
  }

  function assignAgent() {
    if (!selectedChat?.chat_id || !socketRef.current) {
      return
    }

    setStatus(assignAgentUid ? 'Assigning agent...' : 'Removing agent assignment...')
    socketRef.current.emit('assign_agent_to_chat', {
      data: {
        chatId: selectedChat.chat_id,
        agentUid: assignAgentUid,
        unAssign: !assignAgentUid,
      },
    })

    setChatAssignAgent(
      assignAgentUid ? agentData.find((agent) => agent.uid === assignAgentUid) || {} : {},
    )
    refreshChatList()
  }

  function sendMessage(event) {
    event.preventDefault()

    if (!messageDraft.trim() || !selectedChat?.chat_id || !socketRef.current) {
      return
    }

    setStatus('Sending message...')
    socketRef.current.emit('send_chat_message', {
      data: {
        type: 'text',
        msgCon: {
          type: 'text',
          text: {
            preview_url: true,
            body: messageDraft.trim(),
          },
        },
        chatInfo: selectedChat,
      },
    })

    setMessageDraft('')

    window.setTimeout(() => {
      openChat(selectedChat)
      refreshChatList()
    }, 800)
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">inbox</span>
          <h2>Live inbox workbench</h2>
          <p>Socket-backed chat list, conversation loading, notes, assignment, and outbound text messaging.</p>
        </div>
        <div className="status-chip">{connectionStatus}</div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="inbox-layout">
        <aside className="panel inbox-sidebar">
          <div className="panel-header">
            <h2>Chats</h2>
          </div>
          <div className="filter-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, number, note, or tag"
            />
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              <option value="all">All</option>
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>
          </div>
          <div className="chat-list">
            {chats.map((chat) => (
              <button
                className={classNames(
                  'chat-list-item',
                  selectedChat?.chat_id === chat.chat_id ? 'active' : '',
                )}
                key={chat.chat_id}
                type="button"
                onClick={() => openChat(chat)}
              >
                <strong>{chat.phonebook?.name || chat.sender_name || chat.sender_mobile}</strong>
                <span>{chat.sender_mobile}</span>
                <p>{chat.last_message || 'No messages yet.'}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="page-stack">
          <div className="panel">
            <div className="panel-header">
              <h2>{selectedChat ? selectedChat.sender_name || selectedChat.sender_mobile : 'Conversation'}</h2>
            </div>
            <div className="conversation-thread">
              {conversation.length ? (
                conversation.map((message, index) => (
                  <article
                    className={classNames(
                      'message-bubble',
                      message.route === 'OUTGOING' ? 'outgoing' : 'incoming',
                    )}
                    key={`${message.metaChatId || message.timestamp || 'message'}-${index}`}
                  >
                    <span>{message.route === 'OUTGOING' ? 'You' : message.senderName || 'Contact'}</span>
                    <strong>{normalizeConversationMessage(message)}</strong>
                    <small>{formatRelativeTimestamp(message.timestamp)}</small>
                  </article>
                ))
              ) : (
                <p className="empty-state">Open a chat to load its conversation.</p>
              )}
            </div>
            <form className="composer-row" onSubmit={sendMessage}>
              <input
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Type a text reply"
              />
              <button className="primary-button" type="submit">
                Send
              </button>
            </form>
          </div>

          <div className="two-column-grid">
            <div className="panel form-panel">
              <div className="panel-header">
                <h2>Chat note</h2>
              </div>
              <textarea
                rows={6}
                value={chatNote}
                onChange={(event) => setChatNote(event.target.value)}
                placeholder="Internal note for this conversation"
              />
              <button className="primary-button" type="button" onClick={saveNote}>
                Save note
              </button>
            </div>

            <div className="panel form-panel">
              <div className="panel-header">
                <h2>Assignment and labels</h2>
              </div>
              <label>
                Assigned agent
                <select
                  value={assignAgentUid}
                  onChange={(event) => setAssignAgentUid(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {agentData.map((agent) => (
                    <option key={agent.uid} value={agent.uid}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary-button" type="button" onClick={assignAgent}>
                {assignAgentUid ? 'Save assignment' : 'Remove assignment'}
              </button>
              <div className="meta-block">
                <p>Current assignment: {chatAssignAgent?.uid ? chatAssignAgent.email || chatAssignAgent.uid : 'None'}</p>
                <p>
                  Active labels:{' '}
                  {selectedChat?.chat_tags
                    ? Array.isArray(selectedChat.chat_tags)
                      ? selectedChat.chat_tags.join(', ')
                      : String(selectedChat.chat_tags)
                    : 'None'}
                </p>
                <p>Available labels: {labelsAdded.map((label) => label.title).join(', ') || 'None'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function UserAutomationFlowsPage() {
  const { tokens } = useAuth()
  const [flows, setFlows] = useState([])
  const [status, setStatus] = useState('Loading flows...')
  const [flowId, setFlowId] = useState('')
  const [title, setTitle] = useState('')
  const [nodesJson, setNodesJson] = useState(prettyJson([]))
  const [edgesJson, setEdgesJson] = useState(prettyJson([]))
  const [activity, setActivity] = useState({ prevent: [], ai: [] })

  const loadFlows = useCallback(async () => {
    setStatus('Loading flows...')
    try {
      const result = await apiRequest('/api/chat_flow/get_mine', { token: tokens.user })
      setFlows(Array.isArray(result?.data) ? result.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load flows')
    }
  }, [tokens.user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadFlows()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadFlows])

  async function openFlow(nextFlowId, nextTitle = '') {
    setFlowId(nextFlowId)
    setTitle(nextTitle)
    setStatus('Loading flow detail...')

    try {
      const [detailResult, activityResult] = await Promise.all([
        apiRequest('/api/chat_flow/get_by_flow_id', {
          method: 'POST',
          token: tokens.user,
          body: { flowId: nextFlowId },
        }),
        apiRequest('/api/chat_flow/get_activity', {
          method: 'POST',
          token: tokens.user,
          body: { flowId: nextFlowId },
        }),
      ])

      setNodesJson(prettyJson(detailResult?.nodes || []))
      setEdgesJson(prettyJson(detailResult?.edges || []))
      setActivity({
        prevent: Array.isArray(activityResult?.prevent) ? activityResult.prevent : [],
        ai: Array.isArray(activityResult?.ai) ? activityResult.ai : [],
      })
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load flow detail')
    }
  }

  function newFlow() {
    setFlowId(createFlowId())
    setTitle('Untitled Flow')
    setNodesJson(prettyJson([]))
    setEdgesJson(prettyJson([]))
    setActivity({ prevent: [], ai: [] })
    setStatus('New flow draft ready.')
  }

  async function saveFlow(event) {
    event.preventDefault()
    const parsedNodes = parseJsonField(nodesJson, 'Nodes')
    const parsedEdges = parseJsonField(edgesJson, 'Edges')

    if (!parsedNodes.success) {
      setStatus(parsedNodes.error)
      return
    }

    if (!parsedEdges.success) {
      setStatus(parsedEdges.error)
      return
    }

    const nextFlowId = flowId || createFlowId()
    setStatus('Saving flow...')

    try {
      const result = await apiRequest('/api/chat_flow/add_new', {
        method: 'POST',
        token: tokens.user,
        body: {
          title,
          flowId: nextFlowId,
          nodes: parsedNodes.data,
          edges: parsedEdges.data,
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to save flow')
        return
      }

      setFlowId(nextFlowId)
      setStatus('Flow saved.')
      loadFlows()
      openFlow(nextFlowId, title)
    } catch (error) {
      setStatus(error.message || 'Unable to save flow')
    }
  }

  async function deleteFlow(flow) {
    setStatus('Deleting flow...')
    try {
      const result = await apiRequest('/api/chat_flow/del_flow', {
        method: 'POST',
        token: tokens.user,
        body: {
          id: flow.id,
          flowId: flow.flow_id,
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete flow')
        return
      }

      if (flow.flow_id === flowId) {
        setFlowId('')
        setTitle('')
        setNodesJson(prettyJson([]))
        setEdgesJson(prettyJson([]))
        setActivity({ prevent: [], ai: [] })
      }

      setStatus('Flow deleted.')
      loadFlows()
    } catch (error) {
      setStatus(error.message || 'Unable to delete flow')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">automation flows</span>
          <h2>Real flow CRUD over `/api/chat_flow`</h2>
          <p>Flow list, detail loading, JSON editing, save, delete, and activity inspection are wired to the backend.</p>
        </div>
        <button className="primary-button" type="button" onClick={newFlow}>
          New flow
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="inbox-layout">
        <aside className="panel inbox-sidebar">
          <div className="panel-header">
            <h2>Saved flows</h2>
          </div>
          <div className="chat-list">
            {flows.map((flow) => (
              <div className="list-row" key={flow.flow_id}>
                <button
                  className={classNames('chat-list-item', flow.flow_id === flowId ? 'active' : '')}
                  type="button"
                  onClick={() => openFlow(flow.flow_id, flow.title)}
                >
                  <strong>{flow.title}</strong>
                  <span>{flow.flow_id}</span>
                </button>
                <button className="mini-button subtle-danger" type="button" onClick={() => deleteFlow(flow)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="page-stack">
          <form className="panel form-panel" onSubmit={saveFlow}>
            <div className="panel-header">
              <h2>Flow editor</h2>
            </div>
            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Flow title" />
            </label>
            <label>
              Flow ID
              <input value={flowId} onChange={(event) => setFlowId(event.target.value)} placeholder="flow identifier" />
            </label>
            <label>
              Nodes JSON
              <textarea rows={10} value={nodesJson} onChange={(event) => setNodesJson(event.target.value)} />
            </label>
            <label>
              Edges JSON
              <textarea rows={10} value={edgesJson} onChange={(event) => setEdgesJson(event.target.value)} />
            </label>
            <button className="primary-button" type="submit">
              Save flow
            </button>
          </form>

          <div className="two-column-grid">
            <div className="panel">
              <div className="panel-header">
                <h2>AI activity</h2>
              </div>
              <ul className="signal-list">
                {activity.ai.map((entry) => (
                  <li key={entry.id}>{entry.senderNumber || entry.number || JSON.stringify(entry)}</li>
                ))}
                {!activity.ai.length ? <li>No AI activity entries.</li> : null}
              </ul>
            </div>
            <div className="panel">
              <div className="panel-header">
                <h2>Disabled numbers</h2>
              </div>
              <ul className="signal-list">
                {activity.prevent.map((entry) => (
                  <li key={entry.id}>{entry.senderNumber || entry.number || JSON.stringify(entry)}</li>
                ))}
                {!activity.prevent.length ? <li>No disabled numbers.</li> : null}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function UserAgentPage() {
  const { tokens } = useAuth()
  const [agents, setAgents] = useState([])
  const [status, setStatus] = useState('Loading agents...')
  const [actionStatus, setActionStatus] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    comments: '',
  })

  const loadAgents = useCallback(async () => {
    setStatus('Loading agents...')
    try {
      const result = await apiRequest('/api/agent/get_my_agents', { token: tokens.user })
      setAgents(Array.isArray(result?.data) ? result.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load agents')
    }
  }, [tokens.user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAgents()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadAgents])

  async function createAgent(event) {
    event.preventDefault()
    setActionStatus('Creating agent...')

    try {
      const result = await apiRequest('/api/agent/add_agent', {
        method: 'POST',
        token: tokens.user,
        body: form,
      })

      if (!result?.success) {
        setActionStatus(result?.msg || 'Unable to create agent')
        return
      }

      setForm({
        name: '',
        email: '',
        mobile: '',
        password: '',
        comments: '',
      })
      setActionStatus('Agent created.')
      loadAgents()
    } catch (error) {
      setActionStatus(error.message || 'Unable to create agent')
    }
  }

  async function autoLogin(uid) {
    setActionStatus('Creating agent auto-login token...')

    try {
      const result = await apiRequest('/api/user/auto_agent_login', {
        method: 'POST',
        token: tokens.user,
        body: { uid },
      })

      if (!result?.success || !result?.token) {
        setActionStatus(result?.msg || 'Unable to create auto-login token')
        return
      }

      window.open(`/agent/login?token=${encodeURIComponent(result.token)}`, '_blank', 'noopener')
      setActionStatus('Agent portal opened in a new tab.')
    } catch (error) {
      setActionStatus(error.message || 'Unable to create auto-login token')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">agent login</span>
          <h2>Tenant-managed staff accounts</h2>
          <p>This matches the live model: agents belong to a tenant and can be auto-logged into `/agent`.</p>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      {actionStatus ? <p className="status-line">{actionStatus}</p> : null}
      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={createAgent}>
          <div className="panel-header">
            <h2>Create agent</h2>
          </div>
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            Mobile
            <input value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          <label>
            Comments
            <textarea
              value={form.comments}
              onChange={(event) => setForm({ ...form, comments: event.target.value })}
              rows={4}
            />
          </label>
          <button className="primary-button" type="submit">
            Create agent
          </button>
        </form>

        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Current agents</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.uid}>
                  <td>{agent.name}</td>
                  <td>{agent.email}</td>
                  <td>{agent.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button className="mini-button" type="button" onClick={() => autoLogin(agent.uid)}>
                      Auto login
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UserTaskPage() {
  const { tokens } = useAuth()
  const [agents, setAgents] = useState([])
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('Loading tasks...')
  const [form, setForm] = useState({
    title: '',
    des: '',
    agent_uid: '',
  })

  async function loadTaskPageData() {
    setStatus('Loading tasks...')
    try {
      const [taskResult, agentResult] = await Promise.all([
        apiRequest('/api/user/get_my_agent_tasks', { token: tokens.user }),
        apiRequest('/api/agent/get_my_agents', { token: tokens.user }),
      ])

      setTasks(Array.isArray(taskResult?.data) ? taskResult.data : [])
      setAgents(Array.isArray(agentResult?.data) ? agentResult.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load tasks')
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadTaskPageData()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [tokens.user])

  async function createTask(event) {
    event.preventDefault()
    setStatus('Creating task...')

    try {
      const result = await apiRequest('/api/user/add_task_for_agent', {
        method: 'POST',
        token: tokens.user,
        body: form,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create task')
        return
      }

      setForm({ title: '', des: '', agent_uid: '' })
      setStatus('Task created.')
      loadTaskPageData()
    } catch (error) {
      setStatus(error.message || 'Unable to create task')
    }
  }

  async function deleteTask(id) {
    setStatus('Deleting task...')
    try {
      const result = await apiRequest('/api/user/del_task_for_agent', {
        method: 'POST',
        token: tokens.user,
        body: { id },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete task')
        return
      }

      setStatus('Task deleted.')
      loadTaskPageData()
    } catch (error) {
      setStatus(error.message || 'Unable to delete task')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">agent task</span>
          <h2>Task queue assigned to tenant agents</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={createTask}>
          <div className="panel-header">
            <h2>Create task</h2>
          </div>
          <label>
            Title
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Follow up lead"
            />
          </label>
          <label>
            Description
            <textarea
              rows={6}
              value={form.des}
              onChange={(event) => setForm({ ...form, des: event.target.value })}
              placeholder="Describe the work for the agent"
            />
          </label>
          <label>
            Agent
            <select
              value={form.agent_uid}
              onChange={(event) => setForm({ ...form, agent_uid: event.target.value })}
            >
              <option value="">Select agent</option>
              {agents.map((agent) => (
                <option key={agent.uid} value={agent.uid}>
                  {agent.name} ({agent.email})
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit">
            Add task
          </button>
        </form>

        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Current tasks</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.agent_email}</td>
                  <td>{task.status}</td>
                  <td>{task.createdAt || 'N/A'}</td>
                  <td>
                    <button className="mini-button subtle-danger" type="button" onClick={() => deleteTask(task.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UserChatWidgetPage() {
  const { tokens } = useAuth()
  const [widgets, setWidgets] = useState([])
  const [status, setStatus] = useState('Loading widgets...')

  useEffect(() => {
    let active = true

    async function loadWidgets() {
      try {
        const result = await apiRequest('/api/user/get_my_widget', { token: tokens.user })
        if (!active) {
          return
        }
        setWidgets(Array.isArray(result?.data) ? result.data : [])
        setStatus('')
      } catch (error) {
        if (active) {
          setStatus(error.message || 'Unable to load widgets')
        }
      }
    }

    loadWidgets()
    return () => {
      active = false
    }
  }, [tokens.user])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">chat widget</span>
          <h2>Published embed widgets</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="card-grid">
        {widgets.length ? (
          widgets.map((widget) => (
            <article className="feature-card" key={widget.id}>
              <h3>{widget.title}</h3>
              <p>WhatsApp: {widget.whatsapp_number}</p>
              <p>Placement: {widget.place}</p>
              <p>Size: {widget.size}px</p>
            </article>
          ))
        ) : (
          <div className="panel">
            <p className="empty-state">No widgets created yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AgentDashboardPage() {
  const { tokens } = useAuth()
  const [agent, setAgent] = useState(null)
  const [chats, setChats] = useState([])
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('Loading agent workspace...')
  const [taskComments, setTaskComments] = useState({})
  const [chatStatuses, setChatStatuses] = useState({})

  async function loadAgentWorkspace() {
    setStatus('Loading agent workspace...')
    try {
      const [agentResult, chatResult, taskResult] = await Promise.all([
        apiRequest('/api/agent/get_me', { token: tokens.agent }),
        apiRequest('/api/agent/get_my_assigned_chats', { token: tokens.agent }),
        apiRequest('/api/agent/get_my_task', { token: tokens.agent }),
      ])

      if (!agentResult?.success) {
        setStatus(agentResult?.msg || 'Unable to load agent workspace')
        return
      }

      setAgent(agentResult.data)
      setChats(Array.isArray(chatResult?.data) ? chatResult.data : [])
      setTasks(Array.isArray(taskResult?.data) ? taskResult.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load agent workspace')
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAgentWorkspace()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [tokens.agent])

  async function markTaskComplete(id) {
    setStatus('Updating task...')
    try {
      const result = await apiRequest('/api/agent/mark_task_complete', {
        method: 'POST',
        token: tokens.agent,
        body: {
          id,
          comment: taskComments[id] || '',
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to update task')
        return
      }

      setStatus('Task updated.')
      loadAgentWorkspace()
    } catch (error) {
      setStatus(error.message || 'Unable to update task')
    }
  }

  async function updateChatStatus(chatId) {
    setStatus('Updating chat status...')
    try {
      const result = await apiRequest('/api/agent/change_chat_ticket_status', {
        method: 'POST',
        token: tokens.agent,
        body: {
          chatId,
          status: chatStatuses[chatId] || 'open',
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to update chat status')
        return
      }

      setStatus('Chat status updated.')
      loadAgentWorkspace()
    } catch (error) {
      setStatus(error.message || 'Unable to update chat status')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">agent workspace</span>
          <h2>Restricted staff portal</h2>
          <p>Ready for direct auto-login from the tenant `Agent Login` screen.</p>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="dashboard-grid">
        <DashboardCard title="Agent" value={agent?.name || '-'} detail={agent?.email || 'No profile loaded'} />
        <DashboardCard title="Assigned chats" value={chats.length} detail="Scoped to owner_uid and agent_chats" />
        <DashboardCard title="Open tasks" value={tasks.length} detail="Agent task queue" />
      </div>
      <div className="two-column-grid">
        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Assigned chats</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Chat ID</th>
                <th>Name</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {chats.map((chat) => (
                <tr key={chat.chat_id}>
                  <td>{chat.chat_id}</td>
                  <td>{chat.name || chat.mobile || 'Unknown contact'}</td>
                  <td>
                    <select
                      value={chatStatuses[chat.chat_id] || chat.chat_status || 'open'}
                      onChange={(event) =>
                        setChatStatuses({
                          ...chatStatuses,
                          [chat.chat_id]: event.target.value,
                        })
                      }
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="solved">Solved</option>
                    </select>
                  </td>
                  <td>
                    <button className="mini-button" type="button" onClick={() => updateChatStatus(chat.chat_id)}>
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Task queue</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Comment</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.status}</td>
                  <td>
                    <input
                      value={taskComments[task.id] || ''}
                      onChange={(event) =>
                        setTaskComments({
                          ...taskComments,
                          [task.id]: event.target.value,
                        })
                      }
                      placeholder="Completion note"
                    />
                  </td>
                  <td>
                    <button className="mini-button" type="button" onClick={() => markTaskComplete(task.id)}>
                      Complete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
      <Route path="/signin" element={<PortalChooser />} />
      <Route path="/login" element={<UnifiedLoginPage />} />
      <Route path="/register" element={<Navigate to="/user/signup" replace />} />
      <Route path="/user/signup" element={<UserSignupPage />} />
      <Route
        path="/admin/login"
        element={
          <LoginPage
            role="admin"
            title="Admin Sign In"
            subtitle="Global SaaS operations for plans, tenants, orders, payments, and site configuration."
            endpoint="/api/admin/login"
          />
        }
      />
      <Route
        path="/user/login"
        element={
          <LoginPage
            role="user"
            title="User Sign In"
            subtitle="Tenant workspace for inbox, automation, campaigns, contacts, and agent management."
            endpoint="/api/user/login"
            allowSignup
          />
        }
      />
      <Route
        path="/agent/login"
        element={
          <LoginPage
            role="agent"
            title="Agent Sign In"
            subtitle="Restricted portal for assigned chats and tasks, including token-based tenant auto-login."
            endpoint="/api/agent/login"
          />
        }
      />

      <Route
        path="/admin"
        element={
          <RoleGate role="admin">
            <PortalLayout role="admin" title="Admin Portal" navItems={ADMIN_NAV} />
          </RoleGate>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="manage-plans" element={<AdminPlansPage />} />
        <Route path="manage-users" element={<AdminUsersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route
        path="/user"
        element={
          <RoleGate role="user">
            <PortalLayout role="user" title="User Portal" navItems={USER_NAV} />
          </RoleGate>
        }
      >
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboardPage />} />
        <Route path="inbox" element={<UserInboxPage />} />
        <Route path="contacts" element={<UserContactsPage />} />
        <Route path="campaigns" element={<UserCampaignsPage />} />
        <Route path="automation-flows" element={<UserAutomationFlowsPage />} />
        <Route path="chatbot" element={<UserChatBotPage />} />
        <Route path="integrations" element={<UserIntegrationsPage />} />
        <Route path="agent-login" element={<UserAgentPage />} />
        <Route path="agent-task" element={<UserTaskPage />} />
        <Route path="chat-widget" element={<UserChatWidgetPage />} />
        <Route path="settings" element={<UserSettingsPage />} />
      </Route>

      <Route
        path="/agent"
        element={
          <RoleGate role="agent">
            <PortalLayout role="agent" title="Agent Portal" navItems={AGENT_NAV} />
          </RoleGate>
        }
      >
        <Route index element={<Navigate to="/agent/dashboard" replace />} />
        <Route path="dashboard" element={<AgentDashboardPage />} />
        <Route path="chats" element={<AgentDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
