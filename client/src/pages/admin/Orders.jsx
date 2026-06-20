import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime, formatMoney } from '../../shared/format'

const paymentModeColors = {
  stripe: { bg: '#e0f2fe', color: '#0369a1' },
  paypal: { bg: '#fef9c3', color: '#854d0e' },
  razorpay: { bg: '#fce7f3', color: '#9d174d' },
  paystack: { bg: '#d1fae5', color: '#065f46' },
  offline: { bg: '#f3f4f6', color: '#374151' },
}

function getPaymentStyle(mode) {
  const key = String(mode || '').toLowerCase()
  return paymentModeColors[key] || { bg: '#f3f4f6', color: '#374151' }
}

function AdminOrdersPage() {
  const { tokens } = useAuth()
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('Loading orders...')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState('all')

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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm ||
        String(order.name || '').toLowerCase().includes(q) ||
        String(order.email || '').toLowerCase().includes(q) ||
        String(order.uid || '').toLowerCase().includes(q) ||
        String(order.payment_mode || '').toLowerCase().includes(q)

      const matchesMode = filterMode === 'all' ||
        String(order.payment_mode || '').toLowerCase() === filterMode

      return matchesSearch && matchesMode
    })
  }, [orders, searchTerm, filterMode])

  const metrics = useMemo(() => {
    const total = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0)
    return { count: orders.length, total }
  }, [orders])

  const paymentModes = useMemo(() => {
    const modes = new Set(orders.map(o => String(o.payment_mode || 'Unknown').toLowerCase()))
    return Array.from(modes).filter(Boolean)
  }, [orders])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">billing &amp; payments</span>
          <h2>Recent Transactions</h2>
          <p>All subscription payments and order records across tenant accounts.</p>
        </div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="dashboard-grid">
        <div className="panel" style={{ padding: '20px', borderLeft: '4px solid #1ea085', borderRadius: '12px' }}>
          <span className="muted-copy" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', color: '#102a43' }}>{metrics.count}</h2>
          <span style={{ fontSize: '11px', color: '#1ea085' }}>All time records</span>
        </div>
        <div className="panel" style={{ padding: '20px', borderLeft: '4px solid #3182ce', borderRadius: '12px' }}>
          <span className="muted-copy" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', color: '#102a43' }}>{formatMoney(metrics.total)}</h2>
          <span style={{ fontSize: '11px', color: '#3182ce' }}>Gross collected amount</span>
        </div>
        <div className="panel" style={{ padding: '20px', borderLeft: '4px solid #dd6b20', borderRadius: '12px' }}>
          <span className="muted-copy" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Showing</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', color: '#102a43' }}>{filteredOrders.length}</h2>
          <span style={{ fontSize: '11px', color: '#dd6b20' }}>Filtered results</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Order Log</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '16px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or payment mode..."
          />
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
            style={{ minWidth: '160px' }}
          >
            <option value="all">All Gateways</option>
            {paymentModes.map(mode => (
              <option key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px 0' }}>
                    <span className="muted-copy">
                      {searchTerm || filterMode !== 'all' ? 'No orders matched current filters.' : 'No transactions recorded yet.'}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const style = getPaymentStyle(order.payment_mode)
                  return (
                    <tr key={order.id}>
                      <td><strong>{order.name || order.uid || 'Unknown'}</strong></td>
                      <td className="muted-copy">{order.email || '—'}</td>
                      <td><strong>{formatMoney(Number(order.amount || 0))}</strong></td>
                      <td>
                        <span
                          className="status-chip"
                          style={{ backgroundColor: style.bg, color: style.color, fontSize: '11px', textTransform: 'capitalize' }}
                        >
                          {order.payment_mode || 'Unknown'}
                        </span>
                      </td>
                      <td className="muted-copy">{formatDateTime(order.orderCreatedAt)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminOrdersPage
