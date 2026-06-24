import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function UserSupervisorDashboardPage() {
  const { tokens } = useAuth()
  const [kpis, setKpis] = useState({
    averageResponseTimeOverall: 0,
    averageResponseTimePerAgent: [],
    totalSlaBreaches: 0,
    openChatsCount: 0,
    escalatedChatsCount: 0
  })
  const [escalations, setEscalations] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const loadWorkflowData = useCallback(async () => {
    setLoading(true)
    try {
      const [kpisRes, escRes] = await Promise.all([
        apiRequest('/api/agent_workflow/kpis', { token: tokens.user }),
        apiRequest('/api/agent_workflow/escalations', { token: tokens.user })
      ])

      if (kpisRes?.success && kpisRes.data) {
        setKpis(kpisRes.data)
      }
      if (escRes?.success && Array.isArray(escRes.data)) {
        setEscalations(escRes.data)
      }
    } catch (error) {
      setStatus(error.message || 'Error loading dashboard metrics.')
    } finally {
      setLoading(false)
    }
  }, [tokens.user])

  useEffect(() => {
    loadWorkflowData()
  }, [loadWorkflowData])

  async function handleResolveEscalation(chatId) {
    setStatus('Resolving escalation ticket...')
    try {
      const result = await apiRequest('/api/agent_workflow/escalations/resolve', {
        method: 'POST',
        token: tokens.user,
        body: { chat_id: chatId }
      })

      if (result?.success) {
        setStatus(result.msg || 'Escalation ticket resolved.')
        // Reload dashboard
        loadWorkflowData()
      } else {
        setStatus(result?.msg || 'Failed to resolve escalation.')
      }
    } catch (error) {
      setStatus(error.message || 'Error resolving escalation ticket.')
    }
  }

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '0s'
    const minutes = Math.floor(sec / 60)
    const seconds = Math.round(sec % 60)
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">sla performance</span>
          <h2>Supervisor SLA Dashboard</h2>
          <p>Monitor customer response velocities, handle escalated queues, and track service level agreement (SLA) status.</p>
        </div>
      </div>

      {status && <div className="status-line">{status}</div>}

      {/* KPI Counters row */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* KPI 1 */}
        <div className="panel" style={{ padding: '20px', borderLeft: '4px solid #1ea085', borderRadius: '12px' }}>
          <span className="muted-copy" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Response Speed</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', color: 'var(--text-primary)' }}>
            {formatSeconds(kpis.averageResponseTimeOverall)}
          </h2>
          <span style={{ fontSize: '11px', color: '#1ea085' }}>Across all responses</span>
        </div>

        {/* KPI 2 */}
        <div className="panel" style={{ padding: '20px', borderLeft: '4px solid #3182ce', borderRadius: '12px' }}>
          <span className="muted-copy" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Chats</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', color: 'var(--text-primary)' }}>{kpis.openChatsCount}</h2>
          <span style={{ fontSize: '11px', color: '#3182ce' }}>Currently in 'open' status</span>
        </div>

        {/* KPI 3 */}
        <div className="panel" style={{ padding: '20px', borderLeft: '4px solid #dd6b20', borderRadius: '12px' }}>
          <span className="muted-copy" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Escalations</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', color: '#dd6b20' }}>{kpis.escalatedChatsCount}</h2>
          <span style={{ fontSize: '11px', color: '#dd6b20' }}>SLA response breaches</span>
        </div>

        {/* KPI 4 */}
        <div className="panel" style={{ padding: '20px', borderLeft: '4px solid #e53e3e', borderRadius: '12px' }}>
          <span className="muted-copy" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total SLA Breaches</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', color: '#e53e3e' }}>{kpis.totalSlaBreaches}</h2>
          <span style={{ fontSize: '11px', color: '#e53e3e' }}>Historical log records</span>
        </div>
      </div>

      <div className="two-column-grid">
        {/* Escalation Queue */}
        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Active Escalation Queue</h2>
          </div>
          <p className="muted-copy" style={{ marginBottom: '16px' }}>
            Chats in this list have breached the 5-minute response SLA. Clear escalations by resolving them or messaging the customer.
          </p>

          {loading ? (
            <p className="status-line">Retrieving escalations...</p>
          ) : escalations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', background: 'rgba(16,185,129,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>✓</span>
              <p className="muted-copy" style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                All SLA targets are green. No active escalations.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {escalations.map(esc => (
                <div
                  key={esc.id}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{esc.sender_name} ({esc.sender_mobile})</strong>
                      <div className="muted-copy" style={{ fontSize: '11px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                        Source: {esc.origin} | Escalated at: {new Date(esc.escalated_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="status-chip active" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)', fontSize: '10px', border: '1px solid rgba(239,68,68,0.3)' }}>
                      Breached
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--text-primary)' }}>
                    ⚠️ {esc.reason}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleResolveEscalation(esc.chat_id)}
                      style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--accent-primary)' }}
                    >
                      Resolve Escalation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-Agent KPIs table */}
        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Agent Performance Metrics</h2>
          </div>
          <p className="muted-copy" style={{ marginBottom: '16px' }}>
            Average response velocities and message volumes recorded by each assigned operator.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Email</th>
                  <th>Total Responses</th>
                  <th>Avg Response Speed</th>
                </tr>
              </thead>
              <tbody>
                {kpis.averageResponseTimePerAgent.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }} className="muted-copy">
                      No agent activity records logged yet.
                    </td>
                  </tr>
                ) : (
                  kpis.averageResponseTimePerAgent.map(agent => (
                    <tr key={agent.agent_uid}>
                      <td><strong>{agent.name}</strong></td>
                      <td>{agent.email}</td>
                      <td>{agent.total_responses}</td>
                      <td>
                        <span style={{ fontWeight: 'bold', color: agent.avg_time > 300 ? '#e53e3e' : '#1ea085' }}>
                          {formatSeconds(agent.avg_time)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSupervisorDashboardPage
