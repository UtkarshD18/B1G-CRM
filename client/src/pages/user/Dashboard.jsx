import { useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatMonthSeries } from '../../shared/format'
import { DashboardCard, DashboardSeries } from '../../components/Dashboard'

function UserDashboardPage() {
  const { tokens } = useAuth()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('Loading dashboard...')
  const [seeding, setSeeding] = useState(false)

  const loadDashboard = async () => {
    try {
      const result = await apiRequest('/api/user/get_dashboard', { token: tokens.user })
      if (!result?.success) {
        setStatus(result?.msg || 'Unable to load user dashboard')
        return
      }
      setData(result)
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load user dashboard')
    }
  }

  useEffect(() => {
    let active = true

    async function initialLoad() {
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

    initialLoad()
    return () => {
      active = false
    }
  }, [tokens.user])

  async function handleSeedData() {
    setSeeding(true)
    setStatus('Generating sandbox environment demo data...')
    try {
      const result = await apiRequest('/api/user/seed_demo_data', {
        method: 'POST',
        token: tokens.user
      })
      if (!result?.success) {
        setStatus(result?.msg || 'Unable to seed demo data')
        return
      }
      setStatus('Demo data generated! Refreshing metrics...')
      await loadDashboard()
      setStatus('Demo workspace successfully seeded.')
    } catch (error) {
      setStatus(error.message || 'Unable to seed demo data')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">user dashboard</span>
          <h2>Tenant operations snapshot</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}

      {data && (Number(data.totalChats || 0) === 0 || Number(data.totalContacts || 0) === 0) && (
        <div className="panel" style={{ background: 'linear-gradient(135deg, #1ea085 0%, #10212d 100%)', color: '#f3f1eb', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: '1', minWidth: '280px' }}>
              <h2 style={{ color: '#ffffff', margin: '0 0 8px 0' }}>Quick Start: Seed Demo Workspace</h2>
              <p style={{ color: 'rgba(243, 241, 235, 0.85)', margin: 0, fontSize: '0.95rem' }}>
                It looks like your workspace is empty. Instantly generate a complete sandbox environment containing 1 phonebook, 10 segmented contacts, 1 scheduled campaign, 1 chatbot, 1 visual flow, and 3 active customer chat conversations.
              </p>
            </div>
            <button
              className="primary-button"
              style={{ background: '#ffffff', color: '#10212d', minWidth: '180px' }}
              disabled={seeding}
              onClick={handleSeedData}
            >
              {seeding ? 'Seeding Sandbox...' : 'Generate Demo CRM Data'}
            </button>
          </div>
        </div>
      )}

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
