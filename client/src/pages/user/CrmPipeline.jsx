import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalStyle = {
  backgroundColor: '#f8f3eb',
  padding: '24px',
  borderRadius: '24px',
  border: '1px solid rgba(10, 25, 37, 0.12)',
  boxShadow: '0 24px 70px rgba(7, 19, 29, 0.14)',
  width: 'min(900px, 95%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.2fr)',
  gap: '24px',
}

function UserCrmPipelinePage() {
  const { tokens } = useAuth()
  const [leads, setLeads] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [draggedLead, setDraggedLead] = useState(null)
  const [draggedOverStage, setDraggedOverStage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('all')

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchQuery ||
        String(lead.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(lead.mobile || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(lead.notes || '').toLowerCase().includes(searchQuery.toLowerCase())

      const matchesAgent =
        agentFilter === 'all' ||
        (agentFilter === 'unassigned' && !lead.owner_agent_uid) ||
        lead.owner_agent_uid === agentFilter

      return matchesSearch && matchesAgent
    })
  }, [leads, searchQuery, agentFilter])
  
  // Create / Edit Form States
  const [showAddModal, setShowAddModal] = useState(false)
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    mobile: '',
    stage: 'Lead',
    owner_agent_uid: '',
    notes: '',
    value: 0
  })

  const [editLeadForm, setEditLeadForm] = useState({
    id: '',
    name: '',
    mobile: '',
    stage: '',
    owner_agent_uid: '',
    notes: '',
    value: 0
  })

  // Modal Sub-lists
  const [reminders, setReminders] = useState([])
  const [activities, setActivities] = useState([])
  const [newReminder, setNewReminder] = useState({ title: '', remind_at: '' })
  const [newActivity, setNewActivity] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsRes, agentsRes] = await Promise.all([
        apiRequest('/api/crm/leads', { token: tokens.user }),
        apiRequest('/api/agent/get_my_agents', { token: tokens.user })
      ])
      if (leadsRes?.success && Array.isArray(leadsRes.data)) {
        setLeads(leadsRes.data)
      }
      if (agentsRes?.success && Array.isArray(agentsRes.data)) {
        setAgents(agentsRes.data)
      }
    } catch (error) {
      setStatus(error.message || 'Error loading CRM data.')
    } finally {
      setLoading(false)
    }
  }, [tokens.user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadLeadDetails = async (lead) => {
    setSelectedLead(lead)
    setEditLeadForm({
      id: lead.id,
      name: lead.name || '',
      mobile: lead.mobile || '',
      stage: lead.stage || 'Lead',
      owner_agent_uid: lead.owner_agent_uid || '',
      notes: lead.notes || '',
      value: lead.value || 0
    })
    
    // Fetch Reminders and Activities
    try {
      const [remRes, actRes] = await Promise.all([
        apiRequest(`/api/crm/leads/reminders/${lead.id}`, { token: tokens.user }),
        apiRequest(`/api/crm/leads/activities/${lead.id}`, { token: tokens.user })
      ])
      if (remRes?.success) setReminders(remRes.data)
      if (actRes?.success) setActivities(actRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleAddLead(e) {
    e.preventDefault()
    if (!newLeadForm.name || !newLeadForm.mobile) {
      setStatus('Name and Mobile are required.')
      return
    }

    try {
      const result = await apiRequest('/api/crm/leads/add', {
        method: 'POST',
        token: tokens.user,
        body: newLeadForm
      })

      if (result?.success) {
        setStatus('Lead created successfully.')
        setNewLeadForm({ name: '', mobile: '', stage: 'Lead', owner_agent_uid: '', notes: '', value: 0 })
        setShowAddModal(false)
        loadData()
      } else {
        setStatus(result?.msg || 'Failed to create lead.')
      }
    } catch (error) {
      setStatus(error.message || 'Error creating lead.')
    }
  }

  async function handleUpdateLead(e) {
    e.preventDefault()
    try {
      const result = await apiRequest('/api/crm/leads/update', {
        method: 'POST',
        token: tokens.user,
        body: editLeadForm
      })

      if (result?.success) {
        setStatus('Lead details updated.')
        // Refresh selected lead visual
        loadLeadDetails(result.data)
        loadData()
      } else {
        setStatus(result?.msg || 'Failed to update lead.')
      }
    } catch (error) {
      setStatus(error.message || 'Error updating lead.')
    }
  }

  async function savePipelineOrder(leadId, targetStage, currentLeads) {
    try {
      const moveRes = await apiRequest('/api/crm/leads/move', {
        method: 'POST',
        token: tokens.user,
        body: { id: leadId, stage: targetStage }
      })

      if (!moveRes?.success) {
        setStatus(moveRes?.msg || 'Failed to move stage.')
        loadData()
        return
      }

      const orderedLeadIds = currentLeads.map((l) => l.id)
      const orderRes = await apiRequest('/api/crm/leads/update_pipeline_order', {
        method: 'POST',
        token: tokens.user,
        body: { orderedLeadIds }
      })

      if (!orderRes?.success) {
        setStatus(orderRes?.msg || 'Failed to update lead order.')
        loadData()
        return
      }

      setStatus(`Lead shifted to ${targetStage}`)
      if (selectedLead && selectedLead.id === leadId) {
        const matched = currentLeads.find(l => l.id === leadId)
        if (matched) loadLeadDetails({ ...matched, stage: targetStage })
      }
    } catch (error) {
      setStatus(error.message || 'Error moving lead stage.')
      loadData()
    }
  }

  async function handleMoveLead(leadId, targetStage) {
    const updatedLeads = leads.map((l) => {
      if (l.id === leadId) {
        return { ...l, stage: targetStage }
      }
      return l
    })
    setLeads(updatedLeads)
    await savePipelineOrder(leadId, targetStage, updatedLeads)
  }

  async function handleAddReminder(e) {
    e.preventDefault()
    if (!selectedLead || !newReminder.title || !newReminder.remind_at) return

    try {
      const result = await apiRequest('/api/crm/leads/add_reminder', {
        method: 'POST',
        token: tokens.user,
        body: {
          lead_id: selectedLead.id,
          ...newReminder
        }
      })

      if (result?.success) {
        setReminders(prev => [...prev, result.data])
        setNewReminder({ title: '', remind_at: '' })
        // Reload activity feed too
        const actRes = await apiRequest(`/api/crm/leads/activities/${selectedLead.id}`, { token: tokens.user })
        if (actRes?.success) setActivities(actRes.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleAddActivity(e) {
    e.preventDefault()
    if (!selectedLead || !newActivity.trim()) return

    try {
      const result = await apiRequest('/api/crm/leads/add_activity', {
        method: 'POST',
        token: tokens.user,
        body: {
          lead_id: selectedLead.id,
          activity_type: 'note',
          description: newActivity.trim()
        }
      })

      if (result?.success) {
        setActivities(prev => [result.data, ...prev])
        setNewActivity('')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDragStart = (e, lead) => {
    e.dataTransfer.setData('text/plain', lead.id)
    setDraggedLead(lead)
  }

  const handleDragEnd = () => {
    setDraggedLead(null)
    setDraggedOverStage(null)
  }

  const handleDragOver = (e, stage) => {
    e.preventDefault()
    setDraggedOverStage(stage)
  }

  const handleDragLeave = () => {
    setDraggedOverStage(null)
  }

  const handleDrop = async (e, stage) => {
    e.preventDefault()
    setDraggedOverStage(null)
    const leadId = e.dataTransfer.getData('text/plain') || draggedLead?.id
    if (!leadId) return

    const sourceLead = leads.find((l) => String(l.id) === String(leadId))
    if (!sourceLead) return

    if (sourceLead.stage === stage) return

    const updatedLeads = leads.map((l) => {
      if (String(l.id) === String(leadId)) {
        return { ...l, stage }
      }
      return l
    })

    setLeads(updatedLeads)
    await savePipelineOrder(leadId, stage, updatedLeads)
  }

  const handleCardDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleCardDrop = async (e, targetLead, targetStage) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOverStage(null)

    const leadId = e.dataTransfer.getData('text/plain') || draggedLead?.id
    if (!leadId || String(leadId) === String(targetLead.id)) return

    const sourceLead = leads.find((l) => String(l.id) === String(leadId))
    if (!sourceLead) return

    const updatedLeads = leads.map((l) => {
      if (String(l.id) === String(leadId)) {
        return { ...l, stage: targetStage }
      }
      return l
    })

    const targetStageLeads = updatedLeads.filter(
      (l) => l.stage === targetStage && String(l.id) !== String(leadId)
    )

    const targetIndex = targetStageLeads.findIndex(
      (l) => String(l.id) === String(targetLead.id)
    )

    const newTargetStageLeads = [...targetStageLeads]
    newTargetStageLeads.splice(targetIndex, 0, { ...sourceLead, stage: targetStage })

    const otherStageLeads = updatedLeads.filter(
      (l) => l.stage !== targetStage
    )

    const finalLeads = [...otherStageLeads, ...newTargetStageLeads]
    setLeads(finalLeads)

    await savePipelineOrder(leadId, targetStage, finalLeads)
  }

  // Helper to calculate total value per stage
  const getStageTotal = (stage) => {
    return filteredLeads
      .filter(l => l.stage === stage)
      .reduce((sum, current) => sum + Number(current.value || 0), 0)
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="eyebrow">Enterprise deals</span>
          <h2>CRM Pipeline (Kanban)</h2>
          <p>Drag, manage, and assign ownership to prospective customer leads through custom deal cycles.</p>
        </div>
        <button className="primary-button" onClick={() => setShowAddModal(true)}>
          + Create Lead
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', background: '#fcfcfc', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(10,25,37,0.06)', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search name, mobile, or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: '1', minWidth: '200px', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(10,25,37,0.12)', background: '#fff', color: '#333' }}
        />
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          style={{ fontSize: '13px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(10,25,37,0.12)', minWidth: '150px', background: '#fff', color: '#333' }}
        >
          <option value="all">All Agents</option>
          <option value="unassigned">Unassigned</option>
          {agents.map((a) => (
            <option key={a.uid} value={a.uid}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {status && <div className="status-line">{status}</div>}

      {/* Kanban Board Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
        {STAGES.map(stage => {
          const stageLeads = filteredLeads.filter(l => l.stage === stage)
          const totalValue = getStageTotal(stage)

          return (
            <div
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
              style={{
                background: draggedOverStage === stage ? 'rgba(30, 160, 133, 0.08)' : '#fcfcfc',
                borderRadius: '16px',
                border: draggedOverStage === stage ? '2px dashed #1ea085' : '1px solid rgba(10,25,37,0.06)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '500px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid rgba(10,25,37,0.04)' }}>
                <div>
                  <h3 style={{ fontSize: '15px', margin: 0 }}>{stage}</h3>
                  <span className="muted-copy" style={{ fontSize: '11px' }}>
                    {stageLeads.length} leads
                  </span>
                </div>
                <div style={{ background: 'rgba(30, 160, 133, 0.1)', color: '#1ea085', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                  ${totalValue.toLocaleString()}
                </div>
              </div>

              {/* Cards List */}
              <div style={{ display: 'grid', gap: '10px', flex: 1, alignContent: 'start' }}>
                {stageLeads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => loadLeadDetails(lead)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleCardDragOver}
                    onDrop={(e) => handleCardDrop(e, lead, stage)}
                    style={{
                      background: '#ffffff',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(10,25,37,0.08)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      cursor: 'grab',
                      opacity: draggedLead?.id === lead.id ? 0.4 : 1,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.06)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{lead.name}</div>
                    <div className="muted-copy" style={{ fontSize: '12px', marginBottom: '8px' }}>{lead.mobile}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <span className="muted-copy" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        👤 {lead.owner_name || <em style={{ color: '#aaa' }}>Unassigned</em>}
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#1ea085' }}>
                        ${Number(lead.value || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Quick stage switch actions */}
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(10,25,37,0.04)', display: 'flex', gap: '4px', overflowX: 'auto' }} onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '10px' }} className="muted-copy">Move:</span>
                      {STAGES.filter(s => s !== stage).slice(0, 3).map(st => (
                        <button
                          key={st}
                          type="button"
                          className="mini-button"
                          style={{ fontSize: '9px', padding: '2px 4px' }}
                          onClick={() => handleMoveLead(lead.id, st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* CREATE LEAD MODAL */}
      {showAddModal && (
        <div style={overlayStyle} onClick={() => setShowAddModal(false)}>
          <div style={{ ...modalStyle, gridTemplateColumns: '1fr', width: 'min(500px, 95%)' }} onClick={e => e.stopPropagation()}>
            <form className="panel form-panel" onSubmit={handleAddLead} style={{ border: 'none', padding: 0, boxShadow: 'none', background: 'transparent' }}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Create Prospective Lead</h2>
                <span style={{ cursor: 'pointer', fontSize: '24px' }} onClick={() => setShowAddModal(false)}>&times;</span>
              </div>

              <label>
                Lead/Customer Name
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newLeadForm.name}
                  onChange={e => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  required
                />
              </label>

              <label>
                Contact Mobile Number
                <input
                  type="text"
                  placeholder="e.g. +919999912345"
                  value={newLeadForm.mobile}
                  onChange={e => setNewLeadForm({ ...newLeadForm, mobile: e.target.value })}
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Lead Value ($)
                  <input
                    type="number"
                    value={newLeadForm.value}
                    onChange={e => setNewLeadForm({ ...newLeadForm, value: parseFloat(e.target.value) || 0 })}
                  />
                </label>

                <label>
                  Initial Stage
                  <select
                    value={newLeadForm.stage}
                    onChange={e => setNewLeadForm({ ...newLeadForm, stage: e.target.value })}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              <label>
                Assign Ownership (Agent)
                <select
                  value={newLeadForm.owner_agent_uid}
                  onChange={e => setNewLeadForm({ ...newLeadForm, owner_agent_uid: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {agents.map(a => <option key={a.uid} value={a.uid}>{a.name}</option>)}
                </select>
              </label>

              <label>
                Initial Notes
                <textarea
                  placeholder="Summary of interest..."
                  value={newLeadForm.notes}
                  onChange={e => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  rows={2}
                />
              </label>

              <button className="primary-button" type="submit" style={{ marginTop: '16px' }}>
                Create Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LEAD DETAILS & ACTIONS MODAL */}
      {selectedLead && (
        <div style={overlayStyle} onClick={() => setSelectedLead(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            
            {/* Left: Lead Details / Edit form */}
            <div style={{ borderRight: '1px solid rgba(10, 25, 37, 0.08)', paddingRight: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Edit Lead Details</h2>
                <span className="status-chip active" style={{ backgroundColor: 'rgba(30,160,133,0.1)', color: '#1ea085', fontSize: '11px' }}>
                  ID: {selectedLead.id}
                </span>
              </div>

              <form onSubmit={handleUpdateLead} style={{ display: 'grid', gap: '12px' }}>
                <label>
                  Name
                  <input
                    type="text"
                    value={editLeadForm.name}
                    onChange={e => setEditLeadForm({ ...editLeadForm, name: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Mobile Number
                  <input
                    type="text"
                    value={editLeadForm.mobile}
                    onChange={e => setEditLeadForm({ ...editLeadForm, mobile: e.target.value })}
                    required
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Deal Value ($)
                    <input
                      type="number"
                      value={editLeadForm.value}
                      onChange={e => setEditLeadForm({ ...editLeadForm, value: parseFloat(e.target.value) || 0 })}
                    />
                  </label>

                  <label>
                    Stage
                    <select
                      value={editLeadForm.stage}
                      onChange={e => setEditLeadForm({ ...editLeadForm, stage: e.target.value })}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                </div>

                <label>
                  Owner Agent
                  <select
                    value={editLeadForm.owner_agent_uid}
                    onChange={e => setEditLeadForm({ ...editLeadForm, owner_agent_uid: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {agents.map(a => <option key={a.uid} value={a.uid}>{a.name}</option>)}
                  </select>
                </label>

                <label>
                  Description & Notes
                  <textarea
                    value={editLeadForm.notes}
                    onChange={e => setEditLeadForm({ ...editLeadForm, notes: e.target.value })}
                    rows={3}
                  />
                </label>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className="primary-button" type="submit" style={{ flex: 1 }}>
                    Save Info
                  </button>
                  <button type="button" className="mini-button" onClick={() => setSelectedLead(null)} style={{ border: '1px solid #ccc', color: '#333' }}>
                    Close
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Reminders & Activity Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Reminders section */}
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid rgba(10,25,37,0.06)' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 12px 0' }}>Schedule Follow-up Reminder</h3>
                <form onSubmit={handleAddReminder} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Call client for proposal response"
                    value={newReminder.title}
                    onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
                    required
                    style={{ fontSize: '13px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="datetime-local"
                      value={newReminder.remind_at}
                      onChange={e => setNewReminder({ ...newReminder, remind_at: e.target.value })}
                      required
                      style={{ fontSize: '13px', flex: 1 }}
                    />
                    <button type="submit" className="mini-button" style={{ background: '#1ea085', color: '#fff', border: 'none' }}>
                      Add
                    </button>
                  </div>
                </form>

                {/* List Reminders */}
                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'grid', gap: '6px' }}>
                  {reminders.length === 0 ? (
                    <p className="muted-copy" style={{ fontSize: '11px', margin: 0 }}>No reminders set.</p>
                  ) : (
                    reminders.map(rem => (
                      <div key={rem.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#fafafa', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.03)', fontSize: '12px' }}>
                        <span>🔔 {rem.title}</span>
                        <span className="muted-copy" style={{ fontSize: '10px' }}>
                          {new Date(rem.remind_at).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity timelines */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 8px 0' }}>Activity logs & timeline</h3>
                
                {/* Add activity note quick input */}
                <form onSubmit={handleAddActivity} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Log a client interaction or meeting..."
                    value={newActivity}
                    onChange={e => setNewActivity(e.target.value)}
                    required
                    style={{ fontSize: '13px', flex: 1 }}
                  />
                  <button type="submit" className="mini-button">
                    Log
                  </button>
                </form>

                {/* Activities log feed */}
                <div style={{ flex: 1, maxHeight: '250px', overflowY: 'auto', display: 'grid', gap: '8px' }}>
                  {activities.length === 0 ? (
                    <p className="muted-copy" style={{ fontSize: '12px' }}>No activities logged for this lead yet.</p>
                  ) : (
                    activities.map(act => (
                      <div key={act.id} style={{ borderLeft: '2px solid #1ea085', paddingLeft: '10px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 'bold' }}>{act.description}</div>
                        <div className="muted-copy" style={{ fontSize: '10px' }}>
                          {act.agent_name ? `by ${act.agent_name} | ` : ''}
                          {new Date(act.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default UserCrmPipelinePage
