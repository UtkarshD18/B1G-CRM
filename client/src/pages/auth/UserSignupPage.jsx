import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../shared/api'

function UserSignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mobile_with_country_code: '',
    acceptPolicy: true,
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const result = await apiRequest('/api/user/signup', {
        method: 'POST',
        body: form,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Signup failed')
        return
      }

      navigate('/user/login', { replace: true })
    } catch (error) {
      setStatus(error.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="auth-copy">
          <span className="eyebrow">tenant onboarding</span>
          <h1>Create a CRM workspace</h1>
          <p>Match the live pre-purchase funnel with a real signup path instead of a dead shell.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Amina Yusuf"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="owner@company.com"
            />
          </label>
          <label>
            Mobile with country code
            <input
              value={form.mobile_with_country_code}
              onChange={(event) =>
                setForm({ ...form, mobile_with_country_code: event.target.value })
              }
              placeholder="+1 202 555 0184"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Create password"
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.acceptPolicy}
              onChange={(event) => setForm({ ...form, acceptPolicy: event.target.checked })}
            />
            <span>I accept the privacy policy and terms.</span>
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Start workspace'}
          </button>
          {status ? <p className="status-line">{status}</p> : null}
          <div className="auth-links">
            <Link to="/user/login">Already have a tenant account?</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserSignupPage
