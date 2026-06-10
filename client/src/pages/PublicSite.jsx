import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../shared/api'
import { ADMIN_MODULES, AGENT_MODULES, DEFAULT_PLANS, PUBLIC_FEATURES, USER_MODULES } from '../shared/constants'
import { formatMoney } from '../shared/format'

function PublicSite() {
  const [plans, setPlans] = useState(DEFAULT_PLANS)

  useEffect(() => {
    let active = true

    async function loadPlans() {
      try {
        const result = await apiRequest('/api/admin/get_plans')
        if (active && Array.isArray(result?.data) && result.data.length > 0) {
          setPlans(result.data)
        }
      } catch {
        // Keep fallback marketing content when the API is unavailable.
      }
    }

    loadPlans()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="public-page">
      <header className="public-header">
        <Link className="brand" to="/">
          B1GCRM
        </Link>
        <nav>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#roles">Portals</a>
          <Link to="/signin">Sign in</Link>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">multi-portal saas crm</span>
            <h1>Public site, tenant workspace, staff portal, and admin controls in one product.</h1>
            <p>
              The live reference app is not a single dashboard. It is a complete SaaS flow with
              pricing, checkout intent, tenant automation, and agent handoff.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" to="/user/signup">
                Start free trial
              </Link>
              <Link className="secondary-button" to="/signin">
                Explore portals
              </Link>
            </div>
          </div>
          <div className="hero-panel">
            <h2>Confirmed live model</h2>
            <ul className="signal-list">
              <li>Admin portal manages plans, users, orders, settings, and CMS.</li>
              <li>User portal runs inbox, flows, campaigns, phonebook, and agents.</li>
              <li>Agent portal stays constrained to assigned chats and tasks.</li>
            </ul>
          </div>
        </section>

        <section className="feature-grid-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">feature positioning</span>
            <h2>Modules confirmed in the live product</h2>
          </div>
          <div className="feature-grid">
            {PUBLIC_FEATURES.map((feature) => (
              <article className="feature-card" key={feature}>
                <h3>{feature}</h3>
                <p>Aligned to the parity audit so frontend work follows the real product, not guesses.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pricing-section" id="pricing">
          <div className="section-heading">
            <span className="eyebrow">pricing and plans</span>
            <h2>Marketing and pre-purchase flow now have a real surface locally.</h2>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article className="pricing-card" key={plan.id || plan.title}>
                <p className="plan-name">{plan.title}</p>
                <div className="plan-price">{formatMoney(Number(plan.price || 0))}</div>
                <p className="plan-period">{plan.plan_duration_in_days}-day access window</p>
                <p>{plan.short_description || 'Plan details will be expanded from the admin portal.'}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="roles-section" id="roles">
          <div className="role-card">
            <span className="eyebrow">admin</span>
            <h3>Global SaaS owner portal</h3>
            <ul className="signal-list">
              {ADMIN_MODULES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="role-card">
            <span className="eyebrow">user</span>
            <h3>Tenant operations workspace</h3>
            <ul className="signal-list">
              {USER_MODULES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="role-card">
            <span className="eyebrow">agent</span>
            <h3>Restricted staff workspace</h3>
            <ul className="signal-list">
              {AGENT_MODULES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PublicSite
