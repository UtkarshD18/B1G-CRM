import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../shared/api';
import { DEFAULT_PLANS } from '../../shared/constants';
import { formatMoney } from '../../shared/format';
import { useTheme } from '../../shared/theme';

function UserSignupPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'trial';

  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mobile_with_country_code: '',
    acceptPolicy: true,
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchPlans() {
      try {
        const result = await apiRequest('/api/admin/get_plans');
        if (active && Array.isArray(result?.data) && result.data.length > 0) {
          setPlans(result.data);
          const hasRequested = result.data.some((p) => String(p.id) === initialPlan);
          if (hasRequested) {
            setSelectedPlanId(initialPlan);
          }
        }
      } catch {
        // Fallback to DEFAULT_PLANS
      }
    }

    fetchPlans();

    return () => {
      active = false;
    };
  }, [initialPlan]);

  const selectedPlan =
    plans.find((p) => String(p.id) === String(selectedPlanId)) || plans[0] || DEFAULT_PLANS[0];

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const result = await apiRequest('/api/user/signup', {
        method: 'POST',
        body: form,
      });

      if (!result?.success) {
        setStatus(result?.msg || 'Signup failed');
        return;
      }

      // Persist chosen plan for billing / onboarding
      try {
        localStorage.setItem('omni_selected_plan', String(selectedPlan?.id || 'trial'));
      } catch {
        // Ignore storage access error
      }

      navigate(
        `/user/login?registered=true&plan=${encodeURIComponent(selectedPlan?.id || 'trial')}&next=/user/dashboard`,
        { replace: true },
      );
    } catch (error) {
      setStatus(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDarkMode ? '#0a0a0a' : '#faf8f5',
        color: isDarkMode ? '#ededed' : '#1c1917',
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '32px 20px 60px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header bar */}
      <header
        style={{
          maxWidth: '1080px',
          margin: '0 auto 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            color: isDarkMode ? '#ededed' : '#1c1917',
            textDecoration: 'none',
          }}
        >
          <img
            src={isDarkMode ? '/favicon-dark.svg' : '/favicon-light.svg'}
            alt="OMNI CRM"
            style={{ width: '28px', height: '28px', borderRadius: '7px' }}
          />
          <span
            style={{
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              color: isDarkMode ? '#ededed' : '#1c1917',
            }}
          >
            OMNI CRM
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px' }}>
          <span style={{ color: isDarkMode ? '#888888' : '#78716c' }}>
            Already have an account?
          </span>
          <Link
            to="/user/login"
            style={{
              color: isDarkMode ? '#ededed' : '#1c1917',
              textDecoration: 'none',
              fontWeight: '500',
              padding: '7px 16px',
              borderRadius: '8px',
              background: isDarkMode ? '#1a1a1a' : '#ffffff',
              border: isDarkMode ? '1px solid #282828' : '1px solid #e7e3da',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Main container */}
      <main style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#eff6ff',
              color: '#2563eb',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '-0.01em',
              padding: '5px 14px',
              borderRadius: '9999px',
              border: '1px solid #dbeafe',
              marginBottom: '14px',
            }}
          >
            Create Your CRM Workspace
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: '700',
              margin: '0 0 10px 0',
              color: '#0f172a',
              letterSpacing: '-0.03em',
            }}
          >
            Choose your plan to get started
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#64748b',
              margin: '0 auto',
              maxWidth: '560px',
              lineHeight: '1.55',
            }}
          >
            Start with our full-featured 10-day evaluation or select an annual tier. No credit card
            required for trial onboarding.
          </p>
        </div>

        {/* Step 1: Plan Picker */}
        <div style={{ marginBottom: '36px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '18px',
            }}
          >
            {plans.map((plan) => {
              const isSelected = String(plan.id) === String(selectedPlanId);
              const price = Number(plan.price || 0);
              const isTrial = price === 0 || plan.is_trial === 1 || String(plan.id) === 'trial';

              return (
                <div
                  key={plan.id || plan.title}
                  onClick={() => setSelectedPlanId(String(plan.id))}
                  style={{
                    cursor: 'pointer',
                    background: '#ffffff',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '24px 20px',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected
                      ? '0 8px 24px -4px rgba(37, 99, 235, 0.16)'
                      : '0 1px 3px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: isTrial ? '#2563eb' : '#475569',
                        background: isTrial ? '#eff6ff' : '#f8fafc',
                        border: isTrial ? '1px solid #dbeafe' : '1px solid #e2e8f0',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                      }}
                    >
                      {isTrial ? 'Free Trial' : 'Production'}
                    </span>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: isSelected ? '5px solid #2563eb' : '2px solid #cbd5e1',
                        background: '#ffffff',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  </div>

                  <h3
                    style={{
                      margin: '0 0 6px 0',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#0f172a',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {plan.title}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px',
                      margin: '12px 0 8px',
                    }}
                  >
                    <span style={{ fontSize: '28px', fontWeight: '700', color: '#111111' }}>
                      {formatMoney(price)}
                    </span>
                    <span style={{ fontSize: '13px', color: '#737373' }}>
                      / {plan.plan_duration_in_days || (isTrial ? 10 : 365)} days
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '13px',
                      color: '#666666',
                      lineHeight: '1.5',
                      margin: 0,
                    }}
                  >
                    {plan.short_description ||
                      (isTrial
                        ? '10-day evaluation of inbox, flow builder, and campaigns.'
                        : 'Core multi-channel inbox, AI workflows, and scale controls.')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Account Creation Form */}
        <div
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '32px 28px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              marginBottom: '22px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Selected Plan:</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#2563eb',
                  background: '#eff6ff',
                  border: '1px solid #dbeafe',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                }}
              >
                {selectedPlan?.title} ({formatMoney(Number(selectedPlan?.price || 0))})
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px',
                  color: '#111111',
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Rahul Sharma"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #d4d4d8',
                  color: '#111111',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#111111')}
                onBlur={(e) => (e.target.style.borderColor = '#d4d4d8')}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px',
                  color: '#111111',
                }}
              >
                Work Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="rahul@company.com"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #d4d4d8',
                  color: '#111111',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#111111')}
                onBlur={(e) => (e.target.style.borderColor = '#d4d4d8')}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px',
                  color: '#111111',
                }}
              >
                Mobile Number (with country code)
              </label>
              <input
                type="tel"
                required
                value={form.mobile_with_country_code}
                onChange={(e) => setForm({ ...form, mobile_with_country_code: e.target.value })}
                placeholder="+91 98765 43210"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #d4d4d8',
                  color: '#111111',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#111111')}
                onBlur={(e) => (e.target.style.borderColor = '#d4d4d8')}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px',
                  color: '#111111',
                }}
              >
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Create a secure password"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #d4d4d8',
                  color: '#111111',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#111111')}
                onBlur={(e) => (e.target.style.borderColor = '#d4d4d8')}
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '13px',
                color: '#666666',
                cursor: 'pointer',
                margin: '4px 0',
              }}
            >
              <input
                type="checkbox"
                checked={form.acceptPolicy}
                onChange={(e) => setForm({ ...form, acceptPolicy: e.target.checked })}
                style={{ marginTop: '3px' }}
              />
              <span>I accept the privacy policy and terms of service for OMNI CRM.</span>
            </label>

            {status && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '13px',
                }}
              >
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '8px',
                background: '#2563eb',
                border: '1px solid #2563eb',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                marginTop: '4px',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#1d4ed8')}
              onMouseLeave={(e) => (e.target.style.background = '#2563eb')}
            >
              {loading
                ? 'Creating workspace...'
                : Number(selectedPlan?.price || 0) === 0
                  ? 'Start 10-Day Free Trial'
                  : `Create Account & Continue with ${selectedPlan?.title}`}
            </button>
          </form>

          <div
            style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#888888',
            }}
          >
            🔒 256-bit SSL encrypted connection. Your data is isolated per tenant.
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserSignupPage;
