import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime, formatMoney, summarizePlan } from '../../shared/format'

const gatewayLabels = [
  ['stripe', 'Stripe Checkout', 'stripe_active', 'pay_stripe_id'],
  ['paypal', 'PayPal', 'paypal_active', 'pay_paypal_id'],
  ['razorpay', 'Razorpay', 'rz_active', 'rz_id'],
  ['paystack', 'Paystack', 'paystack_active', 'pay_paystack_id'],
  ['offline', 'Offline payment', 'offline_active', null],
]

function gatewayIsReady(paymentDetails, activeKey, publicKey) {
  if (Number(paymentDetails?.[activeKey] || 0) < 1) {
    return false
  }

  return publicKey ? Boolean(paymentDetails?.[publicKey]) : true
}

function UserBillingPage() {
  const { tokens } = useAuth()
  const [status, setStatus] = useState('Loading billing...')
  const [plans, setPlans] = useState([])
  const [user, setUser] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState({})
  const [checkoutPlanId, setCheckoutPlanId] = useState('')

  const loadBilling = useCallback(async () => {
    setStatus('Loading billing...')
    try {
      const [meResult, planResult, paymentResult] = await Promise.all([
        apiRequest('/api/user/get_me', { token: tokens.user }),
        apiRequest('/api/admin/get_plans'),
        apiRequest('/api/user/get_payment_details', { token: tokens.user }),
      ])

      if (!meResult?.success) {
        setStatus(meResult?.msg || 'Unable to load billing profile')
        return
      }

      setUser(paymentResult?.userData || meResult.data || null)
      setPlans(Array.isArray(planResult?.data) ? planResult.data : [])
      setPaymentDetails(paymentResult?.data || {})
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load billing')
    }
  }, [tokens.user])

  useEffect(() => {
    loadBilling()
  }, [loadBilling])

  const activeGateways = useMemo(
    () =>
      gatewayLabels.map(([key, label, activeKey, publicKey]) => ({
        key,
        label,
        ready: gatewayIsReady(paymentDetails, activeKey, publicKey),
      })),
    [paymentDetails],
  )

  async function startTrial(planId) {
    setCheckoutPlanId(planId)
    setStatus('Activating trial plan...')
    try {
      const result = await apiRequest('/api/user/start_free_trial', {
        method: 'POST',
        token: tokens.user,
        body: { planId },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to activate trial')
        return
      }

      setStatus(result.msg || 'Trial activated.')
      loadBilling()
    } catch (error) {
      setStatus(error.message || 'Unable to activate trial')
    } finally {
      setCheckoutPlanId('')
    }
  }

  async function startStripeCheckout(planId) {
    setCheckoutPlanId(planId)
    setStatus('Creating Stripe checkout session...')
    try {
      const result = await apiRequest('/api/user/create_stripe_session', {
        method: 'POST',
        token: tokens.user,
        body: { planId },
      })

      if (!result?.success || !result?.session?.url) {
        setStatus(result?.msg || 'Unable to create checkout session')
        return
      }

      window.location.assign(result.session.url)
    } catch (error) {
      setStatus(error.message || 'Unable to create checkout session')
    } finally {
      setCheckoutPlanId('')
    }
  }

  const stripeReady = activeGateways.find((gateway) => gateway.key === 'stripe')?.ready

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">billing</span>
          <h2>Plans, trial, and checkout</h2>
          <p>Reference-style subscription management backed by the existing plan and payment APIs.</p>
        </div>
        <button className="primary-button" type="button" onClick={loadBilling}>
          Refresh
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="two-column-grid">
        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Current subscription</h2>
          </div>
          <div className="meta-block">
            <p>Workspace: {user?.name || 'Tenant workspace'}</p>
            <p>Plan: {summarizePlan(user?.plan)}</p>
            <p>Expires: {formatDateTime(user?.plan_expire)}</p>
            <p>Trial used: {Number(user?.trial || 0) > 0 ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Payment gateways</h2>
          </div>
          <div className="gateway-list">
            {activeGateways.map((gateway) => (
              <div className="gateway-row" key={gateway.key}>
                <span>{gateway.label}</span>
                <strong>{gateway.ready ? 'Configured' : 'Not configured'}</strong>
              </div>
            ))}
          </div>
          <p className="muted-copy">
            Stripe Checkout is wired end to end. PayPal, Razorpay, and Paystack are detected here and need their
            browser SDK handoff screens in the next payment pass.
          </p>
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => {
          const isTrial = Number(plan.is_trial || 0) > 0 || Number(plan.price || 0) === 0
          const isLoading = checkoutPlanId === plan.id

          return (
            <article className="pricing-card" key={plan.id}>
              <p className="plan-name">{plan.title}</p>
              <div className="plan-price">{formatMoney(Number(plan.price || 0))}</div>
              <p className="plan-period">{plan.plan_duration_in_days} days</p>
              <p>{plan.short_description || 'Plan details are managed from the admin portal.'}</p>
              {isTrial ? (
                <button className="primary-button" type="button" onClick={() => startTrial(plan.id)} disabled={isLoading}>
                  {isLoading ? 'Activating...' : 'Start trial'}
                </button>
              ) : (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => startStripeCheckout(plan.id)}
                  disabled={isLoading || !stripeReady}
                >
                  {isLoading ? 'Opening checkout...' : 'Pay with Stripe'}
                </button>
              )}
              {!isTrial && !stripeReady ? (
                <p className="muted-copy">Ask the admin to configure Stripe before paid checkout can open.</p>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default UserBillingPage
