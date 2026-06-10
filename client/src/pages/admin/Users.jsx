import { useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function AdminUsersPage() {
  const { tokens } = useAuth()
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('Loading users...')
  const [autoLoginStatus, setAutoLoginStatus] = useState('')

  useEffect(() => {
    let active = true

    async function loadUsers() {
      try {
        const result = await apiRequest('/api/admin/get_users', { token: tokens.admin })
        if (!active) {
          return
        }
        setUsers(Array.isArray(result?.data) ? result.data : [])
        setStatus('')
      } catch (error) {
        if (active) {
          setStatus(error.message || 'Unable to load users')
        }
      }
    }

    loadUsers()
    return () => {
      active = false
    }
  }, [tokens.admin])

  async function handleAutoLogin(uid) {
    setAutoLoginStatus('Creating tenant auto-login token...')
    try {
      const result = await apiRequest('/api/admin/auto_login', {
        method: 'POST',
        token: tokens.admin,
        body: { uid },
      })

      if (!result?.success || !result?.token) {
        setAutoLoginStatus(result?.msg || 'Unable to create auto-login token')
        return
      }

      window.open(`/user/login?token=${encodeURIComponent(result.token)}`, '_blank', 'noopener')
      setAutoLoginStatus('Tenant auto-login tab opened.')
    } catch (error) {
      setAutoLoginStatus(error.message || 'Unable to create auto-login token')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">manage users</span>
          <h2>Tenant roster with impersonation handoff</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      {autoLoginStatus ? <p className="status-line">{autoLoginStatus}</p> : null}
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Expiry</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.plan || 'Unassigned'}</td>
                <td>{user.plan_expire || 'N/A'}</td>
                <td>
                  <button className="mini-button" type="button" onClick={() => handleAutoLogin(user.uid)}>
                    Auto login
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUsersPage
