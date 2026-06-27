import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
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

function StatusBadge({ status }) {
  const isReceived = String(status || '').toUpperCase() === 'RECEIVED'
  return (
    <span className="status-chip" style={{
      backgroundColor: isReceived ? '#d8f0ea' : '#fee2e2',
      color: isReceived ? '#031016' : '#991b1b',
      fontSize: '0.82rem', padding: '6px 12px', fontWeight: 600
    }}>
      {String(status || 'UNKNOWN').toUpperCase()}
    </span>
  )
}

function UserWebhookLogsPage() {
  const { tokens } = useAuth()
  const [incomingEvents, setIncomingEvents] = useState([])
  const [outgoingLogs, setOutgoingLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('incoming')
  const [selectedLog, setSelectedLog] = useState(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setStatus('Loading webhook logs...')
    try {
      const [incomingResult, outgoingResult] = await Promise.all([
        apiRequest('/api/webhooks/incoming-events', { token: tokens.user }),
        apiRequest('/api/webhooks/logs', { token: tokens.user }),
      ])

      setIncomingEvents(Array.isArray(incomingResult?.data) ? incomingResult.data : [])
      setOutgoingLogs(Array.isArray(outgoingResult?.data) ? outgoingResult.data : [])
      setStatus('')
    } catch (err) {
      setStatus(err.message || 'Unable to retrieve webhook logs')
    } finally {
      setLoading(false)
    }
  }, [tokens.user])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const filteredIncoming = useMemo(() => {
    if (!searchTerm) return incomingEvents
    const q = searchTerm.toLowerCase()
    return incomingEvents.filter(e =>
      String(e.name || '').toLowerCase().includes(q) ||
      String(e.event_type || '').toLowerCase().includes(q) ||
      String(e.key_id || '').toLowerCase().includes(q) ||
      String(e.status || '').toLowerCase().includes(q)
    )
  }, [incomingEvents, searchTerm])

  const filteredOutgoing = useMemo(() => {
    if (!searchTerm) return outgoingLogs
    const q = searchTerm.toLowerCase()
    return outgoingLogs.filter(l =>
      String(l.rule_name || '').toLowerCase().includes(q) ||
      String(l.target_url || '').toLowerCase().includes(q) ||
      String(l.payload || '').toLowerCase().includes(q)
    )
  }, [outgoingLogs, searchTerm])

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🔗</div>
          <div>
            <h2 style={{ margin: 0 }}>Webhook Logs</h2>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>View and manage webhook requests logs</p>
          </div>
        </div>
        <button className="primary-button" type="button" disabled={loading} onClick={loadLogs}>
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontWeight: activeTab === 'incoming' ? 700 : 400,
            background: activeTab === 'incoming' ? '#1ea085' : '#f0f0f0',
            color: activeTab === 'incoming' ? '#fff' : '#607481',
            fontSize: '14px', transition: 'all 0.2s'
          }}
        >
          Incoming Events {incomingEvents.length > 0 ? `(${incomingEvents.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outgoing')}
          style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontWeight: activeTab === 'outgoing' ? 700 : 400,
            background: activeTab === 'outgoing' ? '#1ea085' : '#f0f0f0',
            color: activeTab === 'outgoing' ? '#fff' : '#607481',
            fontSize: '14px', transition: 'all 0.2s'
          }}
        >
          Rule Dispatches {outgoingLogs.length > 0 ? `(${outgoingLogs.length})` : ''}
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>{activeTab === 'incoming' ? 'Incoming Webhook Requests' : 'Outgoing Webhook Dispatches'}</h2>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'incoming' ? 'Search by name, event type, key...' : 'Search by rule name, URL, payload...'}
            style={{ width: '100%', maxWidth: '480px' }}
          />
        </div>

        {activeTab === 'incoming' ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Key ID</th>
                  <th>Name</th>
                  <th>HTTP Method</th>
                  <th>Event Type</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncoming.map((evt) => (
                  <tr key={evt.id}>
                    <td></td>
                    <td>
                      <code style={{ fontSize: '12px', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        {evt.key_id}
                      </code>
                    </td>
                    <td style={{ fontWeight: 500 }}>{evt.name || '—'}</td>
                    <td>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                        {evt.http_method || 'POST'}
                      </span>
                    </td>
                    <td className="muted-copy">{evt.event_type || 'unknown'}</td>
                    <td><StatusBadge status={evt.status} /></td>
                    <td className="muted-copy" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(evt.createdat)}</td>
                    <td>
                      <button
                        className="mini-button"
                        type="button"
                        onClick={() => setSelectedLog(evt)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredIncoming.length ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '32px' }}>📭</span>
                        <strong>No incoming webhook events yet</strong>
                        <span className="muted-copy">When external systems (Shopify, Meta, etc.) call your webhook URL, they will appear here.</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                {filteredOutgoing.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.createdat || log.createdAt)}</td>
                    <td>{log.rule_name || <em className="muted-copy">Anonymous Rule</em>}</td>
                    <td style={{ wordBreak: 'break-all', maxWidth: '300px' }}>{log.target_url}</td>
                    <td>
                      {(() => {
                        const code = Number(log.response_status)
                        if (!log.response_status) return <span className="status-chip" style={{ background: '#f3f4f6', color: '#374151', fontSize: '0.82rem', padding: '6px 12px' }}>UNKNOWN</span>
                        if (code >= 200 && code < 300) return <span className="status-chip" style={{ background: '#d8f0ea', color: '#031016', fontSize: '0.82rem', padding: '6px 12px' }}>{code} OK</span>
                        return <span className="status-chip" style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.82rem', padding: '6px 12px' }}>{code} ERROR</span>
                      })()}
                    </td>
                    <td>
                      <button className="mini-button" type="button" onClick={() => setSelectedLog(log)}>
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredOutgoing.length ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px 0' }}>
                      <span className="muted-copy">No webhook dispatch logs matched current criteria.</span>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div style={overlayStyle} onClick={() => setSelectedLog(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h2>Webhook Event Details</h2>
              <button className="mini-button" type="button" onClick={() => setSelectedLog(null)}>Close</button>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              {activeTab === 'incoming' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', borderBottom: '1px solid #d9e1e4', paddingBottom: '10px' }}>
                    <span className="muted-copy" style={{ fontWeight: 600 }}>Key ID:</span>
                    <code>{selectedLog.key_id}</code>
                    <span className="muted-copy" style={{ fontWeight: 600 }}>Name:</span>
                    <span>{selectedLog.name || 'N/A'}</span>
                    <span className="muted-copy" style={{ fontWeight: 600 }}>HTTP Method:</span>
                    <span>{selectedLog.http_method || 'POST'}</span>
                    <span className="muted-copy" style={{ fontWeight: 600 }}>Event Type:</span>
                    <span>{selectedLog.event_type || 'unknown'}</span>
                    <span className="muted-copy" style={{ fontWeight: 600 }}>Status:</span>
                    <StatusBadge status={selectedLog.status} />
                    <span className="muted-copy" style={{ fontWeight: 600 }}>Received At:</span>
                    <span>{formatDateTime(selectedLog.createdat)}</span>
                  </div>
                  <div>
                    <h4 style={{ margin: '8px 0', color: '#10212d' }}>Payload</h4>
                    <pre className="code-block" style={{ padding: '12px', borderRadius: '12px', background: '#f1ebd9', maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(16,33,45,0.08)', fontSize: '0.85rem' }}>
                      {formatPayload(selectedLog.payload)}
                    </pre>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', borderBottom: '1px solid #d9e1e4', paddingBottom: '10px' }}>
                    <span className="muted-copy" style={{ fontWeight: 600 }}>Execution Time:</span>
                    <span>{formatDateTime(selectedLog.createdat || selectedLog.createdAt)}</span>
                    <span className="muted-copy" style={{ fontWeight: 600 }}>Rule:</span>
                    <span>{selectedLog.rule_name || 'N/A'} (ID: {selectedLog.rule_id || 'N/A'})</span>
                    <span className="muted-copy" style={{ fontWeight: 600 }}>Target URL:</span>
                    <span style={{ wordBreak: 'break-all' }}>{selectedLog.target_url}</span>
                    <span className="muted-copy" style={{ fontWeight: 600 }}>HTTP Status:</span>
                    <span>{selectedLog.response_status || 'N/A'}</span>
                  </div>
                  <div>
                    <h4 style={{ margin: '8px 0' }}>Request Payload</h4>
                    <pre className="code-block" style={{ padding: '12px', borderRadius: '12px', background: '#f1ebd9', maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(16,33,45,0.08)', fontSize: '0.85rem' }}>
                      {formatPayload(selectedLog.payload)}
                    </pre>
                  </div>
                  <div>
                    <h4 style={{ margin: '8px 0' }}>Response Body</h4>
                    <pre className="code-block" style={{ padding: '12px', borderRadius: '12px', background: '#f1ebd9', maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(16,33,45,0.08)', fontSize: '0.85rem' }}>
                      {formatPayload(selectedLog.response_body)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserWebhookLogsPage
