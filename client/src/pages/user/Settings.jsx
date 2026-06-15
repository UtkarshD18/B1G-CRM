import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime, formatMoney, summarizePlan } from '../../shared/format'

function UserSettingsPage() {
  const { tokens } = useAuth()
  const [status, setStatus] = useState('Loading settings...')
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile_with_country_code: '',
    timezone: 'Asia/Kolkata',
    newPassword: '',
  })
  const [plans, setPlans] = useState([])
  const [apiKey, setApiKey] = useState('')
  const [currentPlan, setCurrentPlan] = useState('')
  const [planExpire, setPlanExpire] = useState('')

  const loadSettings = useCallback(async () => {
    setStatus('Loading settings...')
    try {
      const [meResult, planResult] = await Promise.all([
        apiRequest('/api/user/get_me', { token: tokens.user }),
        apiRequest('/api/admin/get_plans', { token: tokens.user }),
      ])

      const user = meResult?.data || {}
      setProfile({
        name: user.name || '',
        email: user.email || '',
        mobile_with_country_code: user.mobile_with_country_code || '',
        timezone: user.timezone || 'Asia/Kolkata',
        newPassword: '',
      })
      setApiKey(user.api_key || '')
      setCurrentPlan(user.plan || '')
      setPlanExpire(user.plan_expire || '')
      setPlans(Array.isArray(planResult?.data) ? planResult.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load settings')
    }
  }, [tokens.user])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  async function updateProfile(event) {
    event.preventDefault()
    setStatus('Updating profile...')
    try {
      const body = { ...profile }
      if (!body.newPassword) {
        delete body.newPassword
      }

      const result = await apiRequest('/api/user/update_profile', {
        method: 'POST',
        token: tokens.user,
        body,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to update profile')
        return
      }

      setStatus('Profile updated.')
      loadSettings()
    } catch (error) {
      setStatus(error.message || 'Unable to update profile')
    }
  }

  async function startTrial(planId) {
    setStatus('Starting trial...')
    try {
      const result = await apiRequest('/api/user/start_free_trial', {
        method: 'POST',
        token: tokens.user,
        body: { planId },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to start trial')
        return
      }

      setStatus(result.msg || 'Trial activated.')
      loadSettings()
    } catch (error) {
      setStatus(error.message || 'Unable to start trial')
    }
  }

  async function generateApiKey() {
    setStatus('Generating API key...')
    try {
      const result = await apiRequest('/api/user/generate_api_keys', { token: tokens.user })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to generate API key')
        return
      }

      setApiKey(result.token)
      setStatus('API key generated.')
    } catch (error) {
      setStatus(error.message || 'Unable to generate API key')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">settings</span>
          <h2>Tenant profile, plan, and API settings</h2>
          <p>Manage workspace identity, subscription state, and developer API access.</p>
        </div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={updateProfile}>
          <div className="panel-header">
            <h2>Profile</h2>
          </div>
          <label>
            Name
            <input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
          </label>
          <label>
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
            />
          </label>
          <label>
            Mobile with country code
            <input
              value={profile.mobile_with_country_code}
              onChange={(event) => setProfile({ ...profile, mobile_with_country_code: event.target.value })}
            />
          </label>
          <label>
            Timezone
            <input value={profile.timezone} onChange={(event) => setProfile({ ...profile, timezone: event.target.value })} />
          </label>
          <label>
            New password
            <input
              type="password"
              value={profile.newPassword}
              onChange={(event) => setProfile({ ...profile, newPassword: event.target.value })}
              placeholder="Leave blank to keep current password"
            />
          </label>
          <button className="primary-button" type="submit">
            Save profile
          </button>
        </form>

        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Current plan</h2>
          </div>
          <div className="meta-block">
            <p>Plan: {summarizePlan(currentPlan)}</p>
            <p>Expires: {formatDateTime(planExpire)}</p>
          </div>
          <div className="copy-chip">{apiKey || 'No API key generated yet.'}</div>
          <button className="primary-button" type="button" onClick={generateApiKey}>
            Generate API key
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <article className="pricing-card" key={plan.id}>
            <p className="plan-name">{plan.title}</p>
            <div className="plan-price">{formatMoney(Number(plan.price || 0))}</div>
            <p className="plan-period">{plan.plan_duration_in_days} days</p>
            <p>{plan.short_description}</p>
            {Number(plan.is_trial) > 0 || Number(plan.price) === 0 ? (
              <button className="primary-button" type="button" onClick={() => startTrial(plan.id)}>
                Start trial
              </button>
            ) : (
              <p className="muted-copy">Paid checkout is available after gateway credentials are configured.</p>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

export default UserSettingsPage
