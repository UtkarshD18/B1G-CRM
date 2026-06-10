import { useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatMonthSeries } from '../../shared/format'
import { DashboardCard, DashboardSeries } from '../../components/Dashboard'

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

export default AdminDashboardPage
