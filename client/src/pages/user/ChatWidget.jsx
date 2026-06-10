import { useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function UserChatWidgetPage() {
  const { tokens } = useAuth()
  const [widgets, setWidgets] = useState([])
  const [status, setStatus] = useState('Loading widgets...')

  useEffect(() => {
    let active = true

    async function loadWidgets() {
      try {
        const result = await apiRequest('/api/user/get_my_widget', { token: tokens.user })
        if (!active) {
          return
        }
        setWidgets(Array.isArray(result?.data) ? result.data : [])
        setStatus('')
      } catch (error) {
        if (active) {
          setStatus(error.message || 'Unable to load widgets')
        }
      }
    }

    loadWidgets()
    return () => {
      active = false
    }
  }, [tokens.user])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">chat widget</span>
          <h2>Published embed widgets</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="card-grid">
        {widgets.length ? (
          widgets.map((widget) => (
            <article className="feature-card" key={widget.id}>
              <h3>{widget.title}</h3>
              <p>WhatsApp: {widget.whatsapp_number}</p>
              <p>Placement: {widget.place}</p>
              <p>Size: {widget.size}px</p>
            </article>
          ))
        ) : (
          <div className="panel">
            <p className="empty-state">No widgets created yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserChatWidgetPage
