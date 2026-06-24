import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime } from '../../shared/format'

const tabs = ['Web', 'Payments', 'SMTP', 'CMS', 'Leads', 'Social', 'Deployment', 'Theme', 'Translation', 'Update Web']

const paymentDefaults = {
  pay_offline_id: '',
  pay_offline_key: '',
  offline_active: 0,
  pay_stripe_id: '',
  pay_stripe_key: '',
  stripe_active: 0,
  pay_paypal_id: '',
  pay_paypal_key: '',
  paypal_active: 0,
  rz_id: '',
  rz_key: '',
  rz_active: 0,
  pay_paystack_id: '',
  pay_paystack_key: '',
  paystack_active: 0,
  pay_mercadopago_id: '',
  pay_mercadopago_key: '',
  mercadopago_active: 0,
}

const webDefaults = {
  logo: '',
  app_name: 'B1G CRM',
  custom_home: '',
  is_custom_home: 0,
  meta_description: '',
  currency_code: 'USD',
  currency_symbol: '$',
  home_page_tutorial: '',
  chatbot_screen_tutorial: '',
  broadcast_screen_tutorial: '',
  login_header_footer: '',
  exchange_rate: 1,
}

const socialDefaults = {
  google_client_id: '',
  google_login_active: 0,
  fb_login_app_id: '',
  fb_login_app_sec: '',
  fb_login_active: 0,
}

const deploymentDefaults = {
  meta_app_id: '',
  meta_app_secret: '',
  meta_waba_id: '',
  meta_business_account_id: '',
  meta_access_token: '',
  meta_phone_number_id: '',
  insta_app_id: '',
  insta_app_secret: '',
  insta_business_account_id: '',
  insta_access_token: '',
  ai_provider_active: 'openai',
  ai_openai_key: '',
  ai_openai_model: 'gpt-4o-mini',
  ai_gemini_key: '',
  ai_gemini_model: 'gemini-1.5-flash',
  ai_claude_key: '',
  ai_claude_model: 'claude-3-5-sonnet-20240620',
  ai_openrouter_key: '',
  ai_openrouter_model: '',
  ai_ollama_url: 'http://localhost:11434/v1/chat/completions',
  ai_ollama_model: '',
  ai_custom_url: '',
  ai_custom_model: '',
  widget_domains: '',
}

