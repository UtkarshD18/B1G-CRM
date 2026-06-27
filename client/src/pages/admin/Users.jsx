import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime, summarizePlan } from '../../shared/format'

const emptyUserForm = {
  uid: '',
  name: '',
  email: '',
  mobile_with_country_code: '',
  newPassword: '',
}

function AdminUsersPage() {
  const { tokens } = useAuth()
  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [status, setStatus] = useState('Loading users...')
  const [autoLoginStatus, setAutoLoginStatus] = useState('')
  const [form, setForm] = useState(emptyUserForm)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = useCallback(async () => {
    setStatus('Loading users...')
    try {
      const [userResult, planResult] = await Promise.all([
        apiRequest('/api/admin/get_users', { token: tokens.admin }),
        apiRequest('/api/admin/get_plans', { token: tokens.admin }),
      ])

      setUsers(Array.isArray(userResult?.data) ? userResult.data : [])
      setPlans(Array.isArray(planResult?.data) ? planResult.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load users')
    }
  }, [tokens.admin])

  useEffect(() => {
    loadData()
  }, [loadData])

  function editUser(user) {
    setForm({
      uid: user.uid,
      name: user.name || '',
      email: user.email || '',
      mobile_with_country_code: user.mobile_with_country_code || '',
      newPassword: '',
    })
    setSelectedPlanId('')
  }

  async function updateUser(event) {
    event.preventDefault()
    setStatus('Updating user...')

    try {
      const body = { ...form }
      if (!body.newPassword) {
        delete body.newPassword
      }

      const result = await apiRequest('/api/admin/update_user', {
        method: 'POST',
        token: tokens.admin,
        body,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to update user')
        return
      }

      setForm(emptyUserForm)
      setStatus('User updated.')
      loadData()
    } catch (error) {
      setStatus(error.message || 'Unable to update user')
    }
  }

  async function assignPlan() {
    if (!form.uid || !selectedPlanId) {
      setStatus('Select a user and a plan first.')
      return
    }

    const plan = plans.find((item) => String(item.id) === String(selectedPlanId))
    if (!plan) {
      setStatus('Selected plan was not found.')
      return
    }

    setStatus('Assigning plan...')
    try {
      const result = await apiRequest('/api/admin/update_plan', {
        method: 'POST',
        token: tokens.admin,
        body: { uid: form.uid, plan },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to assign plan')
        return
      }

      setStatus('Plan assigned.')
      loadData()
    } catch (error) {
      setStatus(error.message || 'Unable to assign plan')
    }
  }

  async function deleteUser(id, name) {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name || id}"? This action cannot be undone.`)) {
      return
    }
    setStatus('Deleting user...')
    try {
      const result = await apiRequest('/api/admin/del_user', {
        method: 'POST',
        token: tokens.admin,
        body: { id },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete user')
        return
      }

      setStatus('User deleted.')
      loadData()
    } catch (error) {
      setStatus(error.message || 'Unable to delete user')
    }
  }

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

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users
    const q = searchTerm.toLowerCase()
    return users.filter(u =>
      String(u.name || '').toLowerCase().includes(q) ||
      String(u.email || '').toLowerCase().includes(q)
    )
  }, [users, searchTerm])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">manage users</span>
          <h2>Tenant roster and plan assignment</h2>
          <p>Edit tenant profiles, assign plans, delete users, or open a tenant session.</p>
        </div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}
      {autoLoginStatus ? <p className="status-line">{autoLoginStatus}</p> : null}

      <form className="panel form-panel" onSubmit={updateUser}>
        <div className="panel-header">
          <h2>{form.uid ? 'Edit selected user' : 'Select a user to edit'}</h2>
          {form.uid ? (
            <button className="mini-button" type="button" onClick={() => setForm(emptyUserForm)}>
              Clear
            </button>
          ) : null}
        </div>
        <div className="form-grid">
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            Mobile with country code
            <input
              value={form.mobile_with_country_code}
              onChange={(event) => setForm({ ...form, mobile_with_country_code: event.target.value })}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={form.newPassword}
              onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
              placeholder="Leave blank to keep current password"
            />
          </label>
          <label>
            Assign plan
            <select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}>
              <option value="">Select plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="action-row">
          <button className="primary-button" type="submit" disabled={!form.uid}>
            Save profile
          </button>
          <button className="secondary-button" type="button" onClick={assignPlan} disabled={!form.uid}>
            Assign plan
          </button>
        </div>
      </form>

      <div className="panel table-panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h2>Users ({filteredUsers.length})</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              style={{ width: '220px', padding: '6px 12px', fontSize: '14px', borderRadius: '12px', border: '1px solid rgba(10,25,37,0.12)' }}
            />
            <button className="mini-button" type="button" onClick={loadData}>
              Refresh
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Auto Login</th>
              <th>Name</th>
              <th>Mobile Number</th>
              <th>Timezone</th>
              <th>Plan</th>
              <th>Plan Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px 0' }}>
                  <span className="muted-copy">
                    {searchTerm ? 'No users matched your search.' : 'No users registered yet.'}
                  </span>
                </td>
              </tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.uid}>
                <td>
                  <button
                    className="mini-button"
                    type="button"
                    onClick={() => handleAutoLogin(user.uid)}
                    aria-label="Login as this user"
                    title="Login as this user"
                    style={{ fontSize: '16px', padding: '6px 10px' }}
                  >
                    🔑
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: '#4a5568'
                    }}>
                      {String(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.name || '—'}</div>
                      <div className="muted-copy" style={{ fontSize: '12px' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>{user.mobile_with_country_code || '—'}</td>
                <td>{user.timezone || '—'}</td>
                <td>
                  <span className="status-chip" style={{
                    backgroundColor: user.plan ? '#d1fae5' : '#f3f4f6',
                    color: user.plan ? '#065f46' : '#374151',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {summarizePlan(user.plan)}
                  </span>
                </td>
                <td style={{ color: user.plan_expire ? '#059669' : 'inherit', fontWeight: user.plan_expire ? 600 : 'normal' }}>
                  {formatDateTime(user.plan_expire)}
                </td>
                <td>
                  <div className="action-row">
                    <button
                      className="mini-button"
                      type="button"
                      onClick={() => editUser(user)}
                      aria-label="Edit User"
                      title="Edit User"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="mini-button subtle-danger"
                      type="button"
                      onClick={() => deleteUser(user.id, user.name)}
                      aria-label="Delete User"
                      title="Delete User"
                    >
                      🗑️ Delete
                    </button>
                  </div>
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
