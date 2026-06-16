import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime } from '../../shared/format'

const tabs = ['Web', 'Payments', 'SMTP', 'CMS', 'Leads', 'Social']

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

function AdminSettingsPage() {
  const { tokens } = useAuth()
  const [activeTab, setActiveTab] = useState('Web')
  const [status, setStatus] = useState('Loading settings...')
  const [web, setWeb] = useState(webDefaults)
  const [payments, setPayments] = useState(paymentDefaults)
  const [smtp, setSmtp] = useState({ email: '', host: '', port: 587, password: '' })
  const [social, setSocial] = useState(socialDefaults)
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
            {['offline_active', 'stripe_active', 'paypal_active', 'rz_active', 'paystack_active'].map((key) => (
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
    </div>
  )
}

export default AdminSettingsPage