function AdminSettingsPage() {
  const { tokens } = useAuth()
  const [activeTab, setActiveTab] = useState('Web')
  const [status, setStatus] = useState('Loading settings...')
  const [web, setWeb] = useState(webDefaults)
  const [payments, setPayments] = useState(paymentDefaults)
  const [smtp, setSmtp] = useState({ email: '', host: '', port: 587, password: '' })
  const [social, setSocial] = useState(socialDefaults)
  const [deployment, setDeployment] = useState(deploymentDefaults)
  const [faqs, setFaqs] = useState([])
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' })
  const [testimonials, setTestimonials] = useState([])
  const [testimonialForm, setTestimonialForm] = useState({
    title: '',
    description: '',
    reviewer_name: '',
    reviewer_position: '',
  })
  const [terms, setTerms] = useState({ title: 'Terms and Conditions', content: '' })
  const [privacy, setPrivacy] = useState({ title: 'Privacy Policy', content: '' })
  const [leads, setLeads] = useState([])

  // Theme, Translation & Update States
  const [theme, setTheme] = useState(null)
  const [langs, setLangs] = useState([])
  const [selectedLang, setSelectedLang] = useState('')
  const [langData, setLangData] = useState(null)
  const [newLangName, setNewLangName] = useState('')
  const [langSearch, setLangSearch] = useState('')
  const [editedLangData, setEditedLangData] = useState({})
  const [langPage, setLangPage] = useState(1)

  const [updatePassword, setUpdatePassword] = useState('')
  const [updateQueries, setUpdateQueries] = useState('')
  const [updateNewQueries, setUpdateNewQueries] = useState('')
  const [updateFile, setUpdateFile] = useState(null)

  // Auto detect tab based on URL path
  useEffect(() => {
    const path = window.location.pathname
    if (path.endsWith('/web-theme')) {
      setActiveTab('Theme')
    } else if (path.endsWith('/translation')) {
      setActiveTab('Translation')
    } else if (path.endsWith('/update-web')) {
      setActiveTab('Update Web')
    }
  }, [])

  const loadTheme = useCallback(async () => {
    try {
      const res = await apiRequest('/api/web/get_theme', { token: tokens.admin })
      if (res?.success) {
        setTheme(res.data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [tokens.admin])

  const loadLangs = useCallback(async () => {
    try {
      const res = await apiRequest('/api/web/get-all-translation-name', { token: tokens.admin })
      if (res?.success && Array.isArray(res.data)) {
        const cleanNames = res.data.map(name => name.replace('.json', ''))
        setLangs(cleanNames)
        if (cleanNames.length > 0 && !selectedLang) {
          setSelectedLang(cleanNames[0])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [tokens.admin, selectedLang])

  const loadOneLang = useCallback(async (code) => {
    if (!code) return
    setStatus(`Loading translation for ${code}...`)
    try {
      const res = await apiRequest(`/api/web/get-one-translation?code=${code}`, { token: tokens.admin })
      if (res?.success) {
        setLangData(res.data)
        setEditedLangData(res.data || {})
        setLangPage(1)
        setStatus('')
      } else {
        setStatus(res?.msg || `Unable to load translation for ${code}`)
      }
    } catch (e) {
      setStatus(e.message)
    }
  }, [tokens.admin])

  useEffect(() => {
    if (activeTab === 'Theme' && !theme) {
      loadTheme()
    } else if (activeTab === 'Translation') {
      loadLangs()
    }
  }, [activeTab, theme, loadTheme, loadLangs])

  useEffect(() => {
    if (selectedLang) {
      loadOneLang(selectedLang)
    }
  }, [selectedLang, loadOneLang])

  function handleThemeChange(key, subKey, val) {
    setTheme(prev => {
      if (subKey) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [subKey]: val
          }
        }
      } else {
        return {
          ...prev,
          [key]: val
        }
      }
    })
  }

  async function saveTheme(event) {
    event.preventDefault()
    setStatus('Saving theme settings...')
    try {
      const result = await apiRequest('/api/web/save_theme', {
        method: 'POST',
        token: tokens.admin,
        body: { updatedJson: theme },
      })
      if (result?.success) {
        setStatus('Theme updated successfully.')
      } else {
        setStatus(result?.msg || 'Unable to update theme')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  const filteredKeys = useMemo(() => {
    if (!editedLangData) return []
    const allKeys = Object.keys(editedLangData)
    if (!langSearch) return allKeys
    const q = langSearch.toLowerCase()
    return allKeys.filter(k =>
      k.toLowerCase().includes(q) ||
      String(editedLangData[k] || '').toLowerCase().includes(q)
    )
  }, [editedLangData, langSearch])

  const langPageSize = 50
  const totalPages = Math.ceil(filteredKeys.length / langPageSize) || 1
  const paginatedKeys = useMemo(() => {
    const start = (langPage - 1) * langPageSize
    return filteredKeys.slice(start, start + langPageSize)
  }, [filteredKeys, langPage])

  function handleLangValueChange(key, val) {
    setEditedLangData(prev => ({
      ...prev,
      [key]: val
    }))
  }

  async function saveTranslation(event) {
    event.preventDefault()
    setStatus('Saving translation...')
    try {
      const result = await apiRequest('/api/web/update-one-translation', {
        method: 'POST',
        token: tokens.admin,
        body: { code: selectedLang, updatedjson: editedLangData },
      })
      if (result?.success) {
        setStatus(result.msg || 'Translation saved.')
      } else {
        setStatus(result?.msg || 'Unable to save translation')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  async function addLanguage(event) {
    event.preventDefault()
    if (!newLangName.trim()) return
    setStatus('Adding new language...')
    try {
      const result = await apiRequest('/api/web/add-new-translation', {
        method: 'POST',
        token: tokens.admin,
        body: { newcode: newLangName.trim() },
      })
      if (result?.success) {
        setStatus(result.msg || 'Language added.')
        setNewLangName('')
        loadLangs()
      } else {
        setStatus(result?.msg || 'Unable to add language')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  async function deleteLanguage(code) {
    if (!window.confirm(`Are you sure you want to delete ${code} language?`)) return
    setStatus(`Deleting ${code}...`)
    try {
      const result = await apiRequest('/api/web/del-one-translation', {
        method: 'POST',
        token: tokens.admin,
        body: { code },
      })
      if (result?.success) {
        setStatus(result.msg || 'Language deleted.')
        setSelectedLang('')
        loadLangs()
      } else {
        setStatus(result?.msg || 'Unable to delete language')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  async function handleUpdateApp(event) {
    event.preventDefault()
    if (!updatePassword) {
      setStatus('Admin password is required.')
      return
    }
    setStatus('Updating application codebase...')
    try {
      const formData = new FormData()
      formData.append('password', updatePassword)
      if (updateFile) {
        formData.append('file', updateFile)
      }
      if (updateQueries) {
        formData.append('queries', updateQueries)
      }
      if (updateNewQueries) {
        formData.append('newQueries', updateNewQueries)
      }

      const res = await fetch('/api/web/update_app', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.admin}` },
        body: formData,
      })
      const result = await res.json()
      if (result?.success) {
        setStatus(result.msg || 'App updated successfully.')
        setUpdatePassword('')
        setUpdateFile(null)
      } else {
        setStatus(result?.msg || 'Unable to update app')
      }
    } catch (e) {
      setStatus(e.message)
    }
  }

  const loadSettings = useCallback(async () => {
    setStatus('Loading settings...')
    try {
      const [
        webResult,
        paymentResult,
        smtpResult,
        faqResult,
        testiResult,
        leadResult,
        socialResult,
        termsResult,
        privacyResult,
      ] = await Promise.all([
        apiRequest('/api/admin/get_web_public', { token: tokens.admin }),
        apiRequest('/api/admin/get_payment_gateway_admin', { token: tokens.admin }),
        apiRequest('/api/admin/get_smtp', { token: tokens.admin }),
        apiRequest('/api/admin/get_faq', { token: tokens.admin }),
        apiRequest('/api/admin/get_testi', { token: tokens.admin }),
        apiRequest('/api/admin/get_contact_leads', { token: tokens.admin }),
        apiRequest('/api/admin/get_social_login', { token: tokens.admin }),
        apiRequest('/api/admin/get_page_slug', {
          method: 'POST',
          token: tokens.admin,
          body: { slug: 'terms-and-conditions' },
        }),
        apiRequest('/api/admin/get_page_slug', {
          method: 'POST',
          token: tokens.admin,
          body: { slug: 'privacy-policy' },
        }),
      ])

      setWeb({ ...webDefaults, ...(webResult?.data || {}) })
      setPayments({ ...paymentDefaults, ...(paymentResult?.data || {}) })
      setDeployment({ ...deploymentDefaults, ...(paymentResult?.data || {}) })
      setSmtp({ email: '', host: '', port: 587, password: '', ...(smtpResult?.data || {}) })
      setSocial({ ...socialDefaults, ...(socialResult?.data || {}) })
      setFaqs(Array.isArray(faqResult?.data) ? faqResult.data : [])
      setTestimonials(Array.isArray(testiResult?.data) ? testiResult.data : [])
      setLeads(Array.isArray(leadResult?.data) ? leadResult.data : [])
      if (termsResult?.data?.title) {
        setTerms({ title: termsResult.data.title, content: termsResult.data.content || '' })
      }
      if (privacyResult?.data?.title) {
        setPrivacy({ title: privacyResult.data.title, content: privacyResult.data.content || '' })
      }
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load settings')
    }
  }, [tokens.admin])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  async function saveJson(path, body, message) {
    setStatus(message || 'Saving...')
    try {
      const result = await apiRequest(path, {
        method: 'POST',
        token: tokens.admin,
        body,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to save')
        return false
      }

      setStatus(result.msg || 'Saved.')
      return true
    } catch (error) {
      setStatus(error.message || 'Unable to save')
      return false
    }
  }

  async function addFaq(event) {
    event.preventDefault()
    if (await saveJson('/api/admin/add_faq', faqForm, 'Adding FAQ...')) {
      setFaqForm({ question: '', answer: '' })
      loadSettings()
    }
  }

  async function addTestimonial(event) {
    event.preventDefault()
    if (await saveJson('/api/admin/add_testimonial', testimonialForm, 'Adding testimonial...')) {
      setTestimonialForm({ title: '', description: '', reviewer_name: '', reviewer_position: '' })
      loadSettings()
    }
  }

  async function deleteItem(path, body) {
    if (await saveJson(path, body, 'Deleting...')) {
      loadSettings()
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">admin settings</span>
          <h2>SaaS configuration workspace</h2>
          <p>Manage the operational settings already exposed by the backend.</p>
        </div>
      </div>

      <div className="tab-row">
        {tabs.map((tab) => (
          <button
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      {activeTab === 'Web' ? (
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            saveJson('/api/web/update_web_config', web, 'Saving public web settings...')
          }}
        >
          <div className="panel-header">
            <h2>Public web settings</h2>
          </div>
          <div className="form-grid">
            {[
              ['app_name', 'App name'],
              ['logo', 'Logo filename'],
              ['currency_code', 'Currency code'],
              ['currency_symbol', 'Currency symbol'],
              ['exchange_rate', 'Exchange rate'],
              ['meta_description', 'Meta description'],
              ['home_page_tutorial', 'Home tutorial URL'],
              ['chatbot_screen_tutorial', 'Chatbot tutorial URL'],
              ['broadcast_screen_tutorial', 'Broadcast tutorial URL'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input value={web[key] || ''} onChange={(event) => setWeb({ ...web, [key]: event.target.value })} />
              </label>
            ))}
          </div>
          <label>
            Custom home HTML/content
            <textarea
              rows={6}
              value={web.custom_home || ''}
              onChange={(event) => setWeb({ ...web, custom_home: event.target.value })}
            />
          </label>
          <label>
            Login header/footer content
            <textarea
              rows={4}
              value={web.login_header_footer || ''}
              onChange={(event) => setWeb({ ...web, login_header_footer: event.target.value })}
            />
          </label>
          <label className="checkbox-row">
            <input
              checked={Number(web.is_custom_home) > 0}
              type="checkbox"
              onChange={(event) => setWeb({ ...web, is_custom_home: event.target.checked ? 1 : 0 })}
            />
            <span>Use custom home</span>
          </label>
          <button className="primary-button" type="submit">
            Save web settings
          </button>
        </form>
      ) : null}

      {activeTab === 'Payments' ? (
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            saveJson('/api/admin/update_pay_gateway', payments, 'Saving payment gateways...')
          }}
        >
          <div className="panel-header">
            <h2>Payment gateways</h2>
          </div>
          <div className="form-grid">
            {Object.keys(paymentDefaults)
              .filter((key) => !key.endsWith('_active'))
              .map((key) => (
                <label key={key}>
                  {key.replaceAll('_', ' ')}
                  <input
                    value={payments[key] || ''}
                    onChange={(event) => setPayments({ ...payments, [key]: event.target.value })}
                  />
                </label>
              ))}
          </div>
          <div className="action-row">
            {['offline_active', 'stripe_active', 'paypal_active', 'rz_active', 'paystack_active', 'mercadopago_active'].map((key) => (
              <label className="checkbox-row" key={key}>
                <input
                  checked={Number(payments[key]) > 0}
                  type="checkbox"
                  onChange={(event) => setPayments({ ...payments, [key]: event.target.checked ? 1 : 0 })}
                />
                <span>{key.replace('_active', '')}</span>
              </label>
            ))}
          </div>
          <button className="primary-button" type="submit">
            Save gateways
          </button>
        </form>
      ) : null}

      {activeTab === 'SMTP' ? (
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            saveJson('/api/admin/update_smtp', smtp, 'Saving SMTP...')
          }}
        >
          <div className="panel-header">
            <h2>SMTP settings</h2>
          </div>
          <div className="form-grid">
            {['email', 'host', 'port', 'password'].map((key) => (
              <label key={key}>
                {key}
                <input
                  type={key === 'password' ? 'password' : 'text'}
                  value={smtp[key] || ''}
                  onChange={(event) => setSmtp({ ...smtp, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <button className="primary-button" type="submit">
            Save SMTP
          </button>
        </form>
      ) : null}

      {activeTab === 'CMS' ? (
        <div className="page-stack">
          <div className="two-column-grid">
            <form className="panel form-panel" onSubmit={addFaq}>
              <div className="panel-header">
                <h2>FAQ</h2>
              </div>
              <label>
                Question
                <input
                  value={faqForm.question}
                  onChange={(event) => setFaqForm({ ...faqForm, question: event.target.value })}
                />
              </label>
              <label>
                Answer
                <textarea
                  rows={4}
                  value={faqForm.answer}
                  onChange={(event) => setFaqForm({ ...faqForm, answer: event.target.value })}
                />
              </label>
              <button className="primary-button" type="submit">
                Add FAQ
              </button>
            </form>

            <form className="panel form-panel" onSubmit={addTestimonial}>
              <div className="panel-header">
                <h2>Testimonial</h2>
              </div>
              {Object.keys(testimonialForm).map((key) => (
                <label key={key}>
                  {key.replaceAll('_', ' ')}
                  <input
                    value={testimonialForm[key]}
                    onChange={(event) =>
                      setTestimonialForm({ ...testimonialForm, [key]: event.target.value })
                    }
                  />
                </label>
              ))}
              <button className="primary-button" type="submit">
                Add testimonial
              </button>
            </form>
          </div>

          <div className="two-column-grid">
            <form
              className="panel form-panel"
              onSubmit={(event) => {
                event.preventDefault()
                saveJson('/api/admin/update_terms', terms, 'Saving terms...')
              }}
            >
              <div className="panel-header">
                <h2>Terms</h2>
              </div>
              <input value={terms.title} onChange={(event) => setTerms({ ...terms, title: event.target.value })} />
              <textarea
                rows={8}
                value={terms.content}
                onChange={(event) => setTerms({ ...terms, content: event.target.value })}
              />
              <button className="primary-button" type="submit">
                Save terms
              </button>
            </form>

            <form
              className="panel form-panel"
              onSubmit={(event) => {
                event.preventDefault()
                saveJson('/api/admin/update_privacy_policy', privacy, 'Saving privacy policy...')
              }}
            >
              <div className="panel-header">
                <h2>Privacy policy</h2>
              </div>
              <input value={privacy.title} onChange={(event) => setPrivacy({ ...privacy, title: event.target.value })} />
              <textarea
                rows={8}
                value={privacy.content}
                onChange={(event) => setPrivacy({ ...privacy, content: event.target.value })}
              />
              <button className="primary-button" type="submit">
                Save privacy policy
              </button>
            </form>
          </div>

          <div className="two-column-grid">
            <div className="panel table-panel">
              <div className="panel-header">
                <h2>FAQ list</h2>
              </div>
              <table>
                <tbody>
                  {faqs.map((faq) => (
                    <tr key={faq.id}>
                      <td>{faq.question}</td>
                      <td>
                        <button
                          className="mini-button subtle-danger"
                          type="button"
                          onClick={() => deleteItem('/api/admin/del_faq', { id: faq.id })}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel table-panel">
              <div className="panel-header">
                <h2>Testimonials</h2>
              </div>
              <table>
                <tbody>
                  {testimonials.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.reviewer_name}</td>
                      <td>
                        <button
                          className="mini-button subtle-danger"
                          type="button"
                          onClick={() => deleteItem('/api/admin/del_testi', { id: item.id })}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'Leads' ? (
        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Contact leads</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.mobile}</td>
                  <td>{formatDateTime(lead.createdat || lead.created_at)}</td>
                  <td>
                    <button
                      className="mini-button subtle-danger"
                      type="button"
                      onClick={() => deleteItem('/api/admin/del_cotact_entry', { id: lead.id })}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeTab === 'Social' ? (
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            saveJson('/api/admin/update_social_login', social, 'Saving social login...')
          }}
        >
          <div className="panel-header">
            <h2>Social login</h2>
          </div>
          <div className="form-grid">
            {['google_client_id', 'fb_login_app_id', 'fb_login_app_sec'].map((key) => (
              <label key={key}>
                {key.replaceAll('_', ' ')}
                <input
                  value={social[key] || ''}
                  onChange={(event) => setSocial({ ...social, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <div className="action-row">
            {['google_login_active', 'fb_login_active'].map((key) => (
              <label className="checkbox-row" key={key}>
                <input
                  checked={Number(social[key]) > 0}
                  type="checkbox"
                  onChange={(event) => setSocial({ ...social, [key]: event.target.checked ? 1 : 0 })}
                />
                <span>{key.replaceAll('_', ' ')}</span>
              </label>
            ))}
          </div>
          <button className="primary-button" type="submit">
            Save social login
          </button>
        </form>
      ) : null}
      {activeTab === 'Deployment' ? (
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            saveJson('/api/admin/update_deployment_settings', deployment, 'Saving deployment settings...')
          }}
        >
          <div className="panel-header">
            <h2>Third-Party Integration settings</h2>
            <p>Configure global fallbacks for Meta, Instagram, AI Providers, and Website Widgets.</p>
          </div>
          
          <h3 style={{ marginTop: '16px', color: '#1ea085' }}>Meta WhatsApp API (Global Fallback)</h3>
          <div className="form-grid">
            {[
              ['meta_waba_id', 'WhatsApp Business Account ID (WABA ID)'],
              ['meta_business_account_id', 'Meta Business Account ID'],
              ['meta_phone_number_id', 'Business Phone Number ID'],
              ['meta_app_id', 'Meta App ID'],
              ['meta_app_secret', 'Meta App Secret'],
              ['meta_access_token', 'Meta Access Token'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={key.includes('secret') || key.includes('token') ? 'password' : 'text'}
                  value={deployment[key] || ''}
                  onChange={(event) => setDeployment({ ...deployment, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>

          <h3 style={{ marginTop: '24px', color: '#1ea085' }}>Instagram Messaging API (Global Fallback)</h3>
          <div className="form-grid">
            {[
              ['insta_business_account_id', 'Instagram Business Account ID'],
              ['insta_app_id', 'Instagram App ID'],
              ['insta_app_secret', 'Instagram App Secret'],
              ['insta_access_token', 'Instagram Access Token'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={key.includes('secret') || key.includes('token') ? 'password' : 'text'}
                  value={deployment[key] || ''}
                  onChange={(event) => setDeployment({ ...deployment, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>

          <h3 style={{ marginTop: '24px', color: '#1ea085' }}>Global Fallback AI Autopilot Provider</h3>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <label>
              Active AI Provider
              <select
                value={deployment.ai_provider_active}
                onChange={(event) => setDeployment({ ...deployment, ai_provider_active: event.target.value })}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
                <option value="openrouter">OpenRouter</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="custom">Custom Endpoint</option>
              </select>
            </label>
          </div>
          
          <div className="form-grid" style={{ marginTop: '12px' }}>
            {[
              ['ai_openai_key', 'OpenAI API Key'],
              ['ai_openai_model', 'OpenAI Model (e.g. gpt-4o-mini)'],
              ['ai_gemini_key', 'Gemini API Key'],
              ['ai_gemini_model', 'Gemini Model (e.g. gemini-1.5-flash)'],
              ['ai_claude_key', 'Claude API Key'],
              ['ai_claude_model', 'Claude Model (e.g. claude-3-5-sonnet-20240620)'],
              ['ai_openrouter_key', 'OpenRouter API Key'],
              ['ai_openrouter_model', 'OpenRouter Model'],
              ['ai_ollama_url', 'Ollama Endpoint URL'],
              ['ai_ollama_model', 'Ollama Model'],
              ['ai_custom_url', 'Custom API Endpoint URL'],
              ['ai_custom_model', 'Custom Model Name'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={key.includes('key') ? 'password' : 'text'}
                  value={deployment[key] || ''}
                  onChange={(event) => setDeployment({ ...deployment, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>

          <h3 style={{ marginTop: '24px', color: '#1ea085' }}>Global Website Widgets & Domains</h3>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <label>
              Allowed Widget Domains (comma-separated list, e.g. "example.com, mycrm.com")
              <input
                value={deployment.widget_domains || ''}
                onChange={(event) => setDeployment({ ...deployment, widget_domains: event.target.value })}
                placeholder="example.com, mycrm.com"
              />
            </label>
          </div>

          <button className="primary-button" type="submit" style={{ marginTop: '24px' }}>
            Save Deployment Configuration
          </button>
        </form>
      ) : null}

      {activeTab === 'Theme' && theme ? (
        <form className="panel form-panel" onSubmit={saveTheme}>
          <div className="panel-header">
            <h2>Theme settings</h2>
            <p>Customize system branding colors persisted in theme.json.</p>
          </div>
          <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
            {Object.entries(theme).map(([key, val]) => {
              if (typeof val === 'object' && val !== null) {
                return (
                  <div key={key} className="theme-group-panel" style={{ border: '1px solid rgba(10,25,37,0.06)', borderRadius: '12px', padding: '16px', background: '#fcfcfc' }}>
                    <h3 style={{ textTransform: 'capitalize', color: '#1ea085', margin: '0 0 12px 0', fontSize: '0.95rem' }}>{key} Colors</h3>
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                      {Object.entries(val).map(([subKey, subVal]) => {
                        const isColor = String(subVal).startsWith('#')
                        return (
                          <label key={subKey} style={{ display: 'grid', gap: '6px' }}>
                            <span style={{ textTransform: 'capitalize', fontSize: '0.82rem', fontWeight: 600, color: '#365261' }}>{subKey}</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type={isColor ? 'color' : 'text'}
                                value={subVal || ''}
                                onChange={e => handleThemeChange(key, subKey, e.target.value)}
                                style={{ padding: isColor ? '0' : '8px 12px', height: isColor ? '38px' : 'auto', width: isColor ? '50px' : '100%', border: '1px solid #c5d0d6', borderRadius: '8px', cursor: isColor ? 'pointer' : 'text' }}
                              />
                              {!isColor ? null : (
                                <input
                                  type="text"
                                  value={subVal || ''}
                                  onChange={e => handleThemeChange(key, subKey, e.target.value)}
                                  style={{ padding: '8px 12px', border: '1px solid #c5d0d6', borderRadius: '8px', width: '90px', fontSize: '0.85rem' }}
                                />
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              } else {
                return (
                  <label key={key} style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.82rem', fontWeight: 600, color: '#365261' }}>{key}</span>
                    <input
                      type="text"
                      value={val || ''}
                      onChange={e => handleThemeChange(key, null, e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid #c5d0d6', borderRadius: '8px' }}
                    />
                  </label>
                )
              }
            })}
          </div>
          <button className="primary-button" type="submit" style={{ marginTop: '24px' }}>
            Save Theme Colors
          </button>
        </form>
      ) : null}

      {activeTab === 'Translation' ? (
        <div className="page-stack">
          <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
            <div className="panel" style={{ padding: '20px', borderRadius: '16px' }}>
              <div className="panel-header">
                <h2>Translation roster</h2>
              </div>
              <div style={{ display: 'grid', gap: '16px' }}>
                <label style={{ display: 'grid', gap: '6px' }}>
                  Select dictionary language
                  <select
                    value={selectedLang}
                    onChange={e => setSelectedLang(e.target.value)}
                    style={{ borderRadius: '12px', padding: '10px 14px' }}
                  >
                    <option value="">Select language</option>
                    {langs.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </label>
                
                <form onSubmit={addLanguage} style={{ borderTop: '1px solid rgba(10,25,37,0.06)', paddingTop: '16px', display: 'grid', gap: '12px' }}>
                  <strong>Create new language</strong>
                  <input
                    value={newLangName}
                    onChange={e => setNewLangName(e.target.value)}
                    placeholder="e.g. Spanish"
                    style={{ borderRadius: '12px', padding: '10px 14px' }}
                  />
                  <button className="primary-button" type="submit">➕ Add language</button>
                </form>

                {selectedLang && (
                  <div style={{ borderTop: '1px solid rgba(10,25,37,0.06)', paddingTop: '16px' }}>
                    <button
                      className="primary-button subtle-danger"
                      type="button"
                      onClick={() => deleteLanguage(selectedLang)}
                      style={{ width: '100%' }}
                    >
                      🗑️ Delete {selectedLang}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {selectedLang && langData ? (
              <form className="panel form-panel" style={{ padding: '24px', borderRadius: '16px' }} onSubmit={saveTranslation}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <h2>{selectedLang} Translation Dictionary</h2>
                  <input
                    type="text"
                    value={langSearch}
                    onChange={e => { setLangSearch(e.target.value); setLangPage(1) }}
                    placeholder="Search keys or values..."
                    style={{ width: '200px', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(10,25,37,0.12)', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gap: '14px', maxHeight: '550px', overflowY: 'auto', paddingRight: '6px', margin: '12px 0' }}>
                  {paginatedKeys.map(k => (
                    <label key={k} style={{ display: 'grid', gap: '4px', borderBottom: '1px solid rgba(10,25,37,0.04)', paddingBottom: '8px' }}>
                      <code style={{ fontSize: '0.78rem', color: '#1ea085', fontWeight: 600 }}>{k}</code>
                      <input
                        value={editedLangData[k] || ''}
                        onChange={e => handleLangValueChange(k, e.target.value)}
                        style={{ borderRadius: '10px', padding: '8px 12px', border: '1px solid #c5d0d6', fontSize: '0.88rem' }}
                      />
                    </label>
                  ))}
                  {filteredKeys.length === 0 && (
                    <p className="empty-state">No matching translation keys found.</p>
                  )}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(10,25,37,0.06)', paddingTop: '12px' }}>
                    <button
                      type="button"
                      className="mini-button"
                      disabled={langPage === 1}
                      onClick={() => setLangPage(prev => Math.max(1, prev - 1))}
                    >
                      ◀ Prev
                    </button>
                    <span style={{ fontSize: '0.85rem', color: '#607481' }}>Page {langPage} of {totalPages}</span>
                    <button
                      type="button"
                      className="mini-button"
                      disabled={langPage === totalPages}
                      onClick={() => setLangPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      Next ▶
                    </button>
                  </div>
                )}

                <button className="primary-button" type="submit" style={{ marginTop: '16px', width: '100%' }}>
                  Save Translation Changes
                </button>
              </form>
            ) : (
              <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', borderRadius: '16px' }}>
                <span className="muted-copy">Choose or create a language from the roster to edit its translations.</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'Update Web' ? (
        <form className="panel form-panel" onSubmit={handleUpdateApp} style={{ maxWidth: '650px' }}>
          <div className="panel-header">
            <h2>System Updates & Upgrades</h2>
            <p>Upload a system update package, run migration queries, and keep the application code up to date.</p>
          </div>
          <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
            <label>
              Admin Password (Required)
              <input
                type="password"
                value={updatePassword}
                onChange={e => setUpdatePassword(e.target.value)}
                placeholder="Enter current admin password"
                style={{ borderRadius: '12px', padding: '10px 14px' }}
              />
            </label>
            
            <label style={{ display: 'grid', gap: '6px' }}>
              Select update zip package
              <input
                type="file"
                accept=".zip"
                onChange={e => setUpdateFile(e.target.files?.[0] || null)}
                style={{ border: '1px solid #c5d0d6', borderRadius: '12px', padding: '8px' }}
              />
            </label>

            <label>
              Migration Queries (JSON String Array - Optional)
              <textarea
                rows={4}
                value={updateQueries}
                onChange={e => setUpdateQueries(e.target.value)}
                placeholder='e.g. ["CREATE TABLE IF NOT EXISTS test (id SERIAL PRIMARY KEY)"]'
                style={{ borderRadius: '12px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '13px' }}
              />
            </label>

            <label>
              New Schema Assertion Queries (JSON format - Optional)
              <textarea
                rows={4}
                value={updateNewQueries}
                onChange={e => setUpdateNewQueries(e.target.value)}
                placeholder='e.g. [{"run": "ALTER TABLE users ADD COLUMN age INT", "check": "SELECT column_name FROM information_schema.columns WHERE table_name = \"users\" AND column_name = \"age\""}]'
                style={{ borderRadius: '12px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '13px' }}
              />
            </label>
          </div>
          <button className="primary-button" type="submit" style={{ marginTop: '24px', width: '100%' }}>
            🚀 Deploy Update Package
          </button>
        </form>
      ) : null}
    </div>
  )
}

export default AdminSettingsPage
