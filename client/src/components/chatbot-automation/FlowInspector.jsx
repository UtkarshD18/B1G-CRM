import React, { useEffect, useState } from 'react'
import { useChatbotAutomationStore } from '../../store/chatbotAutomationStore'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function FlowInspector() {
  const { selectedNodeId, nodes, updateNodeData, setSelectedNodeId } = useChatbotAutomationStore()
  const { tokens } = useAuth()
  const [templates, setTemplates] = useState([])

  const [testResult, setTestResult] = useState(null)
  const [isTesting, setIsTesting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const result = await apiRequest('/api/user/get_my_meta_templets', { token: tokens?.user })
        if (result?.success && Array.isArray(result.data)) {
          // Only show approved/configured templates to prevent sending pending templates
          setTemplates(result.data.filter(t => String(t.status).toUpperCase() === 'APPROVED'))
        }
      } catch (err) {
        console.error('Failed to load templates for inspector:', err)
      }
    }
    fetchTemplates()
  }, [tokens])

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) {
    return (
      <div className="flow-inspector">
        <div className="af-inspector-empty">
          <div className="af-inspector-empty-icon">🎯</div>
          <span>Select a node on the canvas to configure its settings.</span>
        </div>
      </div>
    )
  }

  const nodeData = node.data || {}
  const type = node.type

  // Handle simple input changes
  const handleChange = (key, value) => {
    updateNodeData(node.id, key, value)
  }

  // Handle nested Conditions additions / edits
  const handleAddCondition = () => {
    const current = nodeData.conditions || []
    const updated = [...current, { variableName: '{{senderMessage}}', operator: 'equals', valueToCompare: '' }]
    handleChange('conditions', updated)
  }

  const handleUpdateCondition = (index, key, value) => {
    const updated = (nodeData.conditions || []).map((cond, idx) => {
      if (idx === index) {
        return { ...cond, [key]: value }
      }
      return cond
    })
    handleChange('conditions', updated)
  }

  const handleDeleteCondition = (index) => {
    const updated = (nodeData.conditions || []).filter((_, idx) => idx !== index)
    handleChange('conditions', updated)
  }

  // Handle headers addition / edits for Make Request
  const handleAddHeader = () => {
    const current = nodeData.headers || []
    const updated = [...current, { key: '', value: '' }]
    handleChange('headers', updated)
  }

  const handleUpdateHeader = (index, field, value) => {
    const updated = (nodeData.headers || []).map((h, idx) => {
      if (idx === index) {
        return { ...h, [field]: value }
      }
      return h
    })
    handleChange('headers', updated)
  }

  const handleDeleteHeader = (index) => {
    const updated = (nodeData.headers || []).filter((_, idx) => idx !== index)
    handleChange('headers', updated)
  }

  // Handle response mapping additions for Make Request
  const handleAddMapping = () => {
    const current = nodeData.responseMappings || []
    const updated = [...current, { responsePath: '', saveToVariable: '' }]
    handleChange('responseMappings', updated)
  }

  const handleUpdateMapping = (index, field, value) => {
    const updated = (nodeData.responseMappings || []).map((m, idx) => {
      if (idx === index) {
        return { ...m, [field]: value }
      }
      return m
    })
    handleChange('responseMappings', updated)
  }

  const handleDeleteMapping = (index) => {
    const updated = (nodeData.responseMappings || []).filter((_, idx) => idx !== index)
    handleChange('responseMappings', updated)
  }

  return (
    <div className="flow-inspector flex-col">
      <div className="inspector-header">
        <h4>Configure Node</h4>
        <button className="close-inspector-btn" onClick={() => setSelectedNodeId(null)}>✕</button>
      </div>

      <div className="inspector-body flex-1">
        <div className="af-field">
          <label className="af-field-label">Node Type</label>
          <input className="af-input" value={type} disabled />
        </div>

        <div className="af-field">
          <label className="af-field-label">Node Label</label>
          <input
            className="af-input"
            value={nodeData.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder={type}
          />
        </div>

        <hr className="inspector-divider" />

        {/* Node Type Specific Forms */}
        {type === 'Send Message' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">Header Text (Optional)</label>
              <input
                className="af-input"
                value={nodeData.headerText || ''}
                onChange={(e) => handleChange('headerText', e.target.value)}
                placeholder="e.g. Warning / Alert"
              />
            </div>
            <div className="af-field">
              <label className="af-field-label">Message Body</label>
              <textarea
                className="af-textarea"
                rows={5}
                value={nodeData.messageBody || ''}
                onChange={(e) => handleChange('messageBody', e.target.value)}
                placeholder="Type your reply. Use {{senderName}} for variables."
              />
            </div>
            <div className="af-field">
              <label className="af-field-label">Footer Text (Optional)</label>
              <input
                className="af-input"
                value={nodeData.footerText || ''}
                onChange={(e) => handleChange('footerText', e.target.value)}
                placeholder="e.g. Reply STOP to unsubscribe"
              />
            </div>
          </div>
        )}

        {type === 'Send WA Template' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">Template ID / Name</label>
              <select
                className="af-select"
                value={nodeData.templateId || ''}
                onChange={(e) => handleChange('templateId', e.target.value)}
              >
                <option value="" disabled>Select an approved template</option>
                {templates.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
              {templates.length === 0 && (
                <span className="af-field-hint" style={{ color: '#f59e0b', marginTop: 4, display: 'block' }}>
                  No approved templates found.
                </span>
              )}
            </div>
          </div>
        )}

        {type === 'Send WA Form' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">Form Title / Header</label>
              <input
                className="af-input"
                value={nodeData.formTitle || ''}
                onChange={(e) => handleChange('formTitle', e.target.value)}
                placeholder="e.g. Please select your size:"
              />
            </div>
            <div className="af-field">
              <label className="af-field-label">Save Response Into Variable</label>
              <input
                className="af-input"
                value={nodeData.saveResponseVariable || 'form_response'}
                onChange={(e) => handleChange('saveResponseVariable', e.target.value)}
                placeholder="e.g. user_size"
              />
            </div>
          </div>
        )}

        {type === 'Delay' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">Delay Amount</label>
              <input
                className="af-input"
                type="number"
                value={nodeData.delayAmount || '5'}
                onChange={(e) => handleChange('delayAmount', e.target.value)}
              />
            </div>
            <div className="af-field">
              <label className="af-field-label">Delay Unit</label>
              <select
                className="af-select"
                value={nodeData.delayUnit || 'seconds'}
                onChange={(e) => handleChange('delayUnit', e.target.value)}
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        )}

        {type === 'Response Saver' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">Save Incoming Message Into Variable</label>
              <input
                className="af-input"
                value={nodeData.variableName || 'user_query'}
                onChange={(e) => handleChange('variableName', e.target.value)}
                placeholder="e.g. ticket_subject"
              />
            </div>
          </div>
        )}

        {type === 'Condition' && (
          <div className="inspector-form-section">
            <label className="af-field-label">Branch Conditions</label>
            <div className="conditions-builder-list">
              {(nodeData.conditions || []).map((cond, idx) => (
                <div key={idx} className="inspector-condition-card">
                  <div className="condition-card-header">
                    <span>Branch {idx + 1} Output</span>
                    <button type="button" className="delete-cond-btn" onClick={() => handleDeleteCondition(idx)}>🗑</button>
                  </div>
                  <div className="af-field">
                    <label className="sub-label">Compare Variable</label>
                    <input
                      className="af-input compact"
                      value={cond.variableName || '{{senderMessage}}'}
                      onChange={(e) => handleUpdateCondition(idx, 'variableName', e.target.value)}
                      placeholder="{{senderMessage}} or variables.name"
                    />
                  </div>
                  <div className="af-field">
                    <label className="sub-label">Operator</label>
                    <select
                      className="af-select compact"
                      value={cond.operator || 'equals'}
                      onChange={(e) => handleUpdateCondition(idx, 'operator', e.target.value)}
                    >
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="contains">Contains</option>
                      <option value="not_contains">Not Contains</option>
                      <option value="starts_with">Starts With</option>
                      <option value="ends_with">Ends With</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="regex">Regex Match</option>
                      <option value="is_empty">Is Empty</option>
                      <option value="is_not_empty">Is Not Empty</option>
                    </select>
                  </div>
                  <div className="af-field">
                    <label className="sub-label">Compare Value</label>
                    <input
                      className="af-input compact"
                      value={cond.valueToCompare || ''}
                      onChange={(e) => handleUpdateCondition(idx, 'valueToCompare', e.target.value)}
                      placeholder="e.g. hi / refund / 100"
                    />
                  </div>
                </div>
              ))}
              <button type="button" className="af-add-button-btn" onClick={handleAddCondition}>
                ➕ Add Condition Branch
              </button>
            </div>
          </div>
        )}

        {type === 'Make Request' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">HTTP Method</label>
              <select
                className="af-select"
                value={nodeData.method || 'GET'}
                onChange={(e) => handleChange('method', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="af-field">
              <label className="af-field-label">API URL</label>
              <input
                className="af-input"
                value={nodeData.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            
            {/* Headers Configuration */}
            <div className="af-field">
              <label className="af-field-label">Headers (Optional)</label>
              <div className="headers-mapping-list">
                {(nodeData.headers || []).map((h, idx) => (
                  <div key={idx} className="header-row-inputs">
                    <input
                      className="af-input compact"
                      value={h.key}
                      onChange={(e) => handleUpdateHeader(idx, 'key', e.target.value)}
                      placeholder="Header Key"
                    />
                    <input
                      className="af-input compact"
                      value={h.value}
                      onChange={(e) => handleUpdateHeader(idx, 'value', e.target.value)}
                      placeholder="Value"
                    />
                    <button type="button" className="delete-row-btn" onClick={() => handleDeleteHeader(idx)}>✕</button>
                  </div>
                ))}
                <button type="button" className="action-btn" onClick={handleAddHeader}>➕ Add Header</button>
              </div>
            </div>

            {nodeData.method !== 'GET' && nodeData.method !== 'DELETE' && (
              <div className="af-field">
                <label className="af-field-label">Body Payload (JSON)</label>
                <textarea
                  className="af-textarea"
                  rows={4}
                  value={nodeData.body || ''}
                  onChange={(e) => handleChange('body', e.target.value)}
                  placeholder='{"name": "{{senderName}}"}'
                />
              </div>
            )}

            {/* Response Mappings */}
            <div className="af-field">
              <label className="af-field-label">Map JSON Response to Variables</label>
              <div className="headers-mapping-list">
                {(nodeData.responseMappings || []).map((m, idx) => (
                  <div key={idx} className="header-row-inputs">
                    <input
                      className="af-input compact"
                      value={m.responsePath}
                      onChange={(e) => handleUpdateMapping(idx, 'responsePath', e.target.value)}
                      placeholder="e.g. data.name"
                    />
                    <input
                      className="af-input compact"
                      value={m.saveToVariable}
                      onChange={(e) => handleUpdateMapping(idx, 'saveToVariable', e.target.value)}
                      placeholder="customer_name"
                    />
                    <button type="button" className="delete-row-btn" onClick={() => handleDeleteMapping(idx)}>✕</button>
                  </div>
                ))}
                <button type="button" className="action-btn" onClick={handleAddMapping}>➕ Add Mapping</button>
              </div>
            </div>
          </div>
        )}

        {type === 'AI Transfer' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">AI Provider</label>
              <select
                className="af-select"
                value={nodeData.provider || 'gemini'}
                onChange={(e) => {
                  handleChange('provider', e.target.value);
                  handleChange('model', ''); // Reset model on provider change
                }}
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Anthropic Claude</option>
                <option value="groq">Groq</option>
                <option value="openrouter">OpenRouter</option>
                <option value="deepseek">DeepSeek</option>
                <option value="mistral">Mistral</option>
                <option value="custom">Custom OpenAI Compatible API</option>
              </select>
            </div>

            <div className="af-field">
              <label className="af-field-label">Model</label>
              <select
                className="af-select"
                value={nodeData.model || ''}
                onChange={(e) => handleChange('model', e.target.value)}
              >
                <option value="" disabled>Select a model</option>
                {(nodeData.provider === 'gemini' || !nodeData.provider) && (
                  <>
                    <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  </>
                )}
                {nodeData.provider === 'openai' && (
                  <>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  </>
                )}
                {nodeData.provider === 'claude' && (
                  <>
                    <option value="claude-3-opus-20240229">claude-3-opus</option>
                    <option value="claude-3-sonnet-20240229">claude-3-sonnet</option>
                    <option value="claude-3-haiku-20240307">claude-3-haiku</option>
                  </>
                )}
                {nodeData.provider === 'groq' && (
                  <>
                    <option value="llama3-70b-8192">llama3-70b-8192</option>
                    <option value="llama3-8b-8192">llama3-8b-8192</option>
                    <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                  </>
                )}
                {nodeData.provider === 'deepseek' && (
                  <>
                    <option value="deepseek-chat">deepseek-chat</option>
                    <option value="deepseek-coder">deepseek-coder</option>
                  </>
                )}
                {(nodeData.provider === 'openrouter' || nodeData.provider === 'custom') && (
                  <option value="default">Use Default/Custom Path</option>
                )}
              </select>
            </div>

            <div className="af-field">
              <label className="af-field-label">API Key</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="af-input"
                  value={nodeData.apiKey || ''}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder="Enter API Key (Encrypted securely)"
                />
                <button type="button" className="action-btn" onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="af-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', marginBottom: '10px' }}>
              <input
                type="checkbox"
                id="ragEnabled"
                checked={!!nodeData.ragEnabled}
                onChange={(e) => handleChange('ragEnabled', e.target.checked)}
                style={{ cursor: 'pointer', width: 'auto', height: 'auto', margin: 0 }}
              />
              <label htmlFor="ragEnabled" className="af-field-label" style={{ margin: 0, cursor: 'pointer' }}>
                Enable Knowledge Base Grounding (RAG)
              </label>
            </div>

            <div style={{ marginTop: '10px' }}>
              <button 
                type="button" 
                  className="action-btn" 
                  style={{ width: '100%' }}
                  disabled={isTesting || !nodeData.apiKey}
                  onClick={async () => {
                    setIsTesting(true);
                    setTestResult(null);
                    const res = await apiRequest('/api/chatbot-automation/ai/test', {
                       method: 'POST',
                       body: {
                         provider: nodeData.provider || 'gemini',
                         model: nodeData.model,
                         apiKey: nodeData.apiKey,
                         prompt: "Say hello",
                         flowId: useChatbotAutomationStore.getState().selectedFlow?.flow_id,
                         nodeId: node.id
                       }
                    });
                    setIsTesting(false);
                    if(res?.success) {
                       setTestResult(`Success! Latency: ${res.latencyMs}ms`);
                    } else {
                       setTestResult(`Failed: ${res?.msg || 'Error'}`);
                    }
                  }}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                {testResult && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: testResult.startsWith('Success') ? 'green' : 'red' }}>
                    {testResult}
                  </div>
                )}
              </div>

            <div className="af-field" style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
              <label className="af-field-label">Advanced Settings</label>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Temperature: {nodeData.temperature || '0.7'}</label>
                <input
                  type="range"
                  min="0" max="2" step="0.1"
                  value={nodeData.temperature || 0.7}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666' }}>
                  <span>Precise</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Max Tokens</label>
                <select className="af-select compact" value={nodeData.maxTokens || '1024'} onChange={(e) => handleChange('maxTokens', e.target.value)}>
                  <option value="100">100</option>
                  <option value="500">500</option>
                  <option value="1024">1024</option>
                  <option value="2000">2000</option>
                  <option value="4000">4000</option>
                  <option value="8000">8000</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Conversation Memory</label>
                <select className="af-select compact" value={nodeData.memoryMode || 'Last 10 Messages'} onChange={(e) => handleChange('memoryMode', e.target.value)}>
                  <option value="Disabled">Disabled</option>
                  <option value="Current Session">Current Session</option>
                  <option value="Last 10 Messages">Last 10 Messages</option>
                  <option value="Last 50 Messages">Last 50 Messages</option>
                  <option value="Full Conversation">Full Conversation</option>
                </select>
              </div>

              {(nodeData.memoryMode === 'Last 10 Messages' || nodeData.memoryMode === 'Last 50 Messages') && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Message Reference Count: {nodeData.messageReferenceCount || '10'}</label>
                  <input
                    type="range"
                    min="1" max="50" step="1"
                    value={nodeData.messageReferenceCount || 10}
                    onChange={(e) => handleChange('messageReferenceCount', parseInt(e.target.value, 10))}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>

            <div className="af-field" style={{ marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
               <label className="af-field-label">AI Tasks</label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '8px' }}>
                  <input type="checkbox" checked={nodeData.enableVision} onChange={(e) => handleChange('enableVision', e.target.checked)} />
                  Image Understanding (Vision)
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '8px' }}>
                  <input type="checkbox" checked={nodeData.enableAudio} onChange={(e) => handleChange('enableAudio', e.target.checked)} />
                  Audio Understanding
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '8px' }}>
                  <input type="checkbox" checked={nodeData.enableDocument} onChange={(e) => handleChange('enableDocument', e.target.checked)} />
                  Document Understanding
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '8px' }}>
                  <input type="checkbox" checked={nodeData.enableWebSearch} onChange={(e) => handleChange('enableWebSearch', e.target.checked)} />
                  Web Search
               </label>
            </div>

            <div className="af-field" style={{ marginTop: '15px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
              <label className="af-field-label">System Prompt</label>
              <textarea
                className="af-textarea"
                rows={5}
                value={nodeData.systemPrompt || ''}
                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                placeholder="You are a helpful AI assistant. Available variables: {{senderName}}, {{senderMobile}}, {{savedVariables.xyz}}"
              />
            </div>
            
            <div className="af-field">
              <label className="af-field-label">Save Output Into Variable</label>
              <input
                className="af-input"
                value={nodeData.saveResponseVariable || 'ai_response'}
                onChange={(e) => handleChange('saveResponseVariable', e.target.value)}
                placeholder="ai_response"
              />
            </div>
          </div>
        )}

        {type === 'Set Chat Labels' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">Add Labels (Comma Separated)</label>
              <input
                className="af-input"
                value={nodeData.labels?.join(', ') || ''}
                onChange={(e) => handleChange('labels', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="e.g. Lead, VIP, Interested"
              />
            </div>
          </div>
        )}

        {type === 'Agent Transfer' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">Routing Logic</label>
              <select
                className="af-select"
                value={nodeData.transferType || 'Round Robin'}
                onChange={(e) => handleChange('transferType', e.target.value)}
              >
                <option value="Round Robin">Round Robin Queue</option>
                <option value="Specific Agent">Specific Assigned Agent</option>
                <option value="Department">Department Queue</option>
              </select>
            </div>
            <div className="af-field">
              <label className="af-field-label">Department / Assigned Queue (Optional)</label>
              <input
                className="af-input"
                value={nodeData.department || ''}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="e.g. Sales / Tech Support"
              />
            </div>
          </div>
        )}

        {type === 'Disable Auto-Reply' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">Disable Bot Auto-Replies For</label>
              <select
                className="af-select"
                value={nodeData.disableHours || '24'}
                onChange={(e) => handleChange('disableHours', e.target.value)}
              >
                <option value="1">1 Hour</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours (1 Day)</option>
                <option value="48">48 Hours (2 Days)</option>
                <option value="168">168 Hours (1 Week)</option>
              </select>
            </div>
          </div>
        )}

        {type === 'Send Email' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">To Email Address</label>
              <input
                className="af-input"
                value={nodeData.toEmail || ''}
                onChange={(e) => handleChange('toEmail', e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
            <div className="af-field">
              <label className="af-field-label">Subject</label>
              <input
                className="af-input"
                value={nodeData.emailSubject || ''}
                onChange={(e) => handleChange('emailSubject', e.target.value)}
                placeholder="e.g. New Lead Captured"
              />
            </div>
            <div className="af-field">
              <label className="af-field-label">Body Context</label>
              <textarea
                className="af-textarea"
                rows={4}
                value={nodeData.emailBody || ''}
                onChange={(e) => handleChange('emailBody', e.target.value)}
                placeholder="Type email body content here..."
              />
            </div>
          </div>
        )}

        {type === 'Google Sheets' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">Spreadsheet Action</label>
              <select
                className="af-select"
                value={nodeData.sheetAction || 'Create Row'}
                onChange={(e) => handleChange('sheetAction', e.target.value)}
              >
                <option value="Create Row">Add/Create Row</option>
                <option value="Update Row">Update Matching Row</option>
                <option value="Search Row">Look up/Search Row</option>
              </select>
            </div>
          </div>
        )}

        {type === 'Webhook' && (
          <div className="inspector-form-section">
            <div className="af-field">
              <label className="af-field-label">Webhook URL (POST payload)</label>
              <input
                className="af-input"
                value={nodeData.webhookUrl || ''}
                onChange={(e) => handleChange('webhookUrl', e.target.value)}
                placeholder="https://yourserver.com/webhook"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FlowInspector
