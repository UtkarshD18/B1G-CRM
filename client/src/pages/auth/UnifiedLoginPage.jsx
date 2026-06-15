import { useState } from 'react'
import { classNames } from '../../shared/format'
import LoginPage from './LoginPage'

function UnifiedLoginPage() {
  const [role, setRole] = useState('user')
  const loginConfig = {
    admin: {
      title: 'Admin Sign In',
      subtitle: 'Global SaaS operations for plans, tenants, orders, payments, and site configuration.',
      endpoint: '/api/admin/login',
    },
    user: {
      title: 'User Sign In',
      subtitle: 'Tenant workspace for inbox, automation, campaigns, contacts, and agent management.',
      endpoint: '/api/user/login',
      allowSignup: true,
    },
    agent: {
      title: 'Agent Sign In',
      subtitle: 'Restricted portal for assigned chats and tasks.',
      endpoint: '/api/agent/login',
    },
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="role-toggle">
          {Object.keys(loginConfig).map((nextRole) => (
            <button
              className={classNames(role === nextRole ? 'active' : '')}
              key={nextRole}
              type="button"
              onClick={() => setRole(nextRole)}
            >
              {nextRole}
            </button>
          ))}
        </div>
        <LoginPage role={role} {...loginConfig[role]} />
      </div>
    </div>
  )
}

export default UnifiedLoginPage
