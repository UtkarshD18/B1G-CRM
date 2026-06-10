import { useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatMoney } from '../../shared/format'

function AdminPlansPage() {
  const { tokens } = useAuth()
  const [plans, setPlans] = useState([])
  const [status, setStatus] = useState('Loading plans...')

  useEffect(() => {
    let active = true

    async function loadPlans() {
      try {
        const result = await apiRequest('/api/admin/get_plans', { token: tokens.admin })
        if (!active) {
          return
        }
        setPlans(Array.isArray(result?.data) ? result.data : [])
        setStatus('')
      } catch (error) {
        if (active) {
          setStatus(error.message || 'Unable to load plans')
        }
      }
    }

    loadPlans()
    return () => {
      active = false
    }
  }, [tokens.admin])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">manage plans</span>
          <h2>Pricing and entitlement surface</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="pricing-grid">
        {plans.map((plan) => (
          <article className="pricing-card" key={plan.id}>
            <p className="plan-name">{plan.title}</p>
            <div className="plan-price">{formatMoney(Number(plan.price || 0))}</div>
            <p className="plan-period">{plan.plan_duration_in_days} days</p>
            <p>{plan.short_description}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminPlansPage
