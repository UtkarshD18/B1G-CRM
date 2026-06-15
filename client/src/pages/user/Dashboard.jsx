import { useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatMonthSeries } from '../../shared/format'
import { DashboardCard, DashboardSeries } from '../../components/Dashboard'

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

export default UserDashboardPage
