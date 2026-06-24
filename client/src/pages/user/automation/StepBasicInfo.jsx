import { extractVariables } from './StepBody'

function StepBasicInfo({ form, setForm }) {
  function updateName(value) {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
    setForm({ ...form, name: normalized })
  }

  const isCarousel = form.templateType === 'CAROUSEL'

  const bodyLen = form.bodyText?.length || 0
  const maxBodyLen = 1024

  function insertVariable() {
    const vars = extractVariables(form.bodyText)
    const nextNum = vars.length > 0 ? Math.max(...vars.map(Number)) + 1 : 1
    setForm({ ...form, bodyText: (form.bodyText || '') + `{{${nextNum}}}` })
  }

  function selectTemplateType(templateType) {
    setForm((prev) => ({
      ...prev,
      templateType,
      headerFormat: templateType === 'CAROUSEL' ? 'NONE' : prev.headerFormat,
      buttons: templateType === 'CATALOG'
        ? []
        : prev.buttons?.length
        ? prev.buttons
        : [{ type: 'QUICK_REPLY', text: 'Track order', url: '', urlExampleValues: {}, phone_number: '' }],
      bodyText: templateType === 'CATALOG' && prev.bodyText === 'Hello {{1}}, your update is ready.'
        ? 'Browse our latest Healthy One Gram products.'
        : prev.bodyText,
      footerText: templateType === 'CATALOG' && !prev.footerText
        ? ''
        : prev.footerText,
    }))
  }

  return (
    <div className="af-step-content">
      <h3 className="af-step-title">Basic Information</h3>
      <p className="af-step-description">
        Choose your template type and set the name, language, and category.
      </p>

      <div className="af-form-group">
        {/* Template Type Selection */}
        <div className="af-field">
          <label className="af-field-label">Template Type</label>
          <div className="af-type-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { value: 'STANDARD', icon: '📝', label: 'Standard', desc: 'Text, media, and buttons' },
              { value: 'CAROUSEL', icon: '🔀', label: 'Carousel', desc: 'Multiple scrolling cards' },
              { value: 'CATALOG', icon: '🛍️', label: 'Catalog', desc: 'Product catalog message' },
            ].map((type) => (
              <button
                type="button"
                key={type.value}
                className={`af-type-card${form.templateType === type.value ? ' selected' : ''}`}
                onClick={() => selectTemplateType(type.value)}
                style={{ textAlign: 'left', alignItems: 'flex-start', padding: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="af-type-card-icon" style={{ fontSize: '1.2rem' }}>{type.icon}</span>
                  <span className="af-type-card-label" style={{ fontSize: '0.9rem', fontWeight: 700 }}>{type.label}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#607481', textAlign: 'left' }}>{type.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name and Language Row */}
        <div className="af-form-row">
          <div className="af-field">
            <label className="af-field-label">Template Name</label>
            <input
              className="af-input"
              value={form.name}
              onChange={(e) => updateName(e.target.value)}
              placeholder="e.g. product_carousel"
              disabled={!!form._editingName}
            />
            <span className="af-field-hint">
              Only lowercase letters, numbers, and underscores allowed.
            </span>
          </div>

          <div className="af-field">
            <label className="af-field-label">Language</label>
            <select
              className="af-select"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            >
              <option value="en_US">🇺🇸 English (US)</option>
              <option value="en_GB">🇬🇧 English (UK)</option>
              <option value="es">🇪🇸 Spanish</option>
              <option value="pt_BR">🇧🇷 Portuguese (BR)</option>
              <option value="fr">🇫🇷 French</option>
              <option value="de">🇩🇪 German</option>
              <option value="it">🇮🇹 Italian</option>
              <option value="hi">🇮🇳 Hindi</option>
              <option value="ar">🇸🇦 Arabic</option>
              <option value="id">🇮🇩 Indonesian</option>
            </select>
          </div>
        </div>

        {/* Category Row */}
        <div className="af-field">
          <label className="af-field-label">Category</label>
          <div className="af-type-grid">
            {[
              { value: 'MARKETING', icon: '📢', label: 'Marketing' },
              { value: 'UTILITY', icon: '⚙️', label: 'Utility' },
              { value: 'AUTHENTICATION', icon: '🔐', label: 'Authentication' },
            ].map((cat) => (
              <button
                type="button"
                key={cat.value}
                className={`af-type-card${form.category === cat.value ? ' selected' : ''}`}
                onClick={() => setForm({ ...form, category: cat.value })}
              >
                <span className="af-type-card-icon">{cat.icon}</span>
                <span className="af-type-card-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message Body (Carousel Mode Only) */}
        {isCarousel && (
          <div className="af-field af-sub-section-animate">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="af-field-label">Message Body (Displayed above cards)</label>
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
              rows={5}
              value={form.bodyText}
              onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
              placeholder="Check out our peanut butter collection! {{1}}"
            />
            <div className={`af-char-counter${bodyLen > 900 ? ' warning' : ''}${bodyLen > maxBodyLen ? ' danger' : ''}`}>
              {bodyLen} / {maxBodyLen}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StepBasicInfo
