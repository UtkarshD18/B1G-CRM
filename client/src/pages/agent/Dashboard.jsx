import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { DashboardCard } from '../../components/Dashboard'

function AgentDashboardPage() {
  const { tokens } = useAuth()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [chats, setChats] = useState([])
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('Loading agent workspace...')
  const [taskComments, setTaskComments] = useState({})
  const [chatStatuses, setChatStatuses] = useState({})
  const [taskFilter, setTaskFilter] = useState('all')

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
      
      const taskList = Array.isArray(taskResult?.data) ? taskResult.data : []
      setTasks(taskList)

      // Initialize comments state with existing comments for task list
      const initialComments = {}
      taskList.forEach(task => {
        if (task.agent_comments) {
          initialComments[task.id] = task.agent_comments
        }
      })
      setTaskComments(initialComments)

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
    const comment = (taskComments[id] || '').trim()
    if (!comment) {
      setStatus('Validation Error: Completion note is required.')
      alert('Validation Error: Please enter a completion note before completing the task.')
      return
    }

    setStatus('Updating task...')
    try {
      const result = await apiRequest('/api/agent/mark_task_complete', {
        method: 'POST',
        token: tokens.agent,
        body: {
          id,
          comment,
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

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === 'all') return true
    if (taskFilter === 'pending') return String(task.status).toUpperCase() === 'PENDING'
    if (taskFilter === 'completed') return String(task.status).toUpperCase() === 'COMPLETED'
    return true
  })

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
        <DashboardCard title="Agent" value={agent?.name || '-'} detail={agent?.email || 'No profile loaded'} />
        <DashboardCard title="Assigned chats" value={chats.length} detail="Scoped to owner_uid and agent_chats" />
        <DashboardCard title="Open tasks" value={tasks.filter(t => String(t.status).toUpperCase() === 'PENDING').length} detail="Agent task queue" />
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
                <th>Actions</th>
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="mini-button" type="button" onClick={() => updateChatStatus(chat.chat_id)}>
                        Save
                      </button>
                      <button
                        className="mini-button secondary"
                        type="button"
                        onClick={() => navigate(`/agent/chats?chatId=${chat.chat_id}`)}
                      >
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel table-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Task queue</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="muted-copy" style={{ fontSize: '13px' }}>Filter:</span>
              <select
                value={taskFilter}
                onChange={(event) => setTaskFilter(event.target.value)}
                style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Assigned At</th>
                <th>Status</th>
                <th>Comment</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>
                    <span className="muted-copy">No tasks found.</span>
                  </td>
                </tr>
              ) : filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <div>
                      <strong>{task.title}</strong>
                      {task.description && (
                        <div className="muted-copy" style={{ fontSize: '12px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                          {task.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="muted-copy" style={{ fontSize: '12px' }}>
                      {task.createdat || task.createdAt ? new Date(task.createdat || task.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: String(task.status).toUpperCase() === 'COMPLETED' ? '#d1fae5' : '#fef3c7',
                        color: String(task.status).toUpperCase() === 'COMPLETED' ? '#065f46' : '#92400e',
                        border: String(task.status).toUpperCase() === 'COMPLETED' ? '1px solid #a7f3d0' : '1px solid #fde68a'
                      }}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td>
                    {String(task.status).toUpperCase() === 'COMPLETED' ? (
                      <span className="muted-copy" style={{ fontSize: '13px', fontStyle: 'italic' }}>
                        {task.agent_comments || 'No comment'}
                      </span>
                    ) : (
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
                    )}
                  </td>
                  <td>
                    {String(task.status).toUpperCase() !== 'COMPLETED' && (
                      <button className="mini-button" type="button" onClick={() => markTaskComplete(task.id)}>
                        Complete
                      </button>
                    )}
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

