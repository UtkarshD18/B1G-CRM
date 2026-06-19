import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

const PROVIDER_OPTIONS = [
  { key: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { key: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-1.5-flash' },
  { key: 'claude', label: 'Anthropic Claude', defaultModel: 'claude-3-5-sonnet-20240620' },
  { key: 'openrouter', label: 'OpenRouter', defaultModel: 'meta-llama/llama-3-8b-instruct:free' },
  { key: 'ollama', label: 'Ollama (Local LLM)', defaultModel: 'llama3' },
  { key: 'custom', label: 'Custom Endpoint', defaultModel: 'custom-model' }
]

function UserAiProvidersPage() {
  const { tokens } = useAuth()
  const [status, setStatus] = useState('Loading configurations...')
  const [providers, setProviders] = useState([])
  const [selectedProvider, setSelectedProvider] = useState('gemini')
  const [form, setForm] = useState({
    api_key: '',
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    enabled: 1,
    custom_endpoint: ''
  })

  const loadProviders = useCallback(async () => {
    setStatus('Loading configurations...')
    try {
      const result = await apiRequest('/api/ai_providers/get_all', { token: tokens.user })
      if (result?.success && Array.isArray(result.data)) {
        setProviders(result.data)
        // Set form if selected provider has existing configuration
        const active = result.data.find(p => p.provider === selectedProvider)
        if (active) {
          setForm({
            api_key: active.api_key || '',
            model: active.model || '',
            temperature: Number(active.temperature) || 0.7,
            enabled: Number(active.enabled),
            custom_endpoint: active.custom_endpoint || ''
          })
        }
      }
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load AI configurations')
    }
  }, [tokens.user, selectedProvider])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  const handleProviderChange = (e) => {
    const provKey = e.target.value
    setSelectedProvider(provKey)
    const opt = PROVIDER_OPTIONS.find(o => o.key === provKey)
    const existing = providers.find(p => p.provider === provKey)
    if (existing) {
      setForm({
        api_key: existing.api_key || '',
        model: existing.model || '',
        temperature: Number(existing.temperature) || 0.7,
        enabled: Number(existing.enabled),
        custom_endpoint: existing.custom_endpoint || ''
      })
    } else {
      setForm({
        api_key: '',
        model: opt ? opt.defaultModel : '',
        temperature: 0.7,
        enabled: 1,
        custom_endpoint: provKey === 'ollama' ? 'http://localhost:11434/v1/chat/completions' : ''
      })
    }
  }

  async function saveConfiguration(event) {
    event.preventDefault()
    setStatus('Saving AI configuration...')
    try {
      const result = await apiRequest('/api/ai_providers/save', {
        method: 'POST',
        token: tokens.user,
        body: {
          provider: selectedProvider,
          ...form
        }
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Failed to save configuration')
        return
      }

      setStatus('AI configuration saved successfully.')
      loadProviders()
      window.setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus(error.message || 'Failed to save configuration')
    }
  }

  async function toggleProvider(provKey, currentState) {
    setStatus(`Updating status for ${provKey}...`)
    try {
      const result = await apiRequest('/api/ai_providers/toggle', {
        method: 'POST',
        token: tokens.user,
        body: {
          provider: provKey,
          enabled: currentState === 1 ? 0 : 1
        }
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Failed to update provider status')
        return
      }

      setStatus(`Provider status updated.`)
      loadProviders()
      window.setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus(error.message || 'Failed to update provider status')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">artificial intelligence</span>
          <h2>Tenant AI Provider Settings</h2>
          <p>Configure LLM API integrations to drive autopilot conversation agents and knowledge retrievals.</p>
        </div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={saveConfiguration}>
          <div className="panel-header">
            <h2>AI Provider Config</h2>
          </div>
          <label>
            Select AI Provider
            <select value={selectedProvider} onChange={handleProviderChange}>
              {PROVIDER_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </label>

          {selectedProvider !== 'ollama' && (
            <label>
              API Key
              <input
                type="password"
                value={form.api_key}
                onChange={e => setForm({ ...form, api_key: e.target.value })}
                placeholder="sk-..."
                required={selectedProvider !== 'custom'}
              />
            </label>
          )}

          <label>
            Model Identifier
            <input
              type="text"
              value={form.model}
              onChange={e => setForm({ ...form, model: e.target.value })}
              placeholder="e.g. gpt-4o-mini"
              required
            />
          </label>

          {(selectedProvider === 'ollama' || selectedProvider === 'custom') && (
            <label>
              Custom API Endpoint URL
              <input
                type="text"
                value={form.custom_endpoint}
                onChange={e => setForm({ ...form, custom_endpoint: e.target.value })}
                placeholder="http://localhost:11434/v1/chat/completions"
                required
              />
            </label>
          )}

          <label>
            Temperature ({form.temperature})
            <input
              type="range"
              min="0"
              max="1.2"
              step="0.1"
              value={form.temperature}
              onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })}
            />
          </label>

          <label>
            Status
            <select value={form.enabled} onChange={e => setForm({ ...form, enabled: parseInt(e.target.value, 10) })}>
              <option value={1}>Enabled</option>
              <option value={0}>Disabled</option>
            </select>
          </label>

          <button className="primary-button" type="submit">
            Save Settings
          </button>
        </form>

        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Active Configurations</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Model</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDER_OPTIONS.map(opt => {
                const config = providers.find(p => p.provider === opt.key)
                return (
                  <tr key={opt.key}>
                    <td><strong>{opt.label}</strong></td>
                    <td>{config ? config.model : <em className="muted-copy">Not configured</em>}</td>
                    <td>
                      <span className={`status-chip ${config?.enabled === 1 ? 'active' : 'inactive'}`}>
                        {config?.enabled === 1 ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      {config ? (
                        <button
                          className="mini-button dark-text"
                          type="button"
                          onClick={() => toggleProvider(opt.key, config.enabled)}
                        >
                          {config.enabled === 1 ? 'Disable' : 'Enable'}
                        </button>
                      ) : (
                        <button
                          className="mini-button"
                          type="button"
                          onClick={() => handleProviderChange({ target: { value: opt.key } })}
                        >
                          Configure
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserAiProvidersPage
