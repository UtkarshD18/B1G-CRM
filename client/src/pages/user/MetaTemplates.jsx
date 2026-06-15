import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFormRequest, apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { prettyJson } from '../../shared/format'

const buttonTypes = [
  { value: 'QUICK_REPLY', label: 'Quick reply' },
  { value: 'URL', label: 'Website URL' },
  { value: 'PHONE_NUMBER', label: 'Phone number' },
]

function createDefaultForm() {
  return {
    name: '',
    language: 'en_US',
    category: 'UTILITY',
    headerFormat: 'NONE',
    headerText: '',
    mediaHash: '',
    mediaUrl: '',
    bodyText: 'Hello {{1}}, your update is ready.',
    bodyExampleValues: { 1: 'Customer' },
    footerText: '',
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: 'Track order',
        url: '',
        urlExampleValues: {},
        phone_number: '',
      },
    ],
    headerExampleValues: {},
  }
}

function normalizeTemplateName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function extractTemplateVariables(value) {
  const variables = new Set()
  const pattern = /{{\s*(\d+)\s*}}/g
  let match = pattern.exec(value || '')

  while (match) {
    variables.add(match[1])
    match = pattern.exec(value || '')
  }

  return Array.from(variables).sort((left, right) => Number(left) - Number(right))
}

function buildTemplateButtons(buttons = []) {
  return buttons
    .map((button) => ({
      type: button.type || 'QUICK_REPLY',
      text: String(button.text || '').trim(),
      url: String(button.url || '').trim(),
      urlExampleValues: button.urlExampleValues || {},
      phone_number: String(button.phone_number || '').trim(),
    }))
    .filter((button) => button.text)
    .slice(0, 3)
    .map((button) => {
      if (button.type === 'URL') {
        const urlButton = {
          type: 'URL',
          text: button.text,
          url: button.url,
        }
        const variables = extractTemplateVariables(button.url)

        if (variables.length) {
          urlButton.example = variables.map((variable) => button.urlExampleValues?.[variable] || '')
        }

        return urlButton
      }

      if (button.type === 'PHONE_NUMBER') {
        return {
          type: 'PHONE_NUMBER',
          text: button.text,
          phone_number: button.phone_number,
        }
      }

      return {
        type: 'QUICK_REPLY',
        text: button.text,
      }
    })
}

function validateButtons(buttons = []) {
  const activeButtons = buttons.filter((button) =>
    ['text', 'url', 'phone_number'].some((key) => String(button?.[key] || '').trim()),
  )

  if (activeButtons.length > 3) {
    return 'Meta templates support up to 3 buttons in this builder.'
  }

  for (const [index, button] of activeButtons.entries()) {
    const rowNumber = index + 1
    const text = String(button.text || '').trim()
    const url = String(button.url || '').trim()
    const phone = String(button.phone_number || '').trim()

    if (!text) {
      return `Button ${rowNumber} needs button text.`
    }

    if (button.type === 'URL' && !/^https?:\/\//i.test(url)) {
      return `Button ${rowNumber} URL must start with http:// or https://.`
    }

    if (button.type === 'URL') {
      const variables = extractTemplateVariables(url)
      if (variables.length > 1) {
        return `Button ${rowNumber} URL supports one dynamic variable.`
      }

      const missingExample = variables.find((variable) => !String(button.urlExampleValues?.[variable] || '').trim())
      if (missingExample) {
        return `Button ${rowNumber} URL variable {{${missingExample}}} needs an example URL.`
      }

      const invalidExample = variables.find((variable) => !/^https?:\/\//i.test(String(button.urlExampleValues?.[variable] || '').trim()))
      if (invalidExample) {
        return `Button ${rowNumber} URL example must start with http:// or https://.`
      }
    }

    if (button.type === 'PHONE_NUMBER' && !phone) {
      return `Button ${rowNumber} needs a phone number.`
    }
  }

  return ''
}

function buildComponents(form) {
  const components = []

  if (form.headerFormat === 'TEXT' && form.headerText.trim()) {
    const headerComponent = {
      type: 'HEADER',
      format: 'TEXT',
      text: form.headerText.trim(),
    }
    const headerVariables = extractTemplateVariables(form.headerText)

    if (headerVariables.length) {
      headerComponent.example = {
        header_text: headerVariables.map((variable) => form.headerExampleValues?.[variable] || `Header ${variable}`),
      }
    }

    components.push(headerComponent)
  }

  if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat) && form.mediaHash) {
    components.push({
      type: 'HEADER',
      format: form.headerFormat,
      example: {
        header_handle: [form.mediaHash],
      },
    })
  }

  const bodyComponent = {
    type: 'BODY',
    text: form.bodyText.trim(),
  }
  const bodyVariables = extractTemplateVariables(form.bodyText)

  if (bodyVariables.length) {
    bodyComponent.example = {
      body_text: [
        bodyVariables.map((variable) => form.bodyExampleValues?.[variable] || `Example ${variable}`),
      ],
    }
  }

  components.push(bodyComponent)

  if (form.footerText.trim()) {
    components.push({
      type: 'FOOTER',
      text: form.footerText.trim(),
    })
  }

  const buttons = buildTemplateButtons(form.buttons)

  if (buttons.length > 0) {
    components.push({
      type: 'BUTTONS',
      buttons,
    })
  }

  return components
}

