import { useCallback, useEffect, useState } from 'react';
import { API_BASE, apiRequest } from '../../shared/api';
import { useAuth } from '../../shared/auth';

const getApiOrigin = () => {
  if (typeof window === 'undefined') return '';
  if (window.__B1GCRM_API_URL__) {
    return window.__B1GCRM_API_URL__.replace(/\/$/, '');
  }
  if (window.location.origin.includes('5173')) {
    return window.location.origin.replace('5173', '3010');
  }
  return window.location.origin;
};

const apiOrigin = getApiOrigin();

const PAYMENT_GATEWAYS = [
  {
    key: 'razorpay',
    label: 'Razorpay',
    icon: '💳',
    publicKeyLabel: 'Key ID',
    secretKeyLabel: 'Key Secret',
  },
  {
    key: 'stripe',
    label: 'Stripe',
    icon: '⚡',
    publicKeyLabel: 'Publishable Key',
    secretKeyLabel: 'Secret Key',
  },
  {
    key: 'paypal',
    label: 'PayPal',
    icon: '🅿️',
    publicKeyLabel: 'Client ID',
    secretKeyLabel: 'Client Secret',
  },
  {
    key: 'cashfree',
    label: 'Cashfree',
    icon: '🏦',
    publicKeyLabel: 'App ID',
    secretKeyLabel: 'Secret Key',
  },
  {
    key: 'payu',
    label: 'PayU',
    icon: '💰',
    publicKeyLabel: 'Merchant Key',
    secretKeyLabel: 'Salt',
  },
  {
    key: 'ccavenue',
    label: 'CCAvenue',
    icon: '🔐',
    publicKeyLabel: 'Merchant ID',
    secretKeyLabel: 'Working Key',
  },
];

const CONFIG_CATEGORIES = ['general', 'seo', 'theme', 'shipping', 'social', 'custom'];

