import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../shared/api';
import { useAuth } from '../../shared/auth';
import { formatDateTime, formatMoney, summarizePlan } from '../../shared/format';

const gatewayLabels = [
  ['stripe', 'Stripe Checkout', 'stripe_active', 'pay_stripe_id'],
  ['paypal', 'PayPal', 'paypal_active', 'pay_paypal_id'],
  ['razorpay', 'Razorpay', 'rz_active', 'rz_id'],
  ['paystack', 'Paystack', 'paystack_active', 'pay_paystack_id'],
  ['mercadopago', 'MercadoPago', 'mercadopago_active', 'pay_mercadopago_id'],
  ['offline', 'Offline payment', 'offline_active', null],
];

function gatewayIsReady(paymentDetails, activeKey, publicKey) {
  if (Number(paymentDetails?.[activeKey] || 0) < 1) {
    return false;
  }

  return publicKey ? Boolean(paymentDetails?.[publicKey]) : true;
}

function UserBillingPage() {
  const { tokens } = useAuth();
  const [status, setStatus] = useState('Loading billing...');
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({});
  const [checkoutPlanId, setCheckoutPlanId] = useState('');

  const loadBilling = useCallback(async () => {
    setStatus('Loading billing...');
    try {
      const [meResult, planResult, paymentResult] = await Promise.all([
        apiRequest('/api/user/get_me', { token: tokens.user }),
        apiRequest('/api/admin/get_plans'),
        apiRequest('/api/user/get_payment_details', { token: tokens.user }),
      ]);

      if (!meResult?.success) {
        setStatus(meResult?.msg || 'Unable to load billing profile');
        return;
      }

      setUser(paymentResult?.userData || meResult.data || null);
      setPlans(Array.isArray(planResult?.data) ? planResult.data : []);
      setPaymentDetails(paymentResult?.data || {});
      setStatus('');
    } catch (error) {
      setStatus(error.message || 'Unable to load billing');
    }
  }, [tokens.user]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const activeGateways = useMemo(
    () =>
      gatewayLabels.map(([key, label, activeKey, publicKey]) => ({
        key,
        label,
        ready: gatewayIsReady(paymentDetails, activeKey, publicKey),
      })),
    [paymentDetails],
  );

  async function startTrial(planId) {
    setCheckoutPlanId(planId);
    setStatus('Activating trial plan...');
    try {
      const result = await apiRequest('/api/user/start_free_trial', {
        method: 'POST',
        token: tokens.user,
        body: { planId },
      });

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to activate trial');
        return;
      }

      setStatus(result.msg || 'Trial activated.');
      loadBilling();
    } catch (error) {
      setStatus(error.message || 'Unable to activate trial');
    } finally {
      setCheckoutPlanId('');
    }
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  async function startRazorpayCheckout(plan) {
    setCheckoutPlanId(plan.id);
    setStatus('Initializing Razorpay...');
    try {
      const rzId = paymentDetails.rz_id;
      if (!rzId) {
        setStatus('Razorpay credentials not configured. Please contact your admin.');
        return;
      }

      const resScript = await loadRazorpayScript();
      if (!resScript) {
        setStatus('Failed to load Razorpay SDK. Please check your connection.');
        return;
      }

      const options = {
        key: rzId,
        amount: Math.round(Number(plan.price || 0) * 100),
        currency: 'INR',
        name: 'B1GCRM',
        description: plan.title,
        handler: async function (response) {
          setStatus('Verifying Razorpay payment...');
          try {
            const verifyRes = await apiRequest('/api/user/pay_with_rz', {
              method: 'POST',
              token: tokens.user,
              body: {
                rz_payment_id: response.razorpay_payment_id,
                plan: plan,
                amount: plan.price,
              },
            });
            if (verifyRes?.success) {
              setStatus('Payment successful!');
              loadBilling();
            } else {
              setStatus(verifyRes?.msg || 'Payment verification failed');
            }
          } catch (err) {
            setStatus('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#1ea085',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setStatus('');
    } catch (err) {
      setStatus('Unable to open Razorpay checkout window.');
    } finally {
      setCheckoutPlanId('');
    }
  }

  async function startOfflineCheckout(planId) {
    setCheckoutPlanId(planId);
    setStatus('Recording offline payment request...');
    try {
      const result = await apiRequest('/api/user/pay_offline', {
        method: 'POST',
        token: tokens.user,
        body: { planId },
      });

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to record manual payment');
        return;
      }

      setStatus(result.msg || 'Custom payment succeeded!');
      loadBilling();
    } catch (error) {
      setStatus(error.message || 'Unable to record manual payment');
    } finally {
      setCheckoutPlanId('');
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">billing</span>
          <h2>Your Plan & Subscription</h2>
          <p>Manage your active plan, upgrade, or activate a free trial to access all features.</p>
        </div>
        <button className="primary-button" type="button" onClick={loadBilling}>
          Refresh
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div style={{ maxWidth: '650px', margin: '0 auto 24px auto', width: '100%' }}>
        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Current Plan</h2>
            <span
              className="status-chip"
              style={{
                background: 'linear-gradient(135deg, #1ea085, #0db88a)',
                color: '#fff',
                fontSize: '0.78rem',
                padding: '6px 14px',
              }}
            >
              Active
            </span>
          </div>
          <div className="meta-block" style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>🏢</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.name || 'Your Workspace'}
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem' }}>Workspace name</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>📦</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {summarizePlan(user?.plan)}
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem' }}>Current plan</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>📅</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDateTime(user?.plan_expire)}
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem' }}>Expires on</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>
                {Number(user?.trial || 0) > 0 ? '✅' : '🔓'}
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {Number(user?.trial || 0) > 0 ? 'Trial has been used' : 'Free trial available'}
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem' }}>Trial status</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="pricing-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {plans.map((plan) => {
          const isTrial = Number(plan.is_trial || 0) > 0 || Number(plan.price || 0) === 0;
          const isLoading = checkoutPlanId === plan.id;
          const rzActive = Number(paymentDetails.rz_active || 0) > 0;
          const offlineActive = Number(paymentDetails.offline_active || 0) > 0;

          return (
            <article
              className="pricing-card"
              key={plan.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '380px',
                justifyContent: 'space-between',
                padding: '30px 24px',
                borderRadius: '16px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <p
                  className="plan-name"
                  style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 8px 0' }}
                >
                  {plan.title}
                </p>
                <div
                  className="plan-price"
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: '800',
                    margin: '0 0 12px 0',
                    color: 'var(--text-primary)',
                  }}
                >
                  {formatMoney(Number(plan.price || 0))}
                </div>
                <p
                  className="plan-period"
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    margin: '0 0 16px 0',
                  }}
                >
                  {plan.plan_duration_in_days} days access window
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    margin: '0 0 24px 0',
                    lineHeight: '1.5',
                  }}
                >
                  {plan.short_description || 'Plan details are managed from the admin portal.'}
                </p>
              </div>

              <div style={{ marginTop: 'auto', display: 'grid', gap: '8px' }}>
                {isTrial ? (
                  <button
                    className="primary-button"
                    type="button"
                    style={{ width: '100%', borderRadius: '10px', padding: '12px' }}
                    onClick={() => startTrial(plan.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Activating...' : 'Start trial'}
                  </button>
                ) : (
                  <>
                    {rzActive && (
                      <button
                        className="primary-button"
                        type="button"
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #1ea085, #0db88a)',
                        }}
                        onClick={() => startRazorpayCheckout(plan)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Pay with Razorpay'}
                      </button>
                    )}
                    {offlineActive && (
                      <button
                        className="secondary-button"
                        type="button"
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          padding: '12px',
                          background: '#f3f4f6',
                          color: '#10212d',
                          border: '1px solid #d1d5db',
                        }}
                        onClick={() => startOfflineCheckout(plan.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Custom / Manual Payment'}
                      </button>
                    )}
                    {!rzActive && !offlineActive && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '12px 8px',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                        }}
                      >
                        <p
                          style={{
                            margin: '0 0 4px 0',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--color-warning)',
                          }}
                        >
                          🔧 Payment gateway onboarding
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.4',
                          }}
                        >
                          Razorpay will activate automatically once credentials are configured in
                          admin settings.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default UserBillingPage;
