import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function LoginPage({ role, title, subtitle, endpoint, allowSignup = false }) {
  const { setRoleToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const incomingToken = searchParams.get('token')
    if (!incomingToken) {
      return
    }

    setRoleToken(role, incomingToken)
    setSearchParams({}, { replace: true })
    navigate(`/${role}/dashboard`, { replace: true })
  }, [navigate, role, searchParams, setRoleToken, setSearchParams])

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: { email, password },
      })

      if (!result?.success || !result?.token) {
        setStatus(result?.msg || 'Login failed')
        return
      }

      setRoleToken(role, result.token)
      navigate(`/${role}/dashboard`, { replace: true })
    } catch (error) {
      setStatus(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="auth-copy">
          <span className="eyebrow">{role} portal</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {status ? <p className="status-line">{status}</p> : null}
          <div className="auth-links">
            <Link to="/signin">Back to portal chooser</Link>
            {allowSignup ? <Link to="/user/signup">Create tenant account</Link> : null}
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