function UserWebsiteManagerPage() {
  const { tokens } = useAuth();
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [activeTab, setActiveTab] = useState('widget'); // 'widget' | 'settings' | 'payments'

  const userPayload = tokens.user ? JSON.parse(atob(tokens.user.split('.')[1])) : null;
  const userUid = userPayload?.uid || 'local-user-uid';
  const dynamicTrackingCode = selectedSite
    ? `<script src="${apiOrigin}/api/website/widget/script?uid=${userUid}&domain=${selectedSite.domain}"></script>`
    : '';

  // Widget form
  const [widgetForm, setWidgetForm] = useState({
    primaryColor: '#1ea085',
    title: 'Chat with Us',
    greeting: 'Hi! How can we help you today?',
    lead_capture_enabled: true,
    actionButtons: [],
  });

  // Remote config
  const [siteConfigs, setSiteConfigs] = useState([]);
  const [configForm, setConfigForm] = useState({
    config_key: '',
    config_value: '',
    config_type: 'text',
    is_secret: false,
    label: '',
    category: 'general',
  });
  const [editingConfig, setEditingConfig] = useState(null);

  // Payment config
  const [paymentConfigs, setPaymentConfigs] = useState({});
  const [paymentForms, setPaymentForms] = useState({});

  const loadWebsites = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiRequest('/api/website/get_all', { token: tokens.user });
      if (result?.success && Array.isArray(result.data)) {
        setWebsites(result.data);
        if (result.data.length > 0 && !selectedSite) {
          selectWebsite(result.data[0]);
        }
      } else {
        setStatus(result?.msg || 'Failed to retrieve website integrations.');
      }
    } catch (error) {
      setStatus(error.message || 'Error fetching website integrations.');
    } finally {
      setLoading(false);
    }
  }, [tokens.user, selectedSite]);

  useEffect(() => {
    loadWebsites();
  }, [loadWebsites]);

  async function loadSiteConfigs(siteId) {
    try {
      const res = await apiRequest(`/api/website/site-config/${siteId}`, { token: tokens.user });
      if (res?.success) setSiteConfigs(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPaymentConfigs(siteId) {
    try {
      const res = await apiRequest(`/api/website/site-payment/${siteId}`, { token: tokens.user });
      if (res?.success) {
        const map = {};
        const forms = {};
        (res.data || []).forEach((g) => {
          map[g.gateway] = g;
          forms[g.gateway] = {
            is_active: g.is_active,
            is_live_mode: g.is_live_mode,
            public_key: g.public_key || '',
            secret_key: '',
            webhook_secret: '',
          };
        });
        setPaymentConfigs(map);
        setPaymentForms(forms);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function selectWebsite(site) {
    setSelectedSite(site);
    let custom = {
      primaryColor: '#1ea085',
      title: 'Chat with Us',
      greeting: 'Hi! How can we help you today?',
      actionButtons: [],
    };
    if (site.widget_customization) {
      try {
        custom =
          typeof site.widget_customization === 'string'
            ? JSON.parse(site.widget_customization)
            : site.widget_customization;
      } catch (e) {
        console.error(e);
      }
    }
    setWidgetForm({
      primaryColor: custom.primaryColor || '#1ea085',
      title: custom.title || 'Chat with Us',
      greeting: custom.greeting || 'Hi! How can we help you today?',
      lead_capture_enabled: site.lead_capture_enabled === 1,
      actionButtons: custom.actionButtons || [],
    });
    loadSiteConfigs(site.id);
    loadPaymentConfigs(site.id);
  }

  const addActionButton = (type) => {
    const newBtn = {
      id: Date.now(),
      type,
      label:
        type === 'track_order'
          ? 'Track Order'
          : type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      url: '',
      imageUrl: '',
      videoUrl: '',
    };
    setWidgetForm((prev) => ({ ...prev, actionButtons: [...(prev.actionButtons || []), newBtn] }));
  };

  const removeActionButton = (id) => {
    setWidgetForm((prev) => ({
      ...prev,
      actionButtons: (prev.actionButtons || []).filter((btn) => btn.id !== id),
    }));
  };

  const updateActionButton = (id, field, value) => {
    setWidgetForm((prev) => ({
      ...prev,
      actionButtons: (prev.actionButtons || []).map((btn) =>
        btn.id === id ? { ...btn, [field]: value } : btn,
      ),
    }));
  };

  async function handleAddWebsite(e) {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setStatus('Registering domain...');
    try {
      const result = await apiRequest('/api/website/add', {
        method: 'POST',
        token: tokens.user,
        body: { domain: domainInput.trim() },
      });
      if (result?.success) {
        setStatus('Website domain registered.');
        setDomainInput('');
        const newSite = result.data;
        setWebsites((prev) => [newSite, ...prev]);
        selectWebsite(newSite);
      } else {
        setStatus(result?.msg || 'Failed to add website.');
      }
    } catch (error) {
      setStatus(error.message || 'Error adding website domain.');
    }
  }

  async function handleVerifyWebsite() {
    if (!selectedSite) return;
    setStatus(`Verifying domain: ${selectedSite.domain}...`);
    try {
      const result = await apiRequest('/api/website/verify', {
        method: 'POST',
        token: tokens.user,
        body: { domain: selectedSite.domain },
      });
      if (result?.success) {
        setStatus(result.msg || 'Domain verified!');
        const updatedList = websites.map((w) => {
          if (w.domain === selectedSite.domain) {
            const up = { ...w, verified: 1 };
            if (selectedSite.id === w.id) setSelectedSite(up);
            return up;
          }
          return w;
        });
        setWebsites(updatedList);
      } else {
        setStatus(result?.msg || 'Verification failed. Check meta tag presence.');
      }
    } catch (error) {
      setStatus(error.message || 'Error during verification.');
    }
  }

  async function handleSaveWidget(e) {
    e.preventDefault();
    if (!selectedSite) return;
    setStatus('Saving widget settings...');
    try {
      const result = await apiRequest('/api/website/update_widget', {
        method: 'POST',
        token: tokens.user,
        body: {
          domain: selectedSite.domain,
          widget_customization: {
            primaryColor: widgetForm.primaryColor,
            title: widgetForm.title,
            greeting: widgetForm.greeting,
            actionButtons: widgetForm.actionButtons || [],
          },
          lead_capture_enabled: widgetForm.lead_capture_enabled,
        },
      });
      if (result?.success) {
        setStatus('Widget configurations saved!');
        const updated = websites.map((w) => {
          if (w.domain === selectedSite.domain) {
            const up = {
              ...w,
              lead_capture_enabled: widgetForm.lead_capture_enabled ? 1 : 0,
              widget_customization: JSON.stringify({
                primaryColor: widgetForm.primaryColor,
                title: widgetForm.title,
                greeting: widgetForm.greeting,
                actionButtons: widgetForm.actionButtons || [],
              }),
            };
            setSelectedSite(up);
            return up;
          }
          return w;
        });
        setWebsites(updated);
      } else {
        setStatus(result?.msg || 'Failed to save widget settings.');
      }
    } catch (error) {
      setStatus(error.message || 'Error saving widget customization.');
    }
  }

  async function handleSaveConfig(e) {
    e.preventDefault();
    if (!selectedSite) return;
    setStatus('Saving config...');
    try {
      const res = await apiRequest('/api/website/site-config/save', {
        method: 'POST',
        token: tokens.user,
        body: { siteId: selectedSite.id, ...configForm },
      });
      if (res?.success) {
        setStatus('Config saved!');
        setConfigForm({
          config_key: '',
          config_value: '',
          config_type: 'text',
          is_secret: false,
          label: '',
          category: 'general',
        });
        setEditingConfig(null);
        loadSiteConfigs(selectedSite.id);
      } else {
        setStatus(res?.msg || 'Failed to save config');
      }
    } catch (e) {
      setStatus(e.message);
    }
  }

  async function handleDeleteConfig(configId) {
    if (!selectedSite || !window.confirm('Delete this config key?')) return;
    await apiRequest('/api/website/site-config/delete', {
      method: 'POST',
      token: tokens.user,
      body: { siteId: selectedSite.id, configId },
    });
    loadSiteConfigs(selectedSite.id);
  }

  function startEditConfig(cfg) {
    setConfigForm({
      config_key: cfg.config_key,
      config_value: '',
      config_type: cfg.config_type,
      is_secret: cfg.is_secret,
      label: cfg.label,
      category: cfg.category,
    });
    setEditingConfig(cfg.id);
  }

  async function handleSavePayment(gateway) {
    if (!selectedSite) return;
    const form = paymentForms[gateway] || {};
    setStatus(`Saving ${gateway}...`);
    try {
      const res = await apiRequest('/api/website/site-payment/save', {
        method: 'POST',
        token: tokens.user,
        body: { siteId: selectedSite.id, gateway, ...form },
      });
      if (res?.success) {
        setStatus(`${gateway} saved!`);
        loadPaymentConfigs(selectedSite.id);
      } else {
        setStatus(res?.msg || 'Failed to save');
      }
    } catch (e) {
      setStatus(e.message);
    }
  }

  function updatePaymentForm(gateway, field, value) {
    setPaymentForms((prev) => ({ ...prev, [gateway]: { ...prev[gateway], [field]: value } }));
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setStatus('Copied!');
    window.setTimeout(() => setStatus(''), 2000);
  };

  const apiSnippet = selectedSite
    ? `// Fetch your site config from B1GCRM
const res = await fetch('${apiOrigin}/api/website/remote-config/${selectedSite.verification_token}');
const { config, payments } = await res.json();

// Use in your MERN app:
// config.site_name, config.primary_color, etc.
// payments.razorpay.public_key, payments.stripe.public_key, etc.`
    : '';

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">site manager</span>
          <h2>Website Integrations Manager</h2>
          <p>
            Register your site, embed the chat widget, manage site settings, and configure payment
            gateways remotely.
          </p>
        </div>
      </div>

      {status && <div className="status-line">{status}</div>}

      <div className="two-column-grid">
        {/* Left column */}
        <div className="panel-stack" style={{ display: 'grid', gap: '24px' }}>
          <form className="panel form-panel" onSubmit={handleAddWebsite}>
            <div className="panel-header">
              <h2>Add Website</h2>
            </div>
            <label>
              Website Domain
              <input
                type="text"
                placeholder="example.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
              />
            </label>
            <button className="primary-button" type="submit" style={{ marginTop: '12px' }}>
              Register Domain
            </button>
          </form>

          <div className="panel form-panel">
            <div className="panel-header">
              <h2>My Websites</h2>
            </div>
            {loading ? (
              <p className="status-line">Loading...</p>
            ) : websites.length === 0 ? (
              <p className="muted-copy" style={{ textAlign: 'center', padding: '16px' }}>
                No website domains integrated yet.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {websites.map((site) => (
                  <div
                    key={site.id}
                    onClick={() => selectWebsite(site)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: selectedSite?.id === site.id ? '#1ea085' : 'var(--border-color)',
                      backgroundColor:
                        selectedSite?.id === site.id ? 'rgba(30,160,133,0.08)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      <strong>{site.domain}</strong>
                      <div className="muted-copy" style={{ fontSize: '11px' }}>
                        Registered: {new Date(site.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`status-chip ${site.verified === 1 ? 'active' : 'inactive'}`}
                      style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                    >
                      {site.verified === 1 ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        {selectedSite ? (
          <div style={{ display: 'grid', gap: '24px', alignContent: 'start' }}>
            {/* Tab Navigation */}
            <div
              style={{
                display: 'flex',
                gap: '0',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                width: 'fit-content',
              }}
            >
              {[
                { key: 'widget', label: '🎨 Widget' },
                { key: 'settings', label: '⚙️ Site Settings' },
                { key: 'payments', label: '💳 Payments' },
                { key: 'embed', label: '📦 API & Embed' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '10px 18px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab.key ? 700 : 400,
                    background: activeTab === tab.key ? '#1ea085' : 'var(--bg-panel)',
                    color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ─── WIDGET TAB ─── */}
            {activeTab === 'widget' && (
              <>
                {/* Verification */}
                <div className="panel form-panel">
                  <div className="panel-header">
                    <h2>Integration ({selectedSite.domain})</h2>
                  </div>
                  {selectedSite.verified !== 1 ? (
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(220,38,38,0.06)',
                        border: '1px solid rgba(220,38,38,0.12)',
                      }}
                    >
                      <h4 style={{ color: '#b91c1c', margin: '0 0 8px 0' }}>
                        Ownership Verification Pending
                      </h4>
                      <p className="muted-copy" style={{ fontSize: '13px', margin: '0 0 10px 0' }}>
                        Add this meta tag in your site's &lt;head&gt;:
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <code
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: 'rgba(0,0,0,0.06)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            wordBreak: 'break-all',
                          }}
                        >
                          {`<meta name="b1gcrm-verification" content="${selectedSite.verification_token}" />`}
                        </code>
                        <button
                          type="button"
                          className="mini-button"
                          onClick={() =>
                            copyToClipboard(
                              `<meta name="b1gcrm-verification" content="${selectedSite.verification_token}" />`,
                            )
                          }
                        >
                          Copy
                        </button>
                      </div>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={handleVerifyWebsite}
                        style={{ background: '#dc2626' }}
                      >
                        Verify Ownership
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(30,160,133,0.06)',
                        border: '1px solid rgba(30,160,133,0.12)',
                      }}
                    >
                      <h4 style={{ color: '#1ea085', margin: '0 0 4px 0' }}>✓ Domain Verified</h4>
                      <p className="muted-copy" style={{ fontSize: '13px', margin: 0 }}>
                        Domain ownership confirmed.
                      </p>
                    </div>
                  )}
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ margin: '0 0 6px 0' }}>Embed Chat Widget</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <code
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: 'rgba(0,0,0,0.06)',
                          borderRadius: '6px',
                          fontSize: '11px',
                          wordBreak: 'break-all',
                        }}
                      >
                        {dynamicTrackingCode}
                      </code>
                      <button
                        type="button"
                        className="mini-button"
                        onClick={() => copyToClipboard(dynamicTrackingCode)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Widget Customizer */}
                <form className="panel form-panel" onSubmit={handleSaveWidget}>
                  <div className="panel-header">
                    <h2>Widget Customization</h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <label>
                      Primary Color Theme
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          marginTop: '4px',
                        }}
                      >
                        <input
                          type="color"
                          value={widgetForm.primaryColor}
                          onChange={(e) =>
                            setWidgetForm({ ...widgetForm, primaryColor: e.target.value })
                          }
                          style={{
                            width: '40px',
                            height: '40px',
                            padding: 0,
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        />
                        <input
                          type="text"
                          value={widgetForm.primaryColor}
                          onChange={(e) =>
                            setWidgetForm({ ...widgetForm, primaryColor: e.target.value })
                          }
                          placeholder="#1ea085"
                          style={{ flex: 1 }}
                        />
                      </div>
                    </label>
                    <label>
                      Widget Header Title
                      <input
                        type="text"
                        value={widgetForm.title}
                        onChange={(e) => setWidgetForm({ ...widgetForm, title: e.target.value })}
                        placeholder="Chat with Us"
                        required
                      />
                    </label>
                  </div>
                  <label style={{ marginTop: '12px' }}>
                    Greeting Message
                    <textarea
                      value={widgetForm.greeting}
                      onChange={(e) => setWidgetForm({ ...widgetForm, greeting: e.target.value })}
                      placeholder="Hi! How can we help you today?"
                      rows={2}
                      required
                    />
                  </label>

                  <div
                    style={{
                      marginTop: '20px',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '20px',
                    }}
                  >
                    <h4 style={{ margin: '0 0 4px 0' }}>Widget Quick Action Buttons</h4>
                    <p className="muted-copy" style={{ fontSize: '12px', margin: '0 0 12px 0' }}>
                      Interactive cards shown in the chat widget welcome screen.
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {['track_order', 'product_info', 'catalog', 'new_launches', 'custom'].map(
                        (t) => (
                          <button
                            key={t}
                            type="button"
                            className="mini-button"
                            onClick={() => addActionButton(t)}
                          >
                            + {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </button>
                        ),
                      )}
                    </div>
                    <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                      {(widgetForm.actionButtons || []).map((btn) => (
                        <div
                          key={btn.id}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-panel)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: '#1ea085',
                              }}
                            >
                              {btn.type.replace(/_/g, ' ')}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeActionButton(btn.id)}
                              style={{
                                padding: '2px 8px',
                                background: '#e11d48',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '10px',
                                cursor: 'pointer',
                              }}
                            >
                              Remove
                            </button>
                          </div>
                          <div
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}
                          >
                            <label style={{ fontSize: '11px', margin: 0 }}>
                              Button Label
                              <input
                                type="text"
                                value={btn.label}
                                onChange={(e) =>
                                  updateActionButton(btn.id, 'label', e.target.value)
                                }
                                style={{ padding: '6px', fontSize: '12px', marginTop: '2px' }}
                                required
                              />
                            </label>
                            {btn.type !== 'track_order' && (
                              <label style={{ fontSize: '11px', margin: 0 }}>
                                Link URL
                                <input
                                  type="url"
                                  value={btn.url}
                                  onChange={(e) =>
                                    updateActionButton(btn.id, 'url', e.target.value)
                                  }
                                  placeholder="https://"
                                  style={{ padding: '6px', fontSize: '12px', marginTop: '2px' }}
                                />
                              </label>
                            )}
                            <label style={{ fontSize: '11px', margin: 0 }}>
                              Image URL (optional)
                              <input
                                type="url"
                                value={btn.imageUrl}
                                onChange={(e) =>
                                  updateActionButton(btn.id, 'imageUrl', e.target.value)
                                }
                                placeholder="https://...image.png"
                                style={{ padding: '6px', fontSize: '12px', marginTop: '2px' }}
                              />
                            </label>
                            <label style={{ fontSize: '11px', margin: 0 }}>
                              Video URL (optional)
                              <input
                                type="url"
                                value={btn.videoUrl}
                                onChange={(e) =>
                                  updateActionButton(btn.id, 'videoUrl', e.target.value)
                                }
                                placeholder="https://...video.mp4"
                                style={{ padding: '6px', fontSize: '12px', marginTop: '2px' }}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label
                    style={{
                      marginTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={widgetForm.lead_capture_enabled}
                      onChange={(e) =>
                        setWidgetForm({ ...widgetForm, lead_capture_enabled: e.target.checked })
                      }
                      style={{ width: 'auto' }}
                    />
                    <span>Enable Pre-Chat Lead Capture Form (Collect visitor Name & Email)</span>
                  </label>
                  <button className="primary-button" type="submit" style={{ marginTop: '20px' }}>
                    Save Widget Design
                  </button>
                </form>
              </>
            )}

            {/* ─── SITE SETTINGS TAB ─── */}
            {activeTab === 'settings' && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div
                  className="panel"
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    background:
                      'linear-gradient(135deg, rgba(30,160,133,0.06), rgba(9,132,227,0.04))',
                    border: '1px solid rgba(30,160,133,0.15)',
                  }}
                >
                  <strong>🔧 Remote Site Configuration</strong>
                  <p className="muted-copy" style={{ margin: '6px 0 0', fontSize: '0.88rem' }}>
                    Define any key-value config for your site (colors, labels, feature flags,
                    shipping zones, etc.). Your MERN/Next.js site fetches these at runtime from the
                    Public Config API — no redeploy needed.
                  </p>
                </div>

                <form className="panel form-panel" onSubmit={handleSaveConfig}>
                  <div className="panel-header">
                    <h2>{editingConfig ? 'Edit Config Key' : 'Add Config Key'}</h2>
                    {editingConfig && (
                      <button
                        type="button"
                        className="mini-button"
                        onClick={() => {
                          setEditingConfig(null);
                          setConfigForm({
                            config_key: '',
                            config_value: '',
                            config_type: 'text',
                            is_secret: false,
                            label: '',
                            category: 'general',
                          });
                        }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label>
                      Key Name <span style={{ color: '#ef4444' }}>*</span>
                      <input
                        type="text"
                        value={configForm.config_key}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            config_key: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                          })
                        }
                        placeholder="e.g. primary_color"
                        required
                        disabled={!!editingConfig}
                      />
                    </label>
                    <label>
                      Display Label
                      <input
                        type="text"
                        value={configForm.label}
                        onChange={(e) => setConfigForm({ ...configForm, label: e.target.value })}
                        placeholder="e.g. Primary Brand Color"
                      />
                    </label>
                    <label>
                      Value <span style={{ color: '#ef4444' }}>*</span>
                      <input
                        type="text"
                        value={configForm.config_value}
                        onChange={(e) =>
                          setConfigForm({ ...configForm, config_value: e.target.value })
                        }
                        placeholder="Enter value"
                        required
                      />
                    </label>
                    <label>
                      Type
                      <select
                        value={configForm.config_type}
                        onChange={(e) =>
                          setConfigForm({ ...configForm, config_type: e.target.value })
                        }
                      >
                        {['text', 'color', 'url', 'number', 'boolean', 'json'].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Category
                      <select
                        value={configForm.category}
                        onChange={(e) => setConfigForm({ ...configForm, category: e.target.value })}
                      >
                        {CONFIG_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={configForm.is_secret}
                        onChange={(e) =>
                          setConfigForm({ ...configForm, is_secret: e.target.checked })
                        }
                        style={{ width: 'auto' }}
                      />
                      <span style={{ fontSize: '0.88rem' }}>
                        Secret (masked, not in public API)
                      </span>
                    </label>
                  </div>
                  <button className="primary-button" type="submit" style={{ marginTop: '12px' }}>
                    {editingConfig ? 'Update Config' : 'Add Config Key'}
                  </button>
                </form>

                <div className="panel table-panel">
                  <div className="panel-header">
                    <h2>Configured Keys ({siteConfigs.length})</h2>
                  </div>
                  {siteConfigs.length === 0 ? (
                    <p className="muted-copy" style={{ padding: '20px', textAlign: 'center' }}>
                      No config keys yet. Add your first one above.
                    </p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>Label</th>
                          <th>Value</th>
                          <th>Type</th>
                          <th>Category</th>
                          <th>Secret</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {siteConfigs.map((cfg) => (
                          <tr key={cfg.id}>
                            <td>
                              <code style={{ fontSize: '0.82rem' }}>{cfg.config_key}</code>
                            </td>
                            <td>{cfg.label}</td>
                            <td
                              style={{
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {cfg.config_value}
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 6px',
                                  background: 'rgba(30,160,133,0.1)',
                                  borderRadius: '4px',
                                  color: '#1ea085',
                                }}
                              >
                                {cfg.config_type}
                              </span>
                            </td>
                            <td>{cfg.category}</td>
                            <td>{cfg.is_secret ? '🔒' : '🌐'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="mini-button"
                                  onClick={() => startEditConfig(cfg)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="mini-button subtle-danger"
                                  onClick={() => handleDeleteConfig(cfg.id)}
                                >
                                  Del
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ─── PAYMENTS TAB ─── */}
            {activeTab === 'payments' && (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div
                  className="panel"
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    background:
                      'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(30,160,133,0.04))',
                    border: '1px solid rgba(99,102,241,0.15)',
                  }}
                >
                  <strong>💳 Payment Gateway Manager</strong>
                  <p className="muted-copy" style={{ margin: '6px 0 0', fontSize: '0.88rem' }}>
                    Configure payment gateways for your integrated site. Public keys are exposed via
                    the Remote Config API — secret keys are encrypted and never exposed publicly.
                    Toggle Live/Test mode without touching your site code.
                  </p>
                </div>

                {PAYMENT_GATEWAYS.map((gw) => {
                  const saved = paymentConfigs[gw.key] || {};
                  const form = paymentForms[gw.key] || {
                    is_active: false,
                    is_live_mode: false,
                    public_key: '',
                    secret_key: '',
                    webhook_secret: '',
                  };
                  const isActive = form.is_active;

                  return (
                    <div
                      key={gw.key}
                      className="panel form-panel"
                      style={{
                        border: isActive
                          ? '1px solid rgba(30,160,133,0.3)'
                          : '1px solid var(--border-color)',
                      }}
                    >
                      <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.4rem' }}>{gw.icon}</span>
                          <div>
                            <strong style={{ fontSize: '1rem' }}>{gw.label}</strong>
                            {saved.id && (
                              <div
                                style={{ fontSize: '0.75rem', color: '#1ea085', marginTop: '2px' }}
                              >
                                ✓ Configured
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              margin: 0,
                              fontWeight: 400,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={!!form.is_live_mode}
                              onChange={(e) =>
                                updatePaymentForm(gw.key, 'is_live_mode', e.target.checked)
                              }
                              style={{ width: 'auto' }}
                            />
                            Live Mode
                          </label>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              margin: 0,
                              fontWeight: 400,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={!!form.is_active}
                              onChange={(e) =>
                                updatePaymentForm(gw.key, 'is_active', e.target.checked)
                              }
                              style={{ width: 'auto' }}
                            />
                            Enable
                          </label>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <label>
                          {gw.publicKeyLabel} (Public)
                          <input
                            type="text"
                            value={form.public_key || ''}
                            onChange={(e) =>
                              updatePaymentForm(gw.key, 'public_key', e.target.value)
                            }
                            placeholder={`Enter ${gw.publicKeyLabel}`}
                          />
                        </label>
                        <label>
                          {gw.secretKeyLabel} (Secret)
                          <input
                            type="password"
                            value={form.secret_key || ''}
                            onChange={(e) =>
                              updatePaymentForm(gw.key, 'secret_key', e.target.value)
                            }
                            placeholder={
                              saved.id ? '••••••• (unchanged)' : `Enter ${gw.secretKeyLabel}`
                            }
                            autoComplete="new-password"
                          />
                        </label>
                        <label>
                          Webhook Secret (optional)
                          <input
                            type="password"
                            value={form.webhook_secret || ''}
                            onChange={(e) =>
                              updatePaymentForm(gw.key, 'webhook_secret', e.target.value)
                            }
                            placeholder={saved.id ? '••••••• (unchanged)' : 'Enter webhook secret'}
                            autoComplete="new-password"
                          />
                        </label>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => handleSavePayment(gw.key)}
                            style={{ width: '100%' }}
                          >
                            Save {gw.label}
                          </button>
                        </div>
                      </div>

                      {form.is_live_mode && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            fontSize: '0.82rem',
                            color: '#dc2626',
                          }}
                        >
                          ⚠️ <strong>Live Mode ON</strong> — Real transactions will be processed.
                          Make sure credentials are production keys.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── API & EMBED TAB ─── */}
            {activeTab === 'embed' && (
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Section A */}
                <div className="panel form-panel">
                  <div className="panel-header">
                    <h2>🔑 Step A: Domain Verification Meta Tag</h2>
                  </div>
                  <p className="muted-copy" style={{ fontSize: '0.9rem' }}>
                    Paste this meta tag inside your website's header to verify domain ownership.
                  </p>
                  <label style={{ fontSize: '0.85rem' }}>
                    <strong>File to modify:</strong> Paste inside <code>index.html</code> (within
                    the <code>&lt;head&gt;</code> section) or your root layout/header file.
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <code
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: 'rgba(0,0,0,0.06)',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      {`<meta name="b1gcrm-verification" content="${selectedSite.verification_token}" />`}
                    </code>
                    <button
                      type="button"
                      className="mini-button"
                      onClick={() =>
                        copyToClipboard(
                          `<meta name="b1gcrm-verification" content="${selectedSite.verification_token}" />`,
                        )
                      }
                    >
                      Copy Tag
                    </button>
                  </div>
                </div>

                {/* Section B */}
                <div className="panel form-panel">
                  <div className="panel-header">
                    <h2>💬 Step B: Embed Chat Widget Script</h2>
                  </div>
                  <p className="muted-copy" style={{ fontSize: '0.9rem' }}>
                    Copy and paste this script tag on your website to render the live chat widget.
                  </p>
                  <label style={{ fontSize: '0.85rem' }}>
                    <strong>File to modify:</strong> Paste inside <code>index.html</code> (just
                    before the closing <code>&lt;/body&gt;</code> tag) or your global footer file.
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <code
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: 'rgba(0,0,0,0.06)',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      {dynamicTrackingCode}
                    </code>
                    <button
                      type="button"
                      className="mini-button"
                      onClick={() => copyToClipboard(dynamicTrackingCode)}
                    >
                      Copy Script
                    </button>
                  </div>
                </div>

                {/* Section C */}
                <div className="panel form-panel">
                  <div className="panel-header">
                    <h2>🔗 Step C: Public Remote Config API</h2>
                  </div>
                  <p className="muted-copy" style={{ fontSize: '0.9rem' }}>
                    Fetch non-secret configuration variables and active payment gateway public keys
                    dynamically from your CRM at runtime.
                  </p>
                  <label style={{ fontSize: '0.85rem' }}>
                    API Endpoint (GET)
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <code
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          background: 'rgba(0,0,0,0.06)',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        {apiOrigin}/api/website/remote-config/{selectedSite.verification_token}
                      </code>
                      <button
                        type="button"
                        className="mini-button"
                        onClick={() =>
                          copyToClipboard(
                            `${apiOrigin}/api/website/remote-config/${selectedSite.verification_token}`,
                          )
                        }
                      >
                        Copy Endpoint
                      </button>
                    </div>
                  </label>
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.85rem' }}>
                      Integration Code Snippet (Paste inside your React / Next.js initialization
                      files like <code>App.js</code> or <code>index.js</code>):
                    </p>
                    <div style={{ position: 'relative' }}>
                      <pre
                        style={{
                          background: '#10212d',
                          color: '#a8ff78',
                          padding: '16px',
                          borderRadius: '10px',
                          fontSize: '0.78rem',
                          overflow: 'auto',
                          margin: 0,
                          lineHeight: 1.6,
                        }}
                      >
                        {apiSnippet}
                      </pre>
                      <button
                        type="button"
                        className="mini-button"
                        onClick={() => copyToClipboard(apiSnippet)}
                        style={{ position: 'absolute', top: '10px', right: '10px' }}
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="panel form-panel"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(30,160,133,0.04), rgba(9,132,227,0.04))',
                    border: '1px solid rgba(30,160,133,0.15)',
                  }}
                >
                  <div className="panel-header">
                    <h2>🏗️ Supported Tech Stacks</h2>
                  </div>
                  <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}
                  >
                    {[
                      'MERN Stack',
                      'Next.js',
                      'React + Vite',
                      'Vue.js',
                      'Angular',
                      'Nuxt.js',
                      'Svelte',
                      'Remix',
                      'Plain HTML/JS',
                    ].map((stack) => (
                      <div
                        key={stack}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.85rem',
                          textAlign: 'center',
                        }}
                      >
                        {stack}
                      </div>
                    ))}
                  </div>
                  <p className="muted-copy" style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                    Since the API is a simple public GET endpoint with CORS enabled, it works
                    seamlessly with any tech stack that can make HTTP requests.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="panel form-panel"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
            }}
          >
            <p className="muted-copy">Select a website from the list to manage settings.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserWebsiteManagerPage;
