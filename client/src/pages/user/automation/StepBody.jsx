function StepBody({ form, setForm }) {
  const bodyLen = form.bodyText?.length || 0
  const maxLen = 1024

  function insertVariable() {
    const vars = extractVariables(form.bodyText)
    const nextNum = vars.length > 0 ? Math.max(...vars.map(Number)) + 1 : 1
    setForm({ ...form, bodyText: form.bodyText + `{{${nextNum}}}` })
  }

  return (
    <div className="af-step-content">
      <h3 className="af-step-title">Message Body</h3>
      <p className="af-step-description">
        Write the main message content. Use {'{{1}}'}, {'{{2}}'}, etc. for dynamic personalization.
        Variables will be replaced with actual values when the template is sent.
      </p>

      <div className="af-form-group">
        <div className="af-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="af-field-label">Body Text</label>
            <button
              type="button"
              className="af-btn af-btn-secondary"
              onClick={insertVariable}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              + Insert Variable
            </button>
          </div>
          <textarea
            className="af-textarea"
            rows={8}
            value={form.bodyText}
            onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
            placeholder="Hello {{1}}, your order #{{2}} has been shipped! Track at {{3}}"
            style={{ minHeight: 180 }}
          />
          <div className={`af-char-counter${bodyLen > 900 ? ' warning' : ''}${bodyLen > maxLen ? ' danger' : ''}`}>
            {bodyLen} / {maxLen}
          </div>
        </div>

        <div className="af-field">
          <label className="af-field-label">Footer Text (Optional)</label>
          <input
            className="af-input"
            value={form.footerText}
            onChange={(e) => setForm({ ...form, footerText: e.target.value })}
            placeholder="e.g. Reply STOP to unsubscribe"
          />
          <span className="af-field-hint">
            Short text shown below the message. Max 60 characters.
          </span>
          <div className={`af-char-counter${(form.footerText?.length || 0) > 50 ? ' warning' : ''}${(form.footerText?.length || 0) > 60 ? ' danger' : ''}`}>
            {form.footerText?.length || 0} / 60
          </div>
        </div>

        {extractVariables(form.bodyText).length > 0 ? (
          <div style={{ padding: '12px 16px', background: 'rgba(30, 160, 133, 0.06)', borderRadius: 12, fontSize: '0.85rem', color: '#1ea085' }}>
            <strong>💡 Variables detected:</strong>{' '}
            {extractVariables(form.bodyText).map(v => `{{${v}}}`).join(', ')}
            <span style={{ display: 'block', marginTop: 4, fontSize: '0.78rem', color: '#607481' }}>
              You will provide example values in Step 5.
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function extractVariables(text) {
  const vars = new Set()
  const pattern = /\{\{\s*(\d+)\s*\}\}/g
  let match = pattern.exec(text || '')
  while (match) {
    vars.add(match[1])
    match = pattern.exec(text || '')
  }
  return Array.from(vars).sort((a, b) => Number(a) - Number(b))
}

export { extractVariables }
export default StepBody
