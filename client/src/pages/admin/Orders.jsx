import { useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatMoney } from '../../shared/format'

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

export default AdminOrdersPage
