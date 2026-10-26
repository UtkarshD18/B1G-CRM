import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RazorpayCheckoutButton from '../components/RazorpayCheckout';

export default function RazorpayCheckoutPage() {
  const [amountRupees, setAmountRupees] = useState(10);
  const [customerName, setCustomerName] = useState('John Doe');
  const [customerEmail, setCustomerEmail] = useState('customer@example.com');
  const [customerPhone, setCustomerPhone] = useState('+919876543210');
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
  const amountPaise = Math.max(100, Math.round(Number(amountRupees || 1) * 100));

  const handleSuccess = (result) => {
    setPaymentResult(result);
    setErrorMessage('');
  };

  const handleError = (error) => {
    setErrorMessage(error?.message || 'Payment failed or was cancelled');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
          background: 'rgba(15, 23, 42, 0.75)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '18px',
          }}
        >
          <img src="/favicon-light.svg" alt="Logo" width="28" height="28" />
          <span>OMNI CRM • Razorpay Checkout</span>
        </Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link
            to="/user/billing"
            style={{
              color: '#38bdf8',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            User Billing Portal →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(16px)',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Card Header */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                boxShadow: '0 8px 16px rgba(13, 148, 136, 0.3)',
                marginBottom: '16px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M13.5 2L5 13H12L10.5 22L19 11H12L13.5 2Z"
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              </svg>
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                margin: '0 0 6px 0',
                color: '#ffffff',
              }}
            >
              Razorpay Standard Checkout
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                margin: 0,
              }}
            >
              Secure end-to-end payment modal with server order creation &amp; HMAC-SHA256
              verification
            </p>
          </div>

          {/* Key ID Badge */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              fontSize: '13px',
              color: '#bae6fd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Public Key:</span>
            <code style={{ fontWeight: 600, color: '#38bdf8' }}>{keyId || 'Not configured'}</code>
          </div>

          {/* Amount Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#cbd5e1',
              }}
            >
              Amount (₹ INR):
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[10, 50, 100, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountRupees(preset)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border:
                      amountRupees === preset
                        ? '2px solid #0d9488'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    background:
                      amountRupees === preset ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                    color: amountRupees === preset ? '#2dd4bf' : '#cbd5e1',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              value={amountRupees}
              onChange={(e) => setAmountRupees(Math.max(1, Number(e.target.value)))}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
              }}
              placeholder="Custom amount in ₹"
            />
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Order amount sent to Razorpay API: {amountPaise} paise
            </span>
          </div>

          {/* Customer Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Phone</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Checkout Action Button */}
          <div style={{ marginTop: '8px' }}>
            <RazorpayCheckoutButton
              amount={amountPaise}
              currency="INR"
              name="OMNI CRM"
              description={`Test Checkout for ₹${amountRupees}`}
              prefill={{
                name: customerName,
                email: customerEmail,
                contact: customerPhone,
              }}
              buttonText={`Pay ₹${amountRupees} with Razorpay`}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '16px',
                borderRadius: '12px',
              }}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>

          {/* Payment Success Card */}
          {paymentResult && (
            <div
              id="razorpay-success-card"
              style={{
                marginTop: '12px',
                padding: '18px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
                <span style={{ fontSize: '18px' }}>✓</span>
                <strong style={{ fontSize: '15px' }}>Payment Verified Successfully!</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'grid', gap: '4px' }}>
                <div>
                  <strong>Order ID:</strong>{' '}
                  <code style={{ color: '#6ee7b7' }}>{paymentResult.razorpay_order_id}</code>
                </div>
                <div>
                  <strong>Payment ID:</strong>{' '}
                  <code style={{ color: '#6ee7b7' }}>{paymentResult.razorpay_payment_id}</code>
                </div>
                <div>
                  <strong>Signature Verified:</strong>{' '}
                  <span style={{ color: '#34d399' }}>HMAC-SHA256 Match confirmed</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div
              style={{
                marginTop: '8px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '13px',
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
