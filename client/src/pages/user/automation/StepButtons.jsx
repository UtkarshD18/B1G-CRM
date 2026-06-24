import { extractVariables } from './StepBody'

const buttonTypes = [
  { value: 'QUICK_REPLY', label: 'Quick Reply', icon: '↩️' },
  { value: 'URL', label: 'Website URL', icon: '🔗' },
  { value: 'PHONE_NUMBER', label: 'Phone Number', icon: '📞' },
]

function StepButtons({ form, setForm }) {
  function updateButton(index, changes) {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.map((button, i) => {
        if (i !== index) return button
        const next = { ...button, ...changes }
        if (changes.type === 'QUICK_REPLY') {
          return { ...next, url: '', urlExampleValues: {}, phone_number: '' }
        }
        if (changes.type === 'URL') {
          return { ...next, phone_number: '' }
        }
        if (changes.type === 'PHONE_NUMBER') {
          return { ...next, url: '', urlExampleValues: {} }
        }
        return next
      }),
    }))
  }

  function addButton() {
    if (form.buttons.length >= 3) return
    setForm((prev) => ({
      ...prev,
      buttons: [
        ...prev.buttons,
        { type: 'QUICK_REPLY', text: '', url: '', urlExampleValues: {}, phone_number: '' },
      ],
    }))
  }

  function removeButton(index) {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="af-step-content">
      <h3 className="af-step-title">Template Buttons</h3>
      <p className="af-step-description">
        Add up to 3 interactive buttons. Quick Reply buttons let users respond with one tap.
        URL buttons open a link. Phone buttons initiate a call.
      </p>

      <div className="af-form-group">
        <div className="af-button-list">
          {form.buttons.map((button, index) => (
            <div className="af-button-card" key={`btn-${index}`}>
              <div className="af-button-card-header">
                <span className="af-button-card-number">Button {index + 1}</span>
                <button
                  type="button"
                  className="af-button-remove"
                  onClick={() => removeButton(index)}
                >
                  ✕ Remove
                </button>
              </div>

              <div className="af-button-card-fields">
                <div className="af-field">
                  <label className="af-field-label">Type</label>
                  <select
                    className="af-select"
                    value={button.type}
                    onChange={(e) => updateButton(index, { type: e.target.value })}
                  >
                    {buttonTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="af-field">
                  <label className="af-field-label">Button Text</label>
                  <input
                    className="af-input"
                    value={button.text}
                    onChange={(e) => updateButton(index, { text: e.target.value })}
                    placeholder="e.g. Track Order"
                  />
                </div>
              </div>

              {button.type === 'URL' ? (
                <div className="af-field">
                  <label className="af-field-label">Button URL</label>
                  <input
                    className="af-input"
                    value={button.url}
                    onChange={(e) => updateButton(index, { url: e.target.value })}
                    placeholder="https://example.com/order/{{1}}"
                  />
                  <span className="af-field-hint">
                    Use {'{{1}}'} for a dynamic URL parameter.
                  </span>
                  {extractVariables(button.url).map((v) => (
                    <div key={v} className="af-field" style={{ marginTop: 8 }}>
                      <label className="af-field-label">URL {'{{' + v + '}}'} Example</label>
                      <input
                        className="af-input"
                        value={button.urlExampleValues?.[v] || ''}
                        onChange={(e) =>
                          updateButton(index, {
                            urlExampleValues: {
                              ...button.urlExampleValues,
                              [v]: e.target.value,
                            },
                          })
                        }
                        placeholder="https://example.com/order/12345"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {button.type === 'PHONE_NUMBER' ? (
                <div className="af-field">
                  <label className="af-field-label">Phone Number</label>
                  <input
                    className="af-input"
                    value={button.phone_number}
                    onChange={(e) => updateButton(index, { phone_number: e.target.value })}
                    placeholder="+12025550184"
                  />
                </div>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            className="af-add-button-btn"
            onClick={addButton}
            disabled={form.buttons.length >= 3}
          >
            + Add Button {form.buttons.length >= 3 ? '(Max 3)' : ''}
          </button>
        </div>

        {!form.buttons.length ? (
          <div style={{ padding: '16px', background: 'rgba(96, 116, 129, 0.06)', borderRadius: 12, fontSize: '0.85rem', color: '#607481' }}>
            💡 No buttons added yet. Buttons are optional but can boost engagement by up to 40%.
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default StepButtons
