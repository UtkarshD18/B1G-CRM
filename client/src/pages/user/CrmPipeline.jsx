import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../shared/api';
import { useAuth } from '../../shared/auth';
import { formatMoney } from '../../shared/format';
import './CrmPipeline.css';

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

function UserCrmPipelinePage() {
  const { tokens } = useAuth();
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);

  const getOwnerName = (lead) => {
    if (!lead.owner_agent_uid) return null;
    const match = agents.find((a) => a.uid === lead.owner_agent_uid);
    return match ? match.name : lead.owner_name || lead.owner_agent_uid;
  };
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [draggedLead, setDraggedLead] = useState(null);
  const [draggedOverStage, setDraggedOverStage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchQuery ||
        String(lead.name || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        String(lead.mobile || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        String(lead.notes || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesAgent =
        agentFilter === 'all' ||
        (agentFilter === 'unassigned' && !lead.owner_agent_uid) ||
        lead.owner_agent_uid === agentFilter;

      return matchesSearch && matchesAgent;
    });
  }, [leads, searchQuery, agentFilter]);

  // Create / Edit Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    mobile: '',
    stage: 'Lead',
    owner_agent_uid: '',
    notes: '',
    value: 0,
  });

  const [editLeadForm, setEditLeadForm] = useState({
    id: '',
    name: '',
    mobile: '',
    stage: '',
    owner_agent_uid: '',
    notes: '',
    value: 0,
  });

  // Modal Sub-lists
  const [reminders, setReminders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newReminder, setNewReminder] = useState({ title: '', remind_at: '' });
  const [newActivity, setNewActivity] = useState('');

  const [stagePages, setStagePages] = useState({
    Lead: { offset: 0, hasMore: true },
    Qualified: { offset: 0, hasMore: true },
    Proposal: { offset: 0, hasMore: true },
    Negotiation: { offset: 0, hasMore: true },
    Won: { offset: 0, hasMore: true },
    Lost: { offset: 0, hasMore: true },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsRes, aiProvidersRes] = await Promise.all([
        apiRequest('/api/agent/get_my_agents', { token: tokens.user }),
        apiRequest('/api/ai_providers/get_all', { token: tokens.user }),
      ]);

      const humanAgents = agentsRes?.success && Array.isArray(agentsRes.data) ? agentsRes.data : [];
      const aiAgents =
        aiProvidersRes?.success && Array.isArray(aiProvidersRes.data)
          ? aiProvidersRes.data
              .filter((p) => Number(p.enabled) > 0)
              .map((p) => ({
                uid: `ai_${p.provider}`,
                name: `AI Agent (${p.provider.toUpperCase()})`,
                is_ai: true,
              }))
          : [];
      setAgents([...humanAgents, ...aiAgents]);

      // Fetch first batch of leads for all stages
      const limit = 20;
      const initialLeads = [];
      const newStagePages = {};

      await Promise.all(
        STAGES.map(async (stage) => {
          const res = await apiRequest(`/api/crm/leads?stage=${stage}&limit=${limit}&offset=0`, {
            token: tokens.user,
          });
          if (res?.success && Array.isArray(res.data)) {
            initialLeads.push(...res.data);
            newStagePages[stage] = { offset: limit, hasMore: res.data.length === limit };
          } else {
            newStagePages[stage] = { offset: 0, hasMore: false };
          }
        }),
      );

      setLeads(initialLeads);
      setStagePages(newStagePages);
    } catch (error) {
      setStatus(error.message || 'Error loading CRM data.');
    } finally {
      setLoading(false);
    }
  }, [tokens.user]);

  const loadMoreLeads = async (stage) => {
    const pageInfo = stagePages[stage];
    if (!pageInfo.hasMore) return;

    setLoading(true);
    const limit = 20;
    try {
      const res = await apiRequest(
        `/api/crm/leads?stage=${stage}&limit=${limit}&offset=${pageInfo.offset}`,
        { token: tokens.user },
      );
      if (res?.success && Array.isArray(res.data)) {
        setLeads((prev) => [...prev, ...res.data]);
        setStagePages((prev) => ({
          ...prev,
          [stage]: {
            offset: pageInfo.offset + limit,
            hasMore: res.data.length === limit,
          },
        }));
      }
    } catch (error) {
      setStatus(error.message || 'Error loading more leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadLeadDetails = async (lead) => {
    setSelectedLead(lead);
    setEditLeadForm({
      id: lead.id,
      name: lead.name || '',
      mobile: lead.mobile || '',
      stage: lead.stage || 'Lead',
      owner_agent_uid: lead.owner_agent_uid || '',
      notes: lead.notes || '',
      value: lead.value || 0,
    });

    // Fetch Reminders and Activities
    try {
      const [remRes, actRes] = await Promise.all([
        apiRequest(`/api/crm/leads/reminders/${lead.id}`, { token: tokens.user }),
        apiRequest(`/api/crm/leads/activities/${lead.id}`, { token: tokens.user }),
      ]);
      if (remRes?.success) setReminders(remRes.data);
      if (actRes?.success) setActivities(actRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  async function handleAddLead(e) {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.mobile) {
      setStatus('Name and Mobile are required.');
      return;
    }

    try {
      const result = await apiRequest('/api/crm/leads/add', {
        method: 'POST',
        token: tokens.user,
        body: newLeadForm,
      });

      if (result?.success) {
        setStatus('Lead created successfully.');
        setNewLeadForm({
          name: '',
          mobile: '',
          stage: 'Lead',
          owner_agent_uid: '',
          notes: '',
          value: 0,
        });
        setShowAddModal(false);
        loadData();
      } else {
        setStatus(result?.msg || 'Failed to create lead.');
      }
    } catch (error) {
      setStatus(error.message || 'Error creating lead.');
    }
  }

  async function handleUpdateLead(e) {
    e.preventDefault();
    try {
      const result = await apiRequest('/api/crm/leads/update', {
        method: 'POST',
        token: tokens.user,
        body: editLeadForm,
      });

      if (result?.success) {
        setStatus('Lead details updated.');
        // Refresh selected lead visual
        loadLeadDetails(result.data);
        loadData();
      } else {
        setStatus(result?.msg || 'Failed to update lead.');
      }
    } catch (error) {
      setStatus(error.message || 'Error updating lead.');
    }
  }

  async function handleDeleteLead() {
    if (!selectedLead) return;
    if (!window.confirm(`Permanently delete lead "${selectedLead.name}" and its activity history?`))
      return;

    setLoading(true);
    try {
      const result = await apiRequest('/api/crm/leads/delete', {
        method: 'POST',
        token: tokens.user,
        body: { id: selectedLead.id },
      });

      if (!result?.success) {
        setStatus(result?.msg || 'Failed to delete lead.');
        return;
      }

      setLeads((current) => current.filter((lead) => lead.id !== selectedLead.id));
      setSelectedLead(null);
      setStatus('Lead deleted successfully.');
    } catch (error) {
      setStatus(error.message || 'Error deleting lead.');
    } finally {
      setLoading(false);
    }
  }

  async function savePipelineOrder(leadId, targetStage, currentLeads) {
    try {
      const moveRes = await apiRequest('/api/crm/leads/move', {
        method: 'POST',
        token: tokens.user,
        body: { id: leadId, stage: targetStage },
      });

      if (!moveRes?.success) {
        setStatus(moveRes?.msg || 'Failed to move stage.');
        loadData();
        return;
      }

      const orderedLeadIds = currentLeads.map((l) => l.id);
      const orderRes = await apiRequest('/api/crm/leads/update_pipeline_order', {
        method: 'POST',
        token: tokens.user,
        body: { orderedLeadIds },
      });

      if (!orderRes?.success) {
        setStatus(orderRes?.msg || 'Failed to update lead order.');
        loadData();
        return;
      }

      setStatus(`Lead shifted to ${targetStage}`);
      if (selectedLead && selectedLead.id === leadId) {
        const matched = currentLeads.find((l) => l.id === leadId);
        if (matched) loadLeadDetails({ ...matched, stage: targetStage });
      }
    } catch (error) {
      setStatus(error.message || 'Error moving lead stage.');
      loadData();
    }
  }

  async function handleMoveLead(leadId, targetStage) {
    const updatedLeads = leads.map((l) => {
      if (l.id === leadId) {
        return { ...l, stage: targetStage };
      }
      return l;
    });
    setLeads(updatedLeads);
    await savePipelineOrder(leadId, targetStage, updatedLeads);
  }

  async function handleAddReminder(e) {
    e.preventDefault();
    if (!selectedLead || !newReminder.title || !newReminder.remind_at) return;

    try {
      const result = await apiRequest('/api/crm/leads/add_reminder', {
        method: 'POST',
        token: tokens.user,
        body: {
          lead_id: selectedLead.id,
          ...newReminder,
        },
      });

      if (result?.success) {
        setReminders((prev) => [...prev, result.data]);
        setNewReminder({ title: '', remind_at: '' });
        // Reload activity feed too
        const actRes = await apiRequest(`/api/crm/leads/activities/${selectedLead.id}`, {
          token: tokens.user,
        });
        if (actRes?.success) setActivities(actRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddActivity(e) {
    e.preventDefault();
    if (!selectedLead || !newActivity.trim()) return;

    try {
      const result = await apiRequest('/api/crm/leads/add_activity', {
        method: 'POST',
        token: tokens.user,
        body: {
          lead_id: selectedLead.id,
          activity_type: 'note',
          description: newActivity.trim(),
        },
      });

      if (result?.success) {
        setActivities((prev) => [result.data, ...prev]);
        setNewActivity('');
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleDragStart = (e, lead) => {
    e.dataTransfer.setData('text/plain', lead.id);
    setDraggedLead(lead);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDraggedOverStage(null);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    setDraggedOverStage(stage);
  };

  const handleDragLeave = () => {
    setDraggedOverStage(null);
  };

  const handleDrop = async (e, stage) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLead?.id;
    if (!leadId) return;

    const sourceLead = leads.find((l) => String(l.id) === String(leadId));
    if (!sourceLead) return;

    if (sourceLead.stage === stage) return;

    const updatedLeads = leads.map((l) => {
      if (String(l.id) === String(leadId)) {
        return { ...l, stage };
      }
      return l;
    });

    setLeads(updatedLeads);
    await savePipelineOrder(leadId, stage, updatedLeads);
  };

  const handleCardDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCardDrop = async (e, targetLead, targetStage) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverStage(null);

    const leadId = e.dataTransfer.getData('text/plain') || draggedLead?.id;
    if (!leadId || String(leadId) === String(targetLead.id)) return;

    const sourceLead = leads.find((l) => String(l.id) === String(leadId));
    if (!sourceLead) return;

    const updatedLeads = leads.map((l) => {
      if (String(l.id) === String(leadId)) {
        return { ...l, stage: targetStage };
      }
      return l;
    });

    const targetStageLeads = updatedLeads.filter(
      (l) => l.stage === targetStage && String(l.id) !== String(leadId),
    );

    const targetIndex = targetStageLeads.findIndex((l) => String(l.id) === String(targetLead.id));

    const newTargetStageLeads = [...targetStageLeads];
    newTargetStageLeads.splice(targetIndex, 0, { ...sourceLead, stage: targetStage });

    const otherStageLeads = updatedLeads.filter((l) => l.stage !== targetStage);

    const finalLeads = [...otherStageLeads, ...newTargetStageLeads];
    setLeads(finalLeads);

    await savePipelineOrder(leadId, targetStage, finalLeads);
  };

  // Helper to calculate total value per stage
  const getStageTotal = (stage) => {
    return filteredLeads
      .filter((l) => l.stage === stage)
      .reduce((sum, current) => sum + Number(current.value || 0), 0);
  };

  return (
    <div className="page-stack">
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span className="eyebrow">Enterprise deals</span>
          <h2>CRM Pipeline (Kanban)</h2>
          <p>
            Drag, manage, and assign ownership to prospective customer leads through custom deal
            cycles.
          </p>
        </div>
        <button className="primary-button" onClick={() => setShowAddModal(true)}>
          + Create Lead
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="crm-pipeline-filter">
        <input
          className="crm-pipeline-filter__search"
          type="text"
          placeholder="Search name, mobile, or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="crm-pipeline-filter__agent"
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
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
      <div className="crm-pipeline-board">
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.stage === stage);
          const totalValue = getStageTotal(stage);

          return (
            <div
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
              className={`crm-pipeline-column${draggedOverStage === stage ? ' is-drag-over' : ''}`}
            >
              {/* Column Header */}
              <div
                className="crm-pipeline-column__header"
              >
                <div>
                  <h3 className="crm-pipeline-column__title">{stage}</h3>
                  <span className="muted-copy crm-pipeline-column__count">
                    {stageLeads.length} leads
                  </span>
                </div>
                <div className="crm-pipeline-column__value">
                  {formatMoney(totalValue)}
                </div>
              </div>

              {/* Cards List */}
              <div
                className="crm-pipeline-column__list"
              >
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => loadLeadDetails(lead)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleCardDragOver}
                    onDrop={(e) => handleCardDrop(e, lead, stage)}
                    className={`crm-lead-card${draggedLead?.id === lead.id ? ' is-dragging' : ''}`}
                  >
                    <div className="crm-lead-card__name">
                      {lead.name}
                    </div>
                    <div className="muted-copy crm-lead-card__mobile">
                      {lead.mobile}
                    </div>

                    <div className="crm-lead-card__meta">
                      <span className="muted-copy crm-lead-card__owner">
                        👤 {getOwnerName(lead) || <em>Unassigned</em>}
                      </span>
                      <span className="crm-lead-card__amount">
                        {formatMoney(Number(lead.value || 0))}
                      </span>
                    </div>

                    {/* Quick stage switch actions */}
                    <div className="crm-lead-card__actions" onClick={(e) => e.stopPropagation()}>
                      <span className="muted-copy crm-lead-card__move-label">
                        Move:
                      </span>
                      {STAGES.filter((s) => s !== stage)
                        .slice(0, 3)
                        .map((st) => (
                          <button
                            key={st}
                            type="button"
                            className="mini-button crm-lead-card__move-button"
                            onClick={() => handleMoveLead(lead.id, st)}
                          >
                            {st}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {stagePages[stage]?.hasMore && (
                  <button
                    type="button"
                    className="secondary-button crm-pipeline-load-more"
                    onClick={() => loadMoreLeads(stage)}
                  >
                    Load More...
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE LEAD MODAL */}
      {showAddModal && (
        <div className="crm-pipeline-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="crm-lead-modal crm-lead-modal--create"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              className="panel form-panel crm-pipeline-modal-form"
              onSubmit={handleAddLead}
              style={{ border: 'none', padding: 0, boxShadow: 'none', background: 'transparent' }}
            >
              <div
                className="panel-header"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <h2>Create Prospective Lead</h2>
                <span
                  style={{ cursor: 'pointer', fontSize: '24px' }}
                  onClick={() => setShowAddModal(false)}
                >
                  &times;
                </span>
              </div>

              <label>
                Lead/Customer Name
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  required
                />
              </label>

              <label>
                Contact Mobile Number
                <input
                  type="text"
                  placeholder="e.g. +919999912345"
                  value={newLeadForm.mobile}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, mobile: e.target.value })}
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Lead Value (INR)
                  <input
                    type="number"
                    value={newLeadForm.value}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, value: parseFloat(e.target.value) || 0 })
                    }
                  />
                </label>

                <label>
                  Initial Stage
                  <select
                    value={newLeadForm.stage}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, stage: e.target.value })}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Assign Ownership (Agent)
                <select
                  value={newLeadForm.owner_agent_uid}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, owner_agent_uid: e.target.value })
                  }
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.uid} value={a.uid}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Initial Notes
                <textarea
                  placeholder="Summary of interest..."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
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
        <div className="crm-pipeline-overlay" onClick={() => setSelectedLead(null)}>
          <div className="crm-lead-modal" onClick={(e) => e.stopPropagation()}>
            {/* Left: Lead Details / Edit form */}
            <div className="crm-lead-modal__details">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h2>Edit Lead Details</h2>
                <span
                  className="status-chip active"
                  style={{
                    backgroundColor: 'rgba(30,160,133,0.1)',
                    color: '#1ea085',
                    fontSize: '11px',
                  }}
                >
                  ID: {selectedLead.id}
                </span>
              </div>

              <form onSubmit={handleUpdateLead} style={{ display: 'grid', gap: '12px' }}>
                <label>
                  Name
                  <input
                    type="text"
                    value={editLeadForm.name}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, name: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Mobile Number
                  <input
                    type="text"
                    value={editLeadForm.mobile}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, mobile: e.target.value })}
                    required
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Deal Value (INR)
                    <input
                      type="number"
                      value={editLeadForm.value}
                      onChange={(e) =>
                        setEditLeadForm({ ...editLeadForm, value: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </label>

                  <label>
                    Stage
                    <select
                      value={editLeadForm.stage}
                      onChange={(e) => setEditLeadForm({ ...editLeadForm, stage: e.target.value })}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  Owner Agent
                  <select
                    value={editLeadForm.owner_agent_uid}
                    onChange={(e) =>
                      setEditLeadForm({ ...editLeadForm, owner_agent_uid: e.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.uid} value={a.uid}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Description & Notes
                  <textarea
                    value={editLeadForm.notes}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, notes: e.target.value })}
                    rows={3}
                  />
                </label>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className="primary-button" type="submit" style={{ flex: 1 }}>
                    Save Info
                  </button>
                  <button
                    type="button"
                    className="mini-button"
                    onClick={handleDeleteLead}
                    disabled={loading}
                    style={{ border: '1px solid #c94b4b', color: '#a22f2f' }}
                  >
                    {loading ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() => setSelectedLead(null)}
                    style={{ border: '1px solid #ccc', color: '#333' }}
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Reminders & Activity Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Reminders section */}
                <div
                className="crm-lead-modal__reminders"
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(10,25,37,0.06)',
                }}
              >
                <h3 style={{ fontSize: '15px', margin: '0 0 12px 0' }}>
                  Schedule Follow-up Reminder
                </h3>
                <form
                  onSubmit={handleAddReminder}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="e.g. Call client for proposal response"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    required
                    style={{ fontSize: '13px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="datetime-local"
                      value={newReminder.remind_at}
                      onChange={(e) =>
                        setNewReminder({ ...newReminder, remind_at: e.target.value })
                      }
                      required
                      style={{ fontSize: '13px', flex: 1 }}
                    />
                    <button
                      type="submit"
                      className="mini-button"
                      style={{ background: '#1ea085', color: '#fff', border: 'none' }}
                    >
                      Add
                    </button>
                  </div>
                </form>

                {/* List Reminders */}
                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'grid', gap: '6px' }}>
                  {reminders.length === 0 ? (
                    <p className="muted-copy" style={{ fontSize: '11px', margin: 0 }}>
                      No reminders set.
                    </p>
                  ) : (
                    reminders.map((rem) => (
                      <div
                        key={rem.id}
                        className="crm-lead-modal__reminder"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.03)',
                          fontSize: '12px',
                        }}
                      >
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
                <form
                  onSubmit={handleAddActivity}
                  style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}
                >
                  <input
                    type="text"
                    placeholder="Log a client interaction or meeting..."
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    required
                    style={{ fontSize: '13px', flex: 1 }}
                  />
                  <button type="submit" className="mini-button">
                    Log
                  </button>
                </form>

                {/* Activities log feed */}
                <div
                  style={{
                    flex: 1,
                    maxHeight: '250px',
                    overflowY: 'auto',
                    display: 'grid',
                    gap: '8px',
                  }}
                >
                  {activities.length === 0 ? (
                    <p className="muted-copy" style={{ fontSize: '12px' }}>
                      No activities logged for this lead yet.
                    </p>
                  ) : (
                    activities.map((act) => (
                      <div
                        key={act.id}
                        style={{
                          borderLeft: '2px solid #1ea085',
                          paddingLeft: '10px',
                          fontSize: '12px',
                        }}
                      >
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
  );
}

export default UserCrmPipelinePage;
