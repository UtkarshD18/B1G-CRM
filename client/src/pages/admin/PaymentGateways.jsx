import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

const defaults = {
  pay_offline_id: '', pay_offline_key: '', offline_active: 0,
  pay_stripe_id: '', pay_stripe_key: '', stripe_active: 0,
  pay_paypal_id: '', pay_paypal_key: '', paypal_active: 0,
  rz_id: '', rz_key: '', rz_active: 0,
  pay_paystack_id: '', pay_paystack_key: '', paystack_active: 0,
  pay_mercadopago_id: '', pay_mercadopago_key: '', mercadopago_active: 0,
}

const gateways = [
  { name: 'Offline', prefix: 'pay_offline', flag: 'offline_active', color: '#64748b', icon: '💰' },
  { name: 'Stripe', prefix: 'pay_stripe', flag: 'stripe_active', color: '#635bff', icon: '💳' },
  { name: 'PayPal', prefix: 'pay_paypal', flag: 'paypal_active', color: '#003087', icon: '🅿️' },
  { name: 'Razorpay', prefix: 'rz', flag: 'rz_active', color: '#072654', icon: '🇮🇳' },
  { name: 'Paystack', prefix: 'pay_paystack', flag: 'paystack_active', color: '#00c3f7', icon: '🌍' },
  { name: 'MercadoPago', prefix: 'pay_mercadopago', flag: 'mercadopago_active', color: '#009ee3', icon: '💙' },
]

const gatewayLabels = {
  Offline: { id: 'Title', key: 'Description' },
  Stripe: { id: 'Key ID', key: 'Secret Key' },
  PayPal: { id: 'Key ID', key: 'Secret Key' },
  Razorpay: { id: 'Key ID', key: 'Secret Key' },
  Paystack: { id: 'Key ID', key: 'Secret Key' },
  MercadoPago: { id: 'Public Key', key: 'Access Token' },
}

function AdminPaymentGateways() {
  const { tokens } = useAuth()
  const [data, setData] = useState(defaults)
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    try {
      const result = await apiRequest('/api/admin/get_payment_gateway_admin', { token: tokens.admin })
      setData({ ...defaults, ...(result?.data || {}) })
    } catch (e) { setStatus(e.message) }
  }, [tokens.admin])

  useEffect(() => { load() }, [load])

  async function save(e) {
    e.preventDefault()
    setStatus('Saving...')
    try {
      const result = await apiRequest('/api/admin/update_pay_gateway', { method: 'POST', token: tokens.admin, body: data })
      setStatus(result?.msg || 'Saved')
    } catch (err) { setStatus(err.message) }
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>💳</div>
          <div>
            <span className="eyebrow">payment-gateways</span>
            <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Payment Gateways</h5>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>Configure payment gateway settings for your application</p>
          </div>
        </div>
      </div>

      {status && <p className="status-line">{status}</p>}

      <form onSubmit={save}>
        <div style={{ display: 'grid', gap: '16px' }}>
          {gateways.map(gw => (
            <div key={gw.name} className="panel" style={{ padding: '20px', borderRadius: '16px', borderLeft: `4px solid ${gw.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <span style={{ fontSize: '1.3rem' }}>{gw.icon}</span>
                  <strong style={{ fontSize: '1rem' }}>{gw.name}</strong>
                </div>
                <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={Number(data[gw.flag]) > 0} onChange={e => setData({ ...data, [gw.flag]: e.target.checked ? 1 : 0 })} />
                  <span style={{ fontWeight: 600, color: Number(data[gw.flag]) > 0 ? '#1ea085' : '#607481' }}>
                    Enabled
                  </span>
                </label>
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <label style={{ display: 'grid', gap: '6px', fontWeight: 600, color: '#365261' }}>
                  {gatewayLabels[gw.name]?.id || `${gw.name} ID / Public Key`}
                  <input value={data[`${gw.prefix}_id`] || ''} onChange={e => setData({ ...data, [`${gw.prefix}_id`]: e.target.value })} style={{ borderRadius: '12px', padding: '12px 14px', border: '1px solid #c5d0d6' }} />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontWeight: 600, color: '#365261' }}>
                  {gatewayLabels[gw.name]?.key || `${gw.name} Secret Key`}
                  {gw.name === 'Offline' ? (
                    <textarea rows={4} value={data[`${gw.prefix}_key`] || ''} onChange={e => setData({ ...data, [`${gw.prefix}_key`]: e.target.value })} style={{ borderRadius: '12px', padding: '12px 14px', border: '1px solid #c5d0d6' }} />
                  ) : (
                    <input type="password" value={data[`${gw.prefix}_key`] || ''} onChange={e => setData({ ...data, [`${gw.prefix}_key`]: e.target.value })} style={{ borderRadius: '12px', padding: '12px 14px', border: '1px solid #c5d0d6' }} />
                  )}
                </label>
              </div>
            </div>
          ))}
        </div>
        <button className="primary-button" type="submit" style={{ marginTop: '20px', borderRadius: '12px', width: '100%' }}>Save Settings</button>
      </form>
    </div>
  )
}

export default AdminPaymentGateways