function statusTone(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'APPROVED') {
    return 'Configured'
  }
  if (normalized === 'REJECTED') {
    return 'Needs review'
  }
  return normalized || 'Pending'
}

function UserMetaTemplatesPage() {
  const { tokens } = useAuth()
  const [status, setStatus] = useState('Loading Meta templates...')
  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState(createDefaultForm)
  const [mediaFile, setMediaFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  const payload = useMemo(
    () => ({
      name: normalizeTemplateName(form.name),
      language: form.language.trim() || 'en_US',
      category: form.category,
      components: buildComponents(form),
    }),
    [form],
  )
  const headerVariables = useMemo(
    () => (form.headerFormat === 'TEXT' ? extractTemplateVariables(form.headerText) : []),
    [form.headerFormat, form.headerText],
  )
  const bodyVariables = useMemo(() => extractTemplateVariables(form.bodyText), [form.bodyText])

  const loadTemplates = useCallback(async () => {
    setStatus('Loading Meta templates...')
    try {
      const result = await apiRequest('/api/user/get_my_meta_templets', { token: tokens.user })
      if (!result?.success) {
        setTemplates([])
        setStatus(result?.msg || 'Unable to load Meta templates')
        return
      }

      setTemplates(Array.isArray(result.data) ? result.data : [])
      setStatus('')
    } catch (error) {
      setTemplates([])
      setStatus(error.message || 'Unable to load Meta templates')
    }
  }, [tokens.user])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  async function createTemplate(event) {
    event.preventDefault()

    if (!payload.name) {
      setStatus('Template name is required and must contain letters, numbers, or underscores.')
      return
    }

    if (!form.bodyText.trim()) {
      setStatus('Body text is required.')
      return
    }

    const missingHeaderExample = headerVariables.find((variable) => !String(form.headerExampleValues?.[variable] || '').trim())
    if (missingHeaderExample) {
      setStatus(`Header variable {{${missingHeaderExample}}} needs an example value.`)
      return
    }

    const missingBodyExample = bodyVariables.find((variable) => !String(form.bodyExampleValues?.[variable] || '').trim())
    if (missingBodyExample) {
      setStatus(`Body variable {{${missingBodyExample}}} needs an example value.`)
      return
    }

    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat) && !form.mediaHash) {
      setStatus('Upload header media before submitting this template.')
      return
    }

    const buttonError = validateButtons(form.buttons)
    if (buttonError) {
      setStatus(buttonError)
      return
    }

    setSubmitting(true)
    setStatus('Submitting template to Meta...')
    try {
      const result = await apiRequest('/api/user/add_meta_templet', {
        method: 'POST',
        token: tokens.user,
        body: payload,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create Meta template')
        return
      }

      setForm(createDefaultForm())
      setMediaFile(null)
      setStatus(result.msg || 'Template submitted for Meta review.')
      loadTemplates()
    } catch (error) {
      setStatus(error.message || 'Unable to create Meta template')
    } finally {
      setSubmitting(false)
    }
  }

  async function uploadHeaderMedia(event) {
    event.preventDefault()

    if (!payload.name) {
      setStatus('Template name is required before uploading header media.')
      return
    }

    if (!mediaFile) {
      setStatus('Choose a header media file first.')
      return
    }

    const formData = new FormData()
    formData.append('templet_name', payload.name)
    formData.append('file', mediaFile)

    setUploadingMedia(true)
    setStatus('Uploading header media to Meta...')
    try {
      const result = await apiFormRequest('/api/user/return_media_url_meta', {
        token: tokens.user,
        formData,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to upload header media')
        return
      }

      setForm((current) => ({
        ...current,
        mediaHash: result.hash || '',
        mediaUrl: result.url || '',
      }))
      setStatus('Header media uploaded.')
    } catch (error) {
      setStatus(error.message || 'Unable to upload header media')
    } finally {
      setUploadingMedia(false)
    }
  }

  async function deleteTemplate(name) {
    if (!name) {
      return
    }

    setStatus(`Deleting ${name}...`)
    try {
      const result = await apiRequest('/api/user/del_meta_templet', {
        method: 'POST',
        token: tokens.user,
        body: { name },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete Meta template')
        return
      }

      setStatus(result.msg || 'Template deleted.')
      loadTemplates()
    } catch (error) {
      setStatus(error.message || 'Unable to delete Meta template')
    }
  }

  function updateTemplateButton(index, changes) {
    setForm((current) => ({
      ...current,
      buttons: current.buttons.map((button, buttonIndex) => {
        if (buttonIndex !== index) {
          return button
        }

        const nextButton = { ...button, ...changes }
        if (changes.type === 'QUICK_REPLY') {
          return { ...nextButton, url: '', urlExampleValues: {}, phone_number: '' }
        }
        if (changes.type === 'URL') {
          return { ...nextButton, phone_number: '' }
        }
        if (changes.type === 'PHONE_NUMBER') {
          return { ...nextButton, url: '', urlExampleValues: {} }
        }
        return nextButton
      }),
    }))
  }

  function addTemplateButton() {
    setForm((current) => {
      if (current.buttons.length >= 3) {
        return current
      }

      return {
        ...current,
        buttons: [
          ...current.buttons,
          {
            type: 'QUICK_REPLY',
            text: '',
            url: '',
            urlExampleValues: {},
            phone_number: '',
          },
        ],
      }
    })
  }

  function removeTemplateButton(index) {
    setForm((current) => ({
      ...current,
      buttons: current.buttons.filter((_, buttonIndex) => buttonIndex !== index),
    }))
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">meta templates</span>
          <h2>Create Meta Template</h2>
          <p>Submit WhatsApp Cloud API templates for review and keep campaigns aligned to approved template names.</p>
        </div>
        <button className="primary-button" type="button" onClick={loadTemplates}>
          Refresh
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={createTemplate}>
          <div className="panel-header">
            <h2>Template request</h2>
          </div>
          <div className="form-grid">
            <label>
              Template name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="order_update"
              />
            </label>
            <label>
              Language
              <input value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} />
            </label>
            <label>
              Category
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="UTILITY">Utility</option>
                <option value="MARKETING">Marketing</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
            </label>
          </div>
          <label>
            Header type
            <select
              value={form.headerFormat}
              onChange={(event) =>
                setForm({
                  ...form,
                  headerFormat: event.target.value,
                  mediaHash: '',
                  mediaUrl: '',
                  headerExampleValues: {},
                })
              }
            >
              <option value="NONE">No header</option>
              <option value="TEXT">Text header</option>
              <option value="IMAGE">Image header</option>
              <option value="VIDEO">Video header</option>
              <option value="DOCUMENT">Document header</option>
            </select>
          </label>
          {form.headerFormat === 'TEXT' ? (
            <label>
              Header text
              <input
                value={form.headerText}
                onChange={(event) => setForm({ ...form, headerText: event.target.value })}
                placeholder="Optional short header"
              />
            </label>
          ) : null}
          {headerVariables.length ? (
            <div className="variable-example-grid">
              <span className="eyebrow">Header examples</span>
              {headerVariables.map((variable) => (
                <label key={variable}>
                  Header {`{{${variable}}}`} example
                  <input
                    value={form.headerExampleValues?.[variable] || ''}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        headerExampleValues: {
                          ...form.headerExampleValues,
                          [variable]: event.target.value,
                        },
                      })
                    }
                    placeholder={`Header sample ${variable}`}
                  />
                </label>
              ))}
            </div>
          ) : null}
          {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat) ? (
            <div className="form-panel">
              <label>
                Header media file
                <input type="file" onChange={(event) => setMediaFile(event.target.files?.[0] || null)} />
              </label>
              <div className="action-row">
                <button className="secondary-button dark-text" type="button" onClick={uploadHeaderMedia} disabled={uploadingMedia}>
                  {uploadingMedia ? 'Uploading...' : 'Upload header media'}
                </button>
              </div>
              <div className="meta-block">
                <p>Media hash: {form.mediaHash || 'Not uploaded yet.'}</p>
                <p>Media URL: {form.mediaUrl || 'N/A'}</p>
              </div>
            </div>
          ) : null}
          <label>
            Body text
            <textarea
              rows={5}
              value={form.bodyText}
              onChange={(event) => setForm({ ...form, bodyText: event.target.value })}
            />
          </label>
          {bodyVariables.length ? (
            <div className="variable-example-grid">
              <span className="eyebrow">Variable examples</span>
              {bodyVariables.map((variable) => (
                <label key={variable}>
                  Body {`{{${variable}}}`} example
                  <input
                    value={form.bodyExampleValues?.[variable] || ''}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        bodyExampleValues: {
                          ...form.bodyExampleValues,
                          [variable]: event.target.value,
                        },
                      })
                    }
                    placeholder={`Body sample ${variable}`}
                  />
                </label>
              ))}
            </div>
          ) : null}
          <label>
            Footer text
            <input
              value={form.footerText}
              onChange={(event) => setForm({ ...form, footerText: event.target.value })}
              placeholder="Optional footer"
            />
          </label>
          <div className="template-button-builder">
            <div className="panel-header">
              <div>
                <h2>Template buttons</h2>
                <p>Use up to 3 quick reply, URL, or phone buttons.</p>
              </div>
              <button
                className="secondary-button dark-text"
                type="button"
                onClick={addTemplateButton}
                disabled={form.buttons.length >= 3}
              >
                Add button
              </button>
            </div>
            {form.buttons.map((button, index) => (
              <div className="template-button-row" key={`button-${index}`}>
                <label>
                  Button {index + 1} type
                  <select
                    value={button.type}
                    onChange={(event) => updateTemplateButton(index, { type: event.target.value })}
                  >
                    {buttonTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Button {index + 1} text
                  <input
                    value={button.text}
                    onChange={(event) => updateTemplateButton(index, { text: event.target.value })}
                    placeholder="Button label"
                  />
                </label>
                {button.type === 'URL' ? (
                  <>
                    <label>
                      Button {index + 1} URL
                      <input
                        value={button.url}
                        onChange={(event) => updateTemplateButton(index, { url: event.target.value })}
                        placeholder="https://example.com/order/{{1}}"
                      />
                    </label>
                    {extractTemplateVariables(button.url).map((variable) => (
                      <label key={variable}>
                        Button {index + 1} URL {`{{${variable}}}`} example
                        <input
                          value={button.urlExampleValues?.[variable] || ''}
                          onChange={(event) =>
                            updateTemplateButton(index, {
                              urlExampleValues: {
                                ...button.urlExampleValues,
                                [variable]: event.target.value,
                              },
                            })
                          }
                          placeholder="https://example.com/order/12345"
                        />
                      </label>
                    ))}
                  </>
                ) : null}
                {button.type === 'PHONE_NUMBER' ? (
                  <label>
                    Button {index + 1} phone number
                    <input
                      value={button.phone_number}
                      onChange={(event) => updateTemplateButton(index, { phone_number: event.target.value })}
                      placeholder="+12025550184"
                    />
                  </label>
                ) : null}
                <button
                  className="mini-button subtle-danger"
                  type="button"
                  onClick={() => removeTemplateButton(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            {!form.buttons.length ? <p className="muted-copy">No buttons added.</p> : null}
          </div>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit to Meta'}
          </button>
        </form>

        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Payload preview</h2>
          </div>
          <p className="muted-copy">This JSON is sent to Meta through the existing backend template endpoint.</p>
          <pre className="code-block">{prettyJson(payload)}</pre>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="panel-header">
          <h2>Meta templates</h2>
          <span className="status-chip">{templates.length} loaded</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Category</th>
              <th>Language</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id || template.name}>
                <td>{template.name}</td>
                <td>{statusTone(template.status)}</td>
                <td>{template.category || 'N/A'}</td>
                <td>{template.language || 'N/A'}</td>
                <td>
                  <button
                    className="mini-button subtle-danger"
                    type="button"
                    onClick={() => deleteTemplate(template.name)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!templates.length ? (
              <tr>
                <td colSpan="5">No templates loaded from Meta yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserMetaTemplatesPage
