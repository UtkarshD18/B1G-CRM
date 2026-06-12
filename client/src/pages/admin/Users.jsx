import { useCallback, useEffect, useState } from 'react'
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

  async function deleteUser(id) {
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
        <div className="panel-header">
          <h2>Users</h2>
          <button className="mini-button" type="button" onClick={loadData}>
            Refresh
          </button>
        </div>
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
                <td>{summarizePlan(user.plan)}</td>
                <td>{formatDateTime(user.plan_expire)}</td>
                <td>
                  <div className="action-row">
                    <button className="mini-button" type="button" onClick={() => editUser(user)}>
                      Edit
                    </button>
                    <button className="mini-button" type="button" onClick={() => handleAutoLogin(user.uid)}>
                      Auto login
                    </button>
                    <button className="mini-button subtle-danger" type="button" onClick={() => deleteUser(user.id)}>
                      Delete
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
