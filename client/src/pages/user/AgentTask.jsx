import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function UserTaskPage() {
  const { tokens } = useAuth()
  const [agents, setAgents] = useState([])
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('Loading tasks...')
  const [form, setForm] = useState({
    title: '',
    des: '',
    agent_uid: '',
  })

  const loadTaskPageData = useCallback(async () => {
    setStatus('Loading tasks...')
    try {
      const [taskResult, agentResult] = await Promise.all([
        apiRequest('/api/user/get_my_agent_tasks', { token: tokens.user }),
        apiRequest('/api/agent/get_my_agents', { token: tokens.user }),
      ])

      setTasks(Array.isArray(taskResult?.data) ? taskResult.data : [])
      setAgents(Array.isArray(agentResult?.data) ? agentResult.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load tasks')
    }
  }, [tokens.user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadTaskPageData()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadTaskPageData])

  async function createTask(event) {
    event.preventDefault()
    setStatus('Creating task...')

    try {
      const result = await apiRequest('/api/user/add_task_for_agent', {
        method: 'POST',
        token: tokens.user,
        body: form,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create task')
        return
      }

      setForm({ title: '', des: '', agent_uid: '' })
      setStatus('Task created.')
      loadTaskPageData()
    } catch (error) {
      setStatus(error.message || 'Unable to create task')
    }
  }

  async function deleteTask(id) {
    setStatus('Deleting task...')
    try {
      const result = await apiRequest('/api/user/del_task_for_agent', {
        method: 'POST',
        token: tokens.user,
        body: { id },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete task')
        return
      }

      setStatus('Task deleted.')
      loadTaskPageData()
    } catch (error) {
      setStatus(error.message || 'Unable to delete task')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">agent task</span>
          <h2>Task queue assigned to tenant agents</h2>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={createTask}>
          <div className="panel-header">
            <h2>Create task</h2>
          </div>
          <label>
            Title
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Follow up lead"
            />
          </label>
          <label>
            Description
            <textarea
              rows={6}
              value={form.des}
              onChange={(event) => setForm({ ...form, des: event.target.value })}
              placeholder="Describe the work for the agent"
            />
          </label>
          <label>
            Agent
            <select
              value={form.agent_uid}
              onChange={(event) => setForm({ ...form, agent_uid: event.target.value })}
            >
              <option value="">Select agent</option>
              {agents.map((agent) => (
                <option key={agent.uid} value={agent.uid}>
                  {agent.name} ({agent.email})
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit">
            Add task
          </button>
        </form>

        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Current tasks</h2>
          </div>
          {!tasks.length ? (
            <div className="empty-onboarding-card">
              <h3>No agent tasks available</h3>
              <p>To assign follow-up tasks to your agent team:</p>
              <ol>
                <li>Go to the <strong>Agent Management</strong> page (Agent login) and register your support agents.</li>
                <li>Return to this page, enter the task title, description, select an agent, and click Add task.</li>
                <li>Agents can log in using their dedicated agent portal to view and complete their assigned tasks.</li>
              </ol>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.agent_email}</td>
                    <td>{task.status}</td>
                    <td>{task.createdAt || 'N/A'}</td>
                    <td>
                      <button className="mini-button subtle-danger" type="button" onClick={() => deleteTask(task.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserTaskPage
