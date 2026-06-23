import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime, formatMoney, formatMonthSeries, summarizePlan } from '../../shared/format'
import { DashboardCard, DashboardSeries } from '../../components/Dashboard'

function PlanBadge({ plan }) {
  const label = summarizePlan(plan)
  const colors = {
    trial: { bg: '#fef9c3', color: '#854d0e' },
    pro: { bg: '#d1fae5', color: '#065f46' },
    enterprise: { bg: '#dbeafe', color: '#1e40af' },
    free: { bg: '#f3f4f6', color: '#374151' },
  }
  const key = String(plan || '').toLowerCase().split('_')[0] || 'free'
  const style = colors[key] || colors.free
  return (
    <span className="status-chip" style={{ backgroundColor: style.bg, color: style.color, fontSize: '11px' }}>
      {label}
    </span>
  )
}

function AdminDashboardPage() {
  const { tokens } = useAuth()
  const [data, setData] = useState(null)
  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [status, setStatus] = useState('Loading dashboard...')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const [dashResult, usersResult, plansResult] = await Promise.all([
          apiRequest('/api/admin/get_dashboard_for_user', { token: tokens.admin }),
          apiRequest('/api/admin/get_users', { token: tokens.admin }),
          apiRequest('/api/admin/get_plans', { token: tokens.admin }),
        ])

        if (!active) return

        if (!dashResult?.success) {
          setStatus(dashResult?.msg || 'Unable to load admin dashboard')
          return
        }

        setData(dashResult.data)
        setUsers(Array.isArray(usersResult?.data) ? usersResult.data : [])
        setPlans(Array.isArray(plansResult?.data) ? plansResult.data : [])
        setStatus('')
      } catch (error) {
        if (active) {
          setStatus(error.message || 'Unable to load admin dashboard')
        }
      }
    }

    loadDashboard()
    return () => { active = false }
  }, [tokens.admin])

  const planDistribution = useMemo(() => {
    const counts = {}
    users.forEach(u => {
      const key = String(u.plan || 'none').toLowerCase()
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts).map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count)
  }, [users])

  const recentSignups = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.created_at || b.createdat || 0) - new Date(a.created_at || a.createdat || 0))
      .slice(0, 8)
  }, [users])

  const expiringUsers = useMemo(() => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 7)
    return users.filter(u => {
      if (!u.plan_expire) return false
      const exp = new Date(u.plan_expire)
      return exp <= soon && exp >= new Date()
    }).slice(0, 5)
  }, [users])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">admin dashboard</span>
          <h2>Operational SaaS overview</h2>
          <p>Tenant growth, revenue trends, and platform health at a glance.</p>
        </div>
        <div className="action-row">
          <Link className="mini-button" to="/admin/users">Manage Users</Link>
          <Link className="mini-button" to="/admin/orders">View Orders</Link>
        </div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      {/* Top KPIs */}
      <div className="dashboard-grid">
        <DashboardCard title="Total Tenants" value={data?.userLength ?? '-'} detail="All registered workspaces" />
        <DashboardCard title="Total Orders" value={data?.orderLength ?? '-'} detail="Payment transactions" />
        <DashboardCard title="Contact Leads" value={data?.contactLength ?? '-'} detail="Public site inquiries" />
        <DashboardCard title="Available Plans" value={plans.length} detail="Subscription tiers" />
      </div>

      {/* Charts */}
      <div className="two-column-grid">
        <DashboardSeries title="Paid signups (monthly)" data={formatMonthSeries(data?.paid)} />
        <DashboardSeries title="Orders by month" data={formatMonthSeries(data?.orders)} />
      </div>

      <div className="two-column-grid">
        {/* Plan distribution */}
        <div className="panel">
          <div className="panel-header">
            <h2>Plan distribution</h2>
          </div>
          {planDistribution.length === 0 ? (
            <p className="empty-state">No tenant plan data yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {planDistribution.map(({ plan, count }) => (
                <div key={plan} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(10,25,37,0.03)', borderRadius: '10px' }}>
                  <PlanBadge plan={plan} />
                  <span style={{ fontWeight: 700, fontSize: '20px', color: '#102a43' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring soon */}
        <div className="panel">
          <div className="panel-header">
            <h2>Expiring this week</h2>
          </div>
          {expiringUsers.length === 0 ? (
            <p className="empty-state">No subscriptions expiring in the next 7 days.</p>
          ) : (
            <div className="compact-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringUsers.map(u => (
                    <tr key={u.uid}>
                      <td><strong>{u.name || u.email}</strong></td>
                      <td><PlanBadge plan={u.plan} /></td>
                      <td className="muted-copy" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(u.plan_expire)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent signups */}
      <div className="panel">
        <div className="panel-header">
          <h2>Recent signups</h2>
          <Link className="mini-button" to="/admin/users">View all</Link>
        </div>
        {recentSignups.length === 0 ? (
          <p className="empty-state">No users registered yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map(u => (
                  <tr key={u.uid}>
                    <td><strong>{u.name || '—'}</strong></td>
                    <td className="muted-copy">{u.email}</td>
                    <td><PlanBadge plan={u.plan} /></td>
                    <td className="muted-copy" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(u.created_at || u.createdat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage
