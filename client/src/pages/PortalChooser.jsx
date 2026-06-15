import { Link } from 'react-router-dom'

function PortalChooser() {
  return (
    <div className="chooser-page">
      <div className="section-heading">
        <span className="eyebrow">portal entry</span>
        <h1>Choose the workspace you need.</h1>
      </div>
      <div className="chooser-grid">
        <Link className="chooser-card" to="/admin/login">
          <h2>Admin</h2>
          <p>Pricing, users, orders, SMTP, payments, and CMS operations.</p>
        </Link>
        <Link className="chooser-card" to="/user/login">
          <h2>User</h2>
          <p>Tenant workspace for inbox, automation, campaigns, contacts, and agents.</p>
        </Link>
        <Link className="chooser-card" to="/agent/login">
          <h2>Agent</h2>
          <p>Assigned chats and task handling with restricted access.</p>
        </Link>
      </div>
    </div>
  )
}

export default PortalChooser
