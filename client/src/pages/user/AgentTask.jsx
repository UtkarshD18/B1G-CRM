import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime } from '../../shared/format'

function UserTaskPage() {
  const { tokens } = useAuth()
  const [agents, setAgents] = useState([])
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('Loading tasks...')
  const [statusFilter, setStatusFilter] = useState('all')
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

  async function deleteTask(id, title) {
    if (!window.confirm(`Delete task "${title || id}"? This cannot be undone.`)) return
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

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks
    return tasks.filter(t => String(t.status || '').toLowerCase() === statusFilter)
  }, [tasks, statusFilter])

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📋</div>
          <div>
            <h2 style={{ margin: 0 }}>Agent Task</h2>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>Add, Manage or view Tasks set for the agent</p>
          </div>
        </div>
        <button className="mini-button" style={{ border: '1px solid #1ea085', color: '#1ea085', borderRadius: '10px', padding: '10px 20px' }} onClick={loadTaskPageData}>🔄 Refresh</button>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={createTask} style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#1ea085' }}>➕</span>
            <strong>Add Task</strong>
          </div>
          <p style={{ color: '#607481', fontSize: '0.875rem', margin: '0 0 16px' }}>Assign a new task to an agent</p>

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
          <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <h2>Task List <span style={{ fontSize: '0.8rem', color: '#1ea085', fontWeight: 600 }}>{filteredTasks.length}</span></h2>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ minWidth: '150px', padding: '6px 12px', fontSize: '14px', borderRadius: '12px', border: '1px solid rgba(10,25,37,0.12)' }}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {!filteredTasks.length ? (
            <div className="empty-onboarding-card">
              {tasks.length === 0 ? (
                <>
                  <h3>No agent tasks available</h3>
                  <p>To assign follow-up tasks to your agent team:</p>
                  <ol>
                    <li>Go to the <strong>Agent Management</strong> page (Agent login) and register your support agents.</li>
                    <li>Return to this page, enter the task title, description, select an agent, and click Add task.</li>
                    <li>Agents can log in using their dedicated agent portal to view and complete their assigned tasks.</li>
                  </ol>
                </>
              ) : (
                <h3>No tasks matched the selected filter.</h3>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Agent Comment</th>
                    <th>Added On</th>
                    <th>View Page</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="muted-copy" style={{ whiteSpace: 'nowrap' }}>{task.agent_email || '—'}</td>
                      <td><strong>{task.title}</strong></td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#607481' }} title={task.des || task.description || ''}>
                        {task.des || task.description || '—'}
                      </td>
                      <td>
                        <span className="status-chip" style={{
                          backgroundColor: task.status === 'completed' || task.status === 'COMPLETED' ? '#d1fae5' : '#fef9c3',
                          color: task.status === 'completed' || task.status === 'COMPLETED' ? '#065f46' : '#854d0e',
                          fontSize: '11px', fontWeight: 600, textTransform: 'uppercase'
                        }}>
                          {task.status || 'PENDING'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#607481' }} title={task.agent_comment || ''}>
                        {task.agent_comment || '—'}
                      </td>
                      <td className="muted-copy" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(task.createdAt || task.created_at)}</td>
                      <td>
                        <button
                          className="mini-button"
                          type="button"
                          title="View task detail"
                          onClick={() => {
                            const msg = `Task: ${task.title}\nAgent: ${task.agent_email || '—'}\nStatus: ${task.status || 'PENDING'}\nDescription: ${task.des || task.description || '—'}\nComment: ${task.agent_comment || '—'}`
                            window.alert(msg)
                          }}
                        >
                          📄 View
                        </button>
                      </td>
                      <td>
                        <button className="mini-button subtle-danger" type="button" onClick={() => deleteTask(task.id, task.title)}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default UserTaskPage
