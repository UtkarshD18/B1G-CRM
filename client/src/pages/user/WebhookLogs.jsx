import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { DashboardCard } from '../../components/Dashboard'
import { formatDateTime } from '../../shared/format'

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: '#f8f3eb',
  padding: '24px',
  borderRadius: '24px',
  border: '1px solid rgba(10, 25, 37, 0.12)',
  boxShadow: '0 24px 70px rgba(7, 19, 29, 0.14)',
  width: 'min(700px, 95%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'grid',
  gap: '16px',
};

function formatPayload(val) {
  if (!val) return 'N/A'
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    return JSON.stringify(parsed, null, 2)
  } catch {
    return String(val)
  }
}

function renderStatusBadge(status) {
  const code = Number(status)
  if (!status) {
    return (
      <span className="status-chip" style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: '0.82rem', padding: '6px 12px' }}>
        UNKNOWN
      </span>
    )
  }
  if (code >= 200 && code < 300) {
    return (
      <span className="status-chip" style={{ backgroundColor: '#d8f0ea', color: '#031016', fontSize: '0.82rem', padding: '6px 12px' }}>
        {status} OK
      </span>
    )
  }
  return (
    <span className="status-chip" style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.82rem', padding: '6px 12px' }}>
      {status} ERROR
    </span>
  )
}

function UserWebhookLogsPage() {
  const { tokens } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedLog, setSelectedLog] = useState(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setStatus('Loading logs...')
    try {
      const result = await apiRequest('/api/webhooks/logs', { token: tokens.user })
      if (result?.success && Array.isArray(result.data)) {
        setLogs(result.data)
        setStatus('')
      } else {
        setStatus(result?.msg || 'Failed to retrieve logs')
      }
    } catch (err) {
      setStatus(err.message || 'Unable to retrieve webhook logs')
    } finally {
      setLoading(false)
    }
  }, [tokens.user])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Search term match
      const urlMatch = String(log.target_url || '').toLowerCase().includes(searchTerm.toLowerCase())
      const nameMatch = String(log.rule_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      const payloadMatch = String(log.payload || '').toLowerCase().includes(searchTerm.toLowerCase())
      const responseMatch = String(log.response_body || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSearch = !searchTerm || urlMatch || nameMatch || payloadMatch || responseMatch
      
      // 2. Status filter match
      let matchesStatus = true
      const code = Number(log.response_status)
      if (filterStatus === 'success') {
        matchesStatus = code >= 200 && code < 300
      } else if (filterStatus === 'error') {
        matchesStatus = !code || code < 200 || code >= 300
      }
      
      return matchesSearch && matchesStatus
    })
  }, [logs, searchTerm, filterStatus])

  const metrics = useMemo(() => {
    let successCount = 0
    let errorCount = 0
    logs.forEach(log => {
      const code = Number(log.response_status)
      if (code >= 200 && code < 300) {
        successCount++
      } else {
        errorCount++
      }
    })
    return {
      total: logs.length,
      successes: successCount,
      errors: errorCount,
    }
  }, [logs])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">webhook integration</span>
          <h2>Webhook Execution Logs</h2>
          <p>Inspect outgoing payload requests, target URLs, and response statuses triggered by webhook rules.</p>
        </div>
        <button className="primary-button" type="button" disabled={loading} onClick={loadLogs}>
          {loading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="dashboard-grid">
        <DashboardCard title="Total Calls" value={metrics.total} detail="Logged executions" />
        <DashboardCard title="Successes (2xx)" value={metrics.successes} detail="Delivered rule dispatches" />
        <DashboardCard title="Failures" value={metrics.errors} detail="Non-2xx response status" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Audit Trail & Filters</h2>
        </div>
        
        <div className="filter-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '16px' }}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by rule name, payload pattern, or target URL..."
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ minWidth: '160px' }}
          >
            <option value="all">All Executions</option>
            <option value="success">Success (2xx)</option>
            <option value="error">Errors & Failures</option>
          </select>
        </div>

        <div className="compact-table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Rule Name</th>
                <th>Target URL</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                  <td>{log.rule_name || <em className="muted-copy">Anonymous Rule</em>}</td>
                  <td style={{ wordBreak: 'break-all', maxWidth: '300px' }}>{log.target_url}</td>
                  <td>{renderStatusBadge(log.response_status)}</td>
                  <td>
                    <button
                      className="mini-button dark-text"
                      type="button"
                      onClick={() => setSelectedLog(log)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredLogs.length ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '36px 0' }}>
                    <span className="muted-copy">No webhook execution logs matched current criteria.</span>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Log Details Modal */}
      {selectedLog && (
        <div style={overlayStyle} onClick={() => setSelectedLog(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h2>Webhook Execution Details</h2>
              <button className="mini-button" type="button" onClick={() => setSelectedLog(null)}>Close</button>
            </div>
            
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px', borderBottom: '1px solid #d9e1e4', paddingBottom: '10px' }}>
                <span className="muted-copy" style={{ fontWeight: 600 }}>Execution Time:</span>
                <span>{formatDateTime(selectedLog.createdAt)}</span>
                
                <span className="muted-copy" style={{ fontWeight: 600 }}>Rule Name:</span>
                <span>{selectedLog.rule_name || 'N/A'} (ID: {selectedLog.rule_id || 'N/A'})</span>
                
                <span className="muted-copy" style={{ fontWeight: 600 }}>Target URL:</span>
                <span style={{ wordBreak: 'break-all' }}>{selectedLog.target_url}</span>
                
                <span className="muted-copy" style={{ fontWeight: 600 }}>HTTP Status:</span>
                <div>{renderStatusBadge(selectedLog.response_status)}</div>
              </div>

              <div>
                <h4 style={{ margin: '8px 0', color: '#10212d' }}>Request Payload (POST Body)</h4>
                <pre className="code-block" style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#f1ebd9',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid rgba(16,33,45,0.08)',
                  fontSize: '0.85rem'
                }}>
                  {formatPayload(selectedLog.payload)}
                </pre>
              </div>

              <div>
                <h4 style={{ margin: '8px 0', color: '#10212d' }}>Response Body</h4>
                <pre className="code-block" style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#f1ebd9',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid rgba(16,33,45,0.08)',
                  fontSize: '0.85rem'
                }}>
                  {formatPayload(selectedLog.response_body)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserWebhookLogsPage
