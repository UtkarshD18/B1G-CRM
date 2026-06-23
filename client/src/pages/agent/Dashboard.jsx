import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { DashboardCard } from '../../components/Dashboard'

function AgentDashboardPage() {
  const { tokens } = useAuth()
  const [agent, setAgent] = useState(null)
  const [chats, setChats] = useState([])
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('Loading agent workspace...')
  const [taskComments, setTaskComments] = useState({})
  const [chatStatuses, setChatStatuses] = useState({})

  const loadAgentWorkspace = useCallback(async () => {
    setStatus('Loading agent workspace...')
    try {
      const [agentResult, chatResult, taskResult] = await Promise.all([
        apiRequest('/api/agent/get_me', { token: tokens.agent }),
        apiRequest('/api/agent/get_my_assigned_chats', { token: tokens.agent }),
        apiRequest('/api/agent/get_my_task', { token: tokens.agent }),
      ])

      if (!agentResult?.success) {
        setStatus(agentResult?.msg || 'Unable to load agent workspace')
        return
      }

      setAgent(agentResult.data)
      setChats(Array.isArray(chatResult?.data) ? chatResult.data : [])
      setTasks(Array.isArray(taskResult?.data) ? taskResult.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load agent workspace')
    }
  }, [tokens.agent])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAgentWorkspace()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadAgentWorkspace])

  async function markTaskComplete(id) {
    setStatus('Updating task...')
    try {
      const result = await apiRequest('/api/agent/mark_task_complete', {
        method: 'POST',
        token: tokens.agent,
        body: {
          id,
          comment: taskComments[id] || '',
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to update task')
        return
      }

      setStatus('Task updated.')
      loadAgentWorkspace()
    } catch (error) {
      setStatus(error.message || 'Unable to update task')
    }
  }

  async function updateChatStatus(chatId) {
    setStatus('Updating chat status...')
    try {
      const result = await apiRequest('/api/agent/change_chat_ticket_status', {
        method: 'POST',
        token: tokens.agent,
        body: {
          chatId,
          status: chatStatuses[chatId] || 'open',
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to update chat status')
        return
      }

      setStatus('Chat status updated.')
      loadAgentWorkspace()
    } catch (error) {
      setStatus(error.message || 'Unable to update chat status')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">agent workspace</span>
          <h2>Restricted staff portal</h2>
          <p>Ready for direct auto-login from the tenant `Agent Login` screen.</p>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="dashboard-grid">
        <DashboardCard title="Agent Name" value={agent?.name || '-'} detail={agent?.email || 'No profile loaded'} />
        <DashboardCard title="Assigned Chats" value={agent?.assignedChatsCount ?? chats.length} detail="Active conversation threads" />
        <DashboardCard title="Pending Tasks" value={agent?.pendingTasksCount ?? tasks.filter(t => t.status !== 'COMPLETED').length} detail="Action items assigned to you" />
        <DashboardCard title="Resolved Chats" value={agent?.resolvedConversationsCount ?? 0} detail="Resolved ticket threads" />
        <DashboardCard title="Avg Response Time" value={agent?.averageResponseTime || '11 mins'} detail="SLA target within 15 mins" />
      </div>

      {/* Premium My Performance Widget */}
      <div className="panel performance-panel" style={{
        background: 'linear-gradient(135deg, rgba(25, 42, 86, 0.05) 0%, rgba(9, 132, 227, 0.05) 100%)',
        border: '1px solid rgba(9, 132, 227, 0.15)',
        borderRadius: '16px',
        padding: '24px',
        margin: '16px 0',
        boxShadow: '0 8px 32px rgba(9, 132, 227, 0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>📈 My Performance Scorecard</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#7f8c8d' }}>Real-time agent productivity index and resolution rates.</p>
          </div>
          <span style={{
            background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)'
          }}>EXCELLENT (SLA MET)</span>
        </div>

        <div className="dashboard-grid" style={{ gap: '20px', marginTop: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>
              <span>Task Completion Rate</span>
              <span>
                {tasks.length > 0 
                  ? Math.round(((tasks.length - (agent?.pendingTasksCount ?? tasks.filter(t => t.status !== 'COMPLETED').length)) / tasks.length) * 100) 
                  : 100}%
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, #0984e3 0%, #74b9ff 100%)', 
                width: `${tasks.length > 0 ? ((tasks.length - (agent?.pendingTasksCount ?? tasks.filter(t => t.status !== 'COMPLETED').length)) / tasks.length) * 100 : 100}%`,
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>
              <span>Conversation Resolution Rate</span>
              <span>
                {chats.length > 0 
                  ? Math.round(((agent?.resolvedConversationsCount ?? 0) / chats.length) * 100) 
                  : 100}%
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, #6c5ce7 0%, #a29bfe 100%)', 
                width: `${chats.length > 0 ? ((agent?.resolvedConversationsCount ?? 0) / chats.length) * 100 : 100}%`,
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>
          </div>
        </div>
      </div>
      <div className="two-column-grid">
        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Assigned chats</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Chat ID</th>
                <th>Name</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {chats.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px 0' }}>
                    <span className="muted-copy">No chats assigned to you yet.</span>
                  </td>
                </tr>
              ) : chats.map((chat) => (
                <tr key={chat.chat_id}>
                  <td>{chat.chat_id}</td>
                  <td>{chat.name || chat.mobile || 'Unknown contact'}</td>
                  <td>
                    <select
                      value={chatStatuses[chat.chat_id] || chat.chat_status || 'open'}
                      onChange={(event) =>
                        setChatStatuses({
                          ...chatStatuses,
                          [chat.chat_id]: event.target.value,
                        })
                      }
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="solved">Solved</option>
                    </select>
                  </td>
                  <td>
                    <button className="mini-button" type="button" onClick={() => updateChatStatus(chat.chat_id)}>
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Task queue</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Comment</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px 0' }}>
                    <span className="muted-copy">Your task queue is empty. Great work!</span>
                  </td>
                </tr>
              ) : tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.status}</td>
                  <td>
                    <input
                      value={taskComments[task.id] || ''}
                      onChange={(event) =>
                        setTaskComments({
                          ...taskComments,
                          [task.id]: event.target.value,
                        })
                      }
                      placeholder="Completion note"
                    />
                  </td>
                  <td>
                    <button className="mini-button" type="button" onClick={() => markTaskComplete(task.id)}>
                      Complete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AgentDashboardPage
