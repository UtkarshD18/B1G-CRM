import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatMoney } from '../../shared/format'

const emptyPlan = {
  id: '',
  title: '',
  short_description: '',
  allow_tag: true,
  allow_note: true,
  allow_chatbot: true,
  contact_limit: 1000,
  allow_api: true,
  is_trial: false,
  price: 0,
  price_strike: 0,
  plan_duration_in_days: 30,
}

function planToForm(plan = emptyPlan) {
  return {
    ...emptyPlan,
    ...plan,
    allow_tag: Number(plan.allow_tag ?? emptyPlan.allow_tag) > 0,
    allow_note: Number(plan.allow_note ?? emptyPlan.allow_note) > 0,
    allow_chatbot: Number(plan.allow_chatbot ?? emptyPlan.allow_chatbot) > 0,
    allow_api: Number(plan.allow_api ?? emptyPlan.allow_api) > 0,
    is_trial: Number(plan.is_trial ?? emptyPlan.is_trial) > 0,
  }
}

function AdminPlansPage() {
  const { tokens } = useAuth()
  const [plans, setPlans] = useState([])
  const [status, setStatus] = useState('Loading plans...')
  const [form, setForm] = useState(emptyPlan)

  const loadPlans = useCallback(async () => {
    setStatus('Loading plans...')
    try {
      const result = await apiRequest('/api/admin/get_plans', { token: tokens.admin })
      setPlans(Array.isArray(result?.data) ? result.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load plans')
    }
  }, [tokens.admin])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  async function savePlan(event) {
    event.preventDefault()
    setStatus(form.id ? 'Updating plan...' : 'Creating plan...')

    const endpoint = form.id ? '/api/admin/edit_plan' : '/api/admin/add_plan'

    try {
      const result = await apiRequest(endpoint, {
        method: 'POST',
        token: tokens.admin,
        body: form,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to save plan')
        return
      }

      setForm(emptyPlan)
      setStatus(result.msg || 'Plan saved.')
      loadPlans()
    } catch (error) {
      setStatus(error.message || 'Unable to save plan')
    }
  }

  async function deletePlan(id, title) {
    if (!window.confirm(`Are you sure you want to permanently delete plan "${title || id}"?`)) {
      return
    }
    setStatus('Deleting plan...')
    try {
      const result = await apiRequest('/api/admin/del_plan', {
        method: 'POST',
        token: tokens.admin,
        body: { id },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete plan')
        return
      }

      setStatus('Plan deleted.')
      loadPlans()
    } catch (error) {
      setStatus(error.message || 'Unable to delete plan')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">manage plans</span>
          <h2>Pricing and entitlement controls</h2>
          <p>Create, edit, and remove plans used by signup, billing, and tenant access checks.</p>
        </div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <form className="panel form-panel" onSubmit={savePlan}>
        <div className="panel-header">
          <h2>{form.id ? 'Edit plan' : 'Create plan'}</h2>
          {form.id ? (
            <button className="mini-button" type="button" onClick={() => setForm(emptyPlan)}>
              New plan
            </button>
          ) : null}
        </div>
        <div className="form-grid">
          <label>
            Title
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label>
            Price
            <input
              min="0"
              type="number"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </label>
          <label>
            Strike price
            <input
              min="0"
              type="number"
              value={form.price_strike}
              onChange={(event) => setForm({ ...form, price_strike: event.target.value })}
            />
          </label>
          <label>
            Duration days
            <input
              min="1"
              type="number"
              value={form.plan_duration_in_days}
              onChange={(event) => setForm({ ...form, plan_duration_in_days: event.target.value })}
            />
          </label>
          <label>
            Contact limit
            <input
              min="0"
              type="number"
              value={form.contact_limit}
              onChange={(event) => setForm({ ...form, contact_limit: event.target.value })}
            />
          </label>
          <label>
            Description
            <input
              value={form.short_description}
              onChange={(event) => setForm({ ...form, short_description: event.target.value })}
            />
          </label>
        </div>
        <div className="action-row">
          {[
            ['allow_tag', 'Tags'],
            ['allow_note', 'Notes'],
            ['allow_chatbot', 'Chatbot'],
            ['allow_api', 'API'],
            ['is_trial', 'Trial'],
          ].map(([key, label]) => (
            <label className="checkbox-row" key={key}>
              <input
                checked={Boolean(form[key])}
                type="checkbox"
                onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <button className="primary-button" type="submit">
          {form.id ? 'Save plan' : 'Create plan'}
        </button>
      </form>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <article className="pricing-card" key={plan.id}>
            <p className="plan-name">{plan.title}</p>
            <div className="plan-price">{formatMoney(Number(plan.price || 0))}</div>
            <p className="plan-period">{plan.plan_duration_in_days} days</p>
            <p>{plan.short_description}</p>
            <div className="meta-block">
              <p>Contacts: {plan.contact_limit}</p>
              <p>
                Entitlements:{' '}
                {[
                  Number(plan.allow_tag) > 0 ? 'tags' : '',
                  Number(plan.allow_note) > 0 ? 'notes' : '',
                  Number(plan.allow_chatbot) > 0 ? 'chatbot' : '',
                  Number(plan.allow_api) > 0 ? 'api' : '',
                ]
                  .filter(Boolean)
                  .join(', ') || 'none'}
              </p>
            </div>
            <div className="action-row">
              <button className="mini-button" type="button" onClick={() => setForm(planToForm(plan))}>
                Edit
              </button>
              <button className="mini-button subtle-danger" type="button" onClick={() => deletePlan(plan.id, plan.title)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminPlansPage
