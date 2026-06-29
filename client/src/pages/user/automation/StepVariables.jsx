import { useMemo } from 'react'
import { extractVariables } from './StepBody'

function StepVariables({ form, setForm }) {
  const headerVars = useMemo(
    () => (form.headerFormat === 'TEXT' ? extractVariables(form.headerText) : []),
    [form.headerFormat, form.headerText],
  )
  const bodyVars = useMemo(() => extractVariables(form.bodyText), [form.bodyText])

  const hasAny = headerVars.length > 0 || bodyVars.length > 0

  return (
    <div className="af-step-content">
      <h3 className="af-step-title">Variable Examples</h3>
      <p className="af-step-description">
        Meta requires sample values for every variable in your template.
        These help Meta reviewers understand how variables will be used.
      </p>

      <div className="af-form-group">
        {!hasAny ? (
          <div className="af-empty-state" style={{ padding: '40px 20px' }}>
            <div className="af-empty-icon">📋</div>
            <h4 className="af-empty-title">No variables detected</h4>
            <p className="af-empty-text">
              Add variables like {'{{1}}'} or {'{{2}}'} in your header or body text (Steps 2 & 3) and they will appear here.
            </p>
          </div>
        ) : null}

        {headerVars.length > 0 ? (
          <>
            <div className="af-variable-source">Header Variables</div>
            <div className="af-variable-grid">
              {headerVars.map((v) => (
                <div className="af-variable-card" key={`header-${v}`}>
                  <span className="af-variable-tag">{`{{${v}}}`}</span>
                  <div className="af-field">
                    <input
                      className="af-input"
                      value={form.headerExampleValues?.[v] || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          headerExampleValues: {
                            ...form.headerExampleValues,
                            [v]: e.target.value,
                          },
                        })
                      }
                      placeholder={`Example for header {{${v}}}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {bodyVars.length > 0 ? (
          <>
            <div className="af-variable-source" style={{ marginTop: headerVars.length > 0 ? 16 : 0 }}>
              Body Variables
            </div>
            <div className="af-variable-grid">
              {bodyVars.map((v) => (
                <div className="af-variable-card" key={`body-${v}`}>
                  <span className="af-variable-tag">{`{{${v}}}`}</span>
                  <div className="af-field">
                    <input
                      className="af-input"
                      value={form.bodyExampleValues?.[v] || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          bodyExampleValues: {
                            ...form.bodyExampleValues,
                            [v]: e.target.value,
                          },
                        })
                      }
                      placeholder={`Example for body {{${v}}}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default StepVariables
