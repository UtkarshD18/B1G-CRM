import React, { useState } from 'react';
import { apiRequest } from '../shared/api';

/**
 * Reusable Razorpay Standard Checkout Button Component
 *
 * Implements:
 * 1. Razorpay checkout.js script loading
 * 2. Order creation via POST /api/create-order
 * 3. Opening Razorpay modal with returned order_id
 * 4. Payment verification via POST /api/verify-payment
 * 5. Modal dismiss and payment.failed error handling
 */
export function RazorpayCheckoutButton({
  amount = 100, // in paise (e.g. 100 paise = 1 INR)
  currency = 'INR',
  name = 'OMNI CRM',
  description = 'Payment Checkout',
  prefill = {},
  notes = {},
  plan = null,
  token = null,
  buttonText = 'Pay with Razorpay',
  className = '',
  style = {},
  onSuccess,
  onError,
  onDismiss,
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamically ensure Razorpay script is loaded
  const ensureRazorpayLoaded = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const existingScript = document.getElementById('razorpay-checkout-script');
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => resolve(false);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setStatusMessage('Initializing checkout...');

      // Get public Key ID (KEY_SECRET is NEVER exposed to frontend)
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        const msg = 'Razorpay Key ID not configured. Please set VITE_RAZORPAY_KEY_ID in .env';
        setErrorMessage(msg);
        if (onError) onError(new Error(msg));
        setLoading(false);
        return;
      }

      // Ensure SDK script is ready
      const isLoaded = await ensureRazorpayLoaded();
      if (!isLoaded || !window.Razorpay) {
        const msg = 'Failed to load Razorpay SDK. Please check your network connection.';
        setErrorMessage(msg);
        if (onError) onError(new Error(msg));
        setLoading(false);
        return;
      }

      // STEP 1: Call backend to create order
      setStatusMessage('Creating order...');
      const orderResponse = await apiRequest('/api/create-order', {
        method: 'POST',
        token,
        body: {
          amount: Math.max(100, Math.round(Number(amount))),
          currency,
          receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          notes,
        },
      });

      if (!orderResponse || (!orderResponse.order_id && !orderResponse.id)) {
        const errorText =
          orderResponse?.error || orderResponse?.msg || 'Could not create payment order';
        setErrorMessage(errorText);
        if (onError) onError(new Error(errorText));
        setLoading(false);
        return;
      }

      const orderId = orderResponse.order_id || orderResponse.id;
      setStatusMessage('Opening payment window...');

      // STEP 2: Configure Razorpay modal with order_id
      const options = {
        key: keyId,
        amount: orderResponse.amount || amount,
        currency: orderResponse.currency || currency,
        name,
        description,
        order_id: orderId,
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || '',
        },
        theme: {
          color: '#1ea085',
        },
        handler: async function (response) {
          // STEP 3: Receive payment response and send to verify endpoint
          setStatusMessage('Verifying payment signature...');
          try {
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan?.id || plan,
            };

            const verifyResult = await apiRequest('/api/verify-payment', {
              method: 'POST',
              token,
              body: verifyPayload,
            });

            if (verifyResult?.success) {
              setStatusMessage('Payment verified successfully!');
              if (onSuccess) {
                onSuccess({
                  ...response,
                  verifyResult,
                });
              }
            } else {
              const err =
                verifyResult?.error || verifyResult?.msg || 'Signature verification failed';
              setErrorMessage(err);
              if (onError) onError(new Error(err));
            }
          } catch (err) {
            const errText = err.message || 'Payment verification request failed';
            setErrorMessage(errText);
            if (onError) onError(err);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            // Handle modal dismiss (user cancelled)
            setStatusMessage('');
            setErrorMessage('Payment cancelled by user');
            setLoading(false);
            if (onDismiss) onDismiss();
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      // Handle payment.failed event
      razorpayInstance.on('payment.failed', function (failureResponse) {
        const failureReason =
          failureResponse.error?.description ||
          failureResponse.error?.reason ||
          'Payment failed. Please try again.';
        setErrorMessage(`Payment failed: ${failureReason}`);
        setLoading(false);
        if (onError) onError(failureResponse.error);
      });

      razorpayInstance.open();
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during checkout initialization');
      if (onError) onError(err);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px' }}>
      <button
        type="button"
        id="razorpay-checkout-button"
        className={className || 'primary-button'}
        onClick={handleCheckout}
        disabled={loading || disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, #0c2340 0%, #1a365d 50%, #1ea085 100%)',
          color: '#ffffff',
          fontWeight: 600,
          padding: '12px 22px',
          borderRadius: '8px',
          border: 'none',
          cursor: loading || disabled ? 'not-allowed' : 'pointer',
          opacity: loading || disabled ? 0.7 : 1,
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(12, 35, 64, 0.2)',
          fontSize: '15px',
          ...style,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ verticalAlign: 'middle' }}
        >
          <path
            d="M13.5 2L5 13H12L10.5 22L19 11H12L13.5 2Z"
            fill="#528FF0"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {loading ? statusMessage || 'Processing...' : buttonText}
      </button>

      {errorMessage && (
        <span
          id="razorpay-error-message"
          style={{
            fontSize: '12px',
            color: '#ef4444',
            display: 'block',
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </span>
      )}

      {statusMessage && !errorMessage && (
        <span
          id="razorpay-status-message"
          style={{
            fontSize: '12px',
            color: '#10b981',
            display: 'block',
            fontWeight: 500,
          }}
        >
          {statusMessage}
        </span>
      )}
    </div>
  );
}

export default RazorpayCheckoutButton;
