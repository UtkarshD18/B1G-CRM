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
        <DashboardCard title="Agent" value={agent?.name || '-'} detail={agent?.email || 'No profile loaded'} />
        <DashboardCard title="Assigned chats" value={chats.length} detail="Scoped to owner_uid and agent_chats" />
        <DashboardCard title="Open tasks" value={tasks.length} detail="Agent task queue" />
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
              {chats.map((chat) => (
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
              {tasks.map((task) => (
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
