import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function UserWebsiteManagerPage() {
  const { tokens } = useAuth()
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [selectedSite, setSelectedSite] = useState(null)
  
  // Customization Form State
  const [widgetForm, setWidgetForm] = useState({
    primaryColor: '#1ea085',
    title: 'Chat with Us',
    greeting: 'Hi! How can we help you today?',
    lead_capture_enabled: true
  })

  const loadWebsites = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiRequest('/api/website/get_all', { token: tokens.user })
      if (result?.success && Array.isArray(result.data)) {
        setWebsites(result.data)
        if (result.data.length > 0 && !selectedSite) {
          selectWebsite(result.data[0])
        }
      } else {
        setStatus(result?.msg || 'Failed to retrieve website integrations.')
      }
    } catch (error) {
      setStatus(error.message || 'Error fetching website integrations.')
    } finally {
      setLoading(false)
    }
  }, [tokens.user, selectedSite])

  useEffect(() => {
    loadWebsites()
  }, [loadWebsites])

  const selectWebsite = (site) => {
    setSelectedSite(site)
    let custom = { primaryColor: '#1ea085', title: 'Chat with Us', greeting: 'Hi! How can we help you today?' }
    if (site.widget_customization) {
      try {
        custom = typeof site.widget_customization === 'string'
          ? JSON.parse(site.widget_customization)
          : site.widget_customization
      } catch (e) {
        console.error(e)
      }
    }
    setWidgetForm({
      primaryColor: custom.primaryColor || '#1ea085',
      title: custom.title || 'Chat with Us',
      greeting: custom.greeting || 'Hi! How can we help you today?',
      lead_capture_enabled: site.lead_capture_enabled === 1
    })
  }

  async function handleAddWebsite(e) {
    e.preventDefault()
    if (!domainInput.trim()) return

    setStatus('Registering domain...')
    try {
      const result = await apiRequest('/api/website/add', {
        method: 'POST',
        token: tokens.user,
        body: { domain: domainInput.trim() }
      })

      if (result?.success) {
        setStatus('Website domain registered.')
        setDomainInput('')
        // Refresh and select the new site
        const newSite = result.data
        setWebsites(prev => [newSite, ...prev])
        selectWebsite(newSite)
      } else {
        setStatus(result?.msg || 'Failed to add website.')
      }
    } catch (error) {
      setStatus(error.message || 'Error adding website domain.')
    }
  }

  async function handleVerifyWebsite() {
    if (!selectedSite) return
    setStatus(`Verifying domain: ${selectedSite.domain}...`)
    try {
      const result = await apiRequest('/api/website/verify', {
        method: 'POST',
        token: tokens.user,
        body: { domain: selectedSite.domain }
      })

      if (result?.success) {
        setStatus(result.msg || 'Website domain verified successfully!')
        // Refresh site data
        const updatedList = websites.map(w => {
          if (w.domain === selectedSite.domain) {
            const up = { ...w, verified: 1 }
            if (selectedSite.id === w.id) {
              setSelectedSite(up)
            }
            return up
          }
          return w
        })
        setWebsites(updatedList)
      } else {
        setStatus(result?.msg || 'Verification failed. Please double check the meta tag presence.')
      }
    } catch (error) {
      setStatus(error.message || 'Error during ownership verification.')
    }
  }

  async function handleSaveWidget(e) {
    e.preventDefault()
    if (!selectedSite) return

    setStatus('Saving widget customization settings...')
    try {
      const result = await apiRequest('/api/website/update_widget', {
        method: 'POST',
        token: tokens.user,
        body: {
          domain: selectedSite.domain,
          widget_customization: {
            primaryColor: widgetForm.primaryColor,
            title: widgetForm.title,
            greeting: widgetForm.greeting
          },
          lead_capture_enabled: widgetForm.lead_capture_enabled
        }
      })

      if (result?.success) {
        setStatus('Widget configurations saved successfully.')
        // Update local list state
        const updated = websites.map(w => {
          if (w.domain === selectedSite.domain) {
            const up = {
              ...w,
              lead_capture_enabled: widgetForm.lead_capture_enabled ? 1 : 0,
              widget_customization: JSON.stringify({
                primaryColor: widgetForm.primaryColor,
                title: widgetForm.title,
                greeting: widgetForm.greeting
              })
            }
            setSelectedSite(up)
            return up
          }
          return w
        })
        setWebsites(updated)
      } else {
        setStatus(result?.msg || 'Failed to save widget settings.')
      }
    } catch (error) {
      setStatus(error.message || 'Error saving widget customization.')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setStatus('Copied snippet to clipboard!')
    window.setTimeout(() => setStatus(''), 3000)
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Integrate widget</span>
          <h2>Website Integrations Manager</h2>
          <p>Add website domains, copy tracking chat widgets, and enable lead pipelines directly from user search actions.</p>
        </div>
      </div>

      {status && <div className="status-line">{status}</div>}

      <div className="two-column-grid">
        {/* Left column: Add website and domain select list */}
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
                onChange={e => setDomainInput(e.target.value)}
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
              <p className="status-line">Retrieving configurations...</p>
            ) : websites.length === 0 ? (
              <p className="muted-copy" style={{ textAlign: 'center', padding: '16px' }}>
                No website domains integrated yet.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {websites.map(site => (
                  <div
                    key={site.id}
                    onClick={() => selectWebsite(site)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: selectedSite?.id === site.id ? '#1ea085' : 'rgba(10, 25, 37, 0.08)',
                      backgroundColor: selectedSite?.id === site.id ? 'rgba(30, 160, 133, 0.08)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <strong>{site.domain}</strong>
                      <div className="muted-copy" style={{ fontSize: '11px' }}>
                        Registered: {new Date(site.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`status-chip ${site.verified === 1 ? 'active' : 'inactive'}`}>
                      {site.verified === 1 ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Details and configuration */}
        {selectedSite ? (
          <div className="panel-stack" style={{ display: 'grid', gap: '24px' }}>
            {/* Verification & Snippets */}
            <div className="panel form-panel">
              <div className="panel-header">
                <h2>Integration Steps ({selectedSite.domain})</h2>
              </div>

              {selectedSite.verified !== 1 ? (
                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.12)' }}>
                  <h4 style={{ color: '#b91c1c', margin: '0 0 8px 0' }}>Ownership Verification Pending</h4>
                  <p className="muted-copy" style={{ fontSize: '13px', margin: '0 0 12px 0' }}>
                    Please add the following meta tag in the <code>&lt;head&gt;</code> section of your site homepage:
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <code style={{ flex: 1, padding: '8px', background: '#eaeaea', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all' }}>
                      {`<meta name="b1gcrm-verification" content="${selectedSite.verification_token}" />`}
                    </code>
                    <button
                      type="button"
                      className="mini-button"
                      onClick={() => copyToClipboard(`<meta name="b1gcrm-verification" content="${selectedSite.verification_token}" />`)}
                    >
                      Copy
                    </button>
                  </div>
                  <button type="button" className="primary-button" onClick={handleVerifyWebsite} style={{ background: '#dc2626' }}>
                    Verify Ownership
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(30, 160, 133, 0.06)', border: '1px solid rgba(30, 160, 133, 0.12)' }}>
                  <h4 style={{ color: '#1ea085', margin: '0 0 4px 0' }}>✓ Domain Verified</h4>
                  <p className="muted-copy" style={{ fontSize: '13px', margin: 0 }}>
                    Domain ownership has been successfully confirmed.
                  </p>
                </div>
              )}

              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>Embed Chat Widget</h4>
                <p className="muted-copy" style={{ fontSize: '13px', margin: '0 0 8px 0' }}>
                  Copy and paste this script tag at the bottom of your website pages (before <code>&lt;/body&gt;</code>) to activate the chat widget:
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <code style={{ flex: 1, padding: '8px', background: '#eaeaea', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all' }}>
                    {selectedSite.tracking_code}
                  </code>
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() => copyToClipboard(selectedSite.tracking_code)}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Widget Customizer Form */}
            <form className="panel form-panel" onSubmit={handleSaveWidget}>
              <div className="panel-header">
                <h2>Widget Customization</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>
                  Primary Color Theme
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <input
                      type="color"
                      value={widgetForm.primaryColor}
                      onChange={e => setWidgetForm({ ...widgetForm, primaryColor: e.target.value })}
                      style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={widgetForm.primaryColor}
                      onChange={e => setWidgetForm({ ...widgetForm, primaryColor: e.target.value })}
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
                    onChange={e => setWidgetForm({ ...widgetForm, title: e.target.value })}
                    placeholder="Chat with Us"
                    required
                  />
                </label>
              </div>

              <label style={{ marginTop: '12px' }}>
                Greeting Welcome Message
                <textarea
                  value={widgetForm.greeting}
                  onChange={e => setWidgetForm({ ...widgetForm, greeting: e.target.value })}
                  placeholder="Hi! How can we help you today?"
                  rows={2}
                  required
                />
              </label>

              <label style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={widgetForm.lead_capture_enabled}
                  onChange={e => setWidgetForm({ ...widgetForm, lead_capture_enabled: e.target.checked })}
                  style={{ width: 'auto' }}
                />
                <span>Enable Pre-Chat Lead Capture Form (Collect visitor Name & Email)</span>
              </label>

              <button className="primary-button" type="submit" style={{ marginTop: '20px' }}>
                Save Widget Design
              </button>
            </form>
          </div>
        ) : (
          <div className="panel form-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <p className="muted-copy">Select a website domain from the list to manage widget settings.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserWebsiteManagerPage
