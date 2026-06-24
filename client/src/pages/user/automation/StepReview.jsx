import { useMemo } from 'react'
import { extractVariables } from './StepBody'
import { prettyJson } from '../../../shared/format'

function buildBodyComponent(text, exampleValues) {
  const bodyComponent = { type: 'BODY', text: text?.trim() || '' }
  const bodyVars = extractVariables(text)
  if (bodyVars.length) {
    bodyComponent.example = {
      body_text: [bodyVars.map((variable) => exampleValues?.[variable] || `Example ${variable}`)],
    }
  }
  return bodyComponent
}

function buildHeaderComponent(form) {
  if (form.headerFormat === 'TEXT' && form.headerText?.trim()) {
    const headerComponent = { type: 'HEADER', format: 'TEXT', text: form.headerText.trim() }
    const headerVars = extractVariables(form.headerText)
    if (headerVars.length) {
      headerComponent.example = {
        header_text: headerVars.map((variable) => form.headerExampleValues?.[variable] || `Header ${variable}`),
      }
    }
    return headerComponent
  }

  if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat)) {
    const finalHash = form.mediaHash || (form.selectedMediaFile ? 'PENDING_UPLOAD_ON_SUBMIT' : '')
    if (finalHash) {
      return {
        type: 'HEADER',
        format: form.headerFormat,
        example: { header_handle: [finalHash] },
      }
    }
  }

  return null
}

function buildCarouselComponents(form) {
  const components = []

  if (form.bodyText?.trim()) {
    components.push(buildBodyComponent(form.bodyText, form.bodyExampleValues))
  }

  const cards = (form.carouselCards || []).map((card) => {
    const cardComponents = []
    const imageHash = card.mediaHash || (card.selectedMediaFile ? 'PENDING_UPLOAD_ON_SUBMIT' : 'NO_IMAGE')

    cardComponents.push({
      type: 'HEADER',
      format: 'IMAGE',
      example: { header_handle: [imageHash] },
    })

    cardComponents.push({
      type: 'BODY',
      text: card.bodyText?.trim() || '',
    })

    const buttons = (card.buttons || [])
      .filter((button) => button.text?.trim())
      .slice(0, 2)
      .map((button) => {
        if (button.type === 'URL') {
          return { type: 'URL', text: button.text, url: button.url }
        }
        if (button.type === 'PHONE_NUMBER') {
          return { type: 'PHONE_NUMBER', text: button.text, phone_number: button.phone_number }
        }
        return { type: 'QUICK_REPLY', text: button.text }
      })

    if (buttons.length > 0) {
      cardComponents.push({
        type: 'BUTTONS',
        buttons,
      })
    }

    return { components: cardComponents }
  })

  components.push({
    type: 'CAROUSEL',
    cards,
  })

  return components
}

function buildStandardComponents(form) {
  const components = []
  const header = buildHeaderComponent(form)

  if (header) {
    components.push(header)
  }

  components.push(buildBodyComponent(form.bodyText, form.bodyExampleValues))

  if (form.footerText?.trim()) {
    components.push({ type: 'FOOTER', text: form.footerText.trim() })
  }

  const buttons = (form.buttons || [])
    .filter((button) => button.text?.trim())
    .slice(0, 3)
    .map((button) => {
      if (button.type === 'URL') {
        const urlButton = { type: 'URL', text: button.text, url: button.url }
        const vars = extractVariables(button.url)
        if (vars.length) {
          urlButton.example = vars.map((variable) => button.urlExampleValues?.[variable] || '')
        }
        return urlButton
      }
      if (button.type === 'PHONE_NUMBER') {
        return { type: 'PHONE_NUMBER', text: button.text, phone_number: button.phone_number }
      }
      return { type: 'QUICK_REPLY', text: button.text }
    })

  if (buttons.length > 0) {
    components.push({ type: 'BUTTONS', buttons })
  }

  return components
}

function buildCatalogComponents(form) {
  const components = []
  const header = buildHeaderComponent(form)

  if (header) {
    components.push(header)
  }

  components.push(buildBodyComponent(form.bodyText, form.bodyExampleValues))

  if (form.footerText?.trim()) {
    components.push({ type: 'FOOTER', text: form.footerText.trim() })
  }

  components.push({
    type: 'BUTTONS',
    buttons: [
      {
        type: 'CATALOG',
        text: 'View catalog',
      },
    ],
  })

  return components
}

function buildComponents(form) {
  if (form.templateType === 'CAROUSEL') {
    return buildCarouselComponents(form)
  }

  if (form.templateType === 'CATALOG') {
    return buildCatalogComponents(form)
  }

  return buildStandardComponents(form)
}

function validateName(form, errors, passes) {
  if (!form.name?.trim()) {
    errors.push('Template name is required')
  } else if (!/^[a-z0-9_]+$/.test(form.name)) {
    errors.push('Template name must be lowercase letters, numbers, and underscores only')
  } else {
    passes.push('Template name is valid')
  }
}

function validateHeader(form, errors, passes) {
  if (form.headerFormat === 'TEXT') {
    if (!form.headerText?.trim()) {
      errors.push('Header text is required when Text header is selected')
    } else if (form.headerText.length > 60) {
      errors.push('Header text must be 60 characters or fewer')
    } else {
      passes.push('Header text is configured')
    }
  }

  if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat)) {
    if (!form.mediaHash && !form.selectedMediaFile) {
      errors.push('Header media must be uploaded or selected')
    } else {
      passes.push('Header media is configured')
    }
  }

  const headerVars = form.headerFormat === 'TEXT' ? extractVariables(form.headerText) : []
  const missingHeader = headerVars.find((variable) => !form.headerExampleValues?.[variable]?.trim())
  if (missingHeader) {
    errors.push(`Header variable {{${missingHeader}}} needs an example`)
  } else if (headerVars.length) {
    passes.push(`${headerVars.length} header variable(s) have examples`)
  }
}

function validateBodyVariables(form, errors, passes) {
  const bodyVars = extractVariables(form.bodyText)
  const missingBody = bodyVars.find((variable) => !form.bodyExampleValues?.[variable]?.trim())
  if (missingBody) {
    errors.push(`Body variable {{${missingBody}}} needs an example`)
  } else if (bodyVars.length) {
    passes.push(`${bodyVars.length} body variable(s) have examples`)
  }
}

function validateStandard(form, errors, passes) {
  if (!form.bodyText?.trim()) {
    errors.push('Body text is required')
  } else if (form.bodyText.length > 1024) {
    errors.push('Body text must be 1024 characters or fewer')
  } else {
    passes.push('Body text is provided')
  }

  if ((form.footerText?.length || 0) > 60) {
    errors.push('Footer text must be 60 characters or fewer')
  }

  validateHeader(form, errors, passes)
  validateBodyVariables(form, errors, passes)

  const activeButtons = (form.buttons || []).filter((button) => button.text?.trim())
  if (activeButtons.length > 3) {
    errors.push('Max 3 buttons allowed')
  }
  for (const [index, button] of activeButtons.entries()) {
    if (button.type === 'URL' && !/^https?:\/\//i.test(button.url || '')) {
      errors.push(`Button ${index + 1} URL must start with http:// or https://`)
    }
    if (button.type === 'PHONE_NUMBER' && !button.phone_number?.trim()) {
      errors.push(`Button ${index + 1} needs a phone number`)
    }
  }
  if (activeButtons.length > 0) {
    passes.push(`${activeButtons.length} button(s) configured`)
  }
}

function validateCarousel(form, errors, passes) {
  if (!form.bodyText?.trim()) {
    errors.push('Top-level Message Body text is required')
  } else {
    passes.push('Message Body text is provided')
  }

  const cards = form.carouselCards || []
  if (cards.length < 2) {
    errors.push('Carousel must contain at least 2 cards')
  } else if (cards.length > 10) {
    errors.push('Carousel must contain at most 10 cards')
  } else {
    passes.push(`Carousel contains ${cards.length} cards`)
  }

  const allCardsHaveImage = cards.every((card) => card.selectedMediaFile || card.mediaHash || card.mediaUrl)
  const allCardsHaveBody = cards.every((card) => card.bodyText?.trim())

  if (!allCardsHaveImage) {
    errors.push('Every card in the carousel must have an image loaded')
  } else {
    passes.push('All cards have images loaded')
  }

  if (!allCardsHaveBody) {
    errors.push('Every card in the carousel must have card body text')
  } else {
    passes.push('All cards have body text')
  }

  let buttonsMatch = true
  if (cards.length > 1) {
    const firstButtonTypes = (cards[0].buttons || []).map((button) => button.type).join(',')
    for (let index = 1; index < cards.length; index += 1) {
      const currentButtonTypes = (cards[index].buttons || []).map((button) => button.type).join(',')
      if (firstButtonTypes !== currentButtonTypes) {
        buttonsMatch = false
        break
      }
    }
  }

  if (!buttonsMatch) {
    errors.push('All carousel cards must use identical button types')
  } else {
    passes.push('All cards have identical button structures')
  }
}

function validateCatalog(form, errors, passes) {
  const hasThumbnail = !!(
    form.catalogThumbnailFile ||
    form.catalogThumbnailPreviewUrl ||
    form.catalogThumbnailUrl ||
    form.catalogThumbnailFilename
  )

  if (!hasThumbnail) {
    errors.push('Catalog thumbnail is required')
  } else {
    passes.push('Catalog thumbnail is selected locally')
  }

  if (!form.bodyText?.trim()) {
    errors.push('Catalog message body is required')
  } else if (form.bodyText.length > 1024) {
    errors.push('Catalog message body must be 1024 characters or fewer')
  } else {
    passes.push('Catalog message body is provided')
  }

  if ((form.footerText?.length || 0) > 60) {
    errors.push('Catalog footer must be 60 characters or fewer')
  } else if (form.footerText?.trim()) {
    passes.push('Catalog footer is configured')
  }

  validateHeader(form, errors, passes)
  validateBodyVariables(form, errors, passes)
  passes.push('View Catalog button is generated automatically')
}

function validate(form) {
  const errors = []
  const passes = []

  validateName(form, errors, passes)

  if (form.templateType === 'CAROUSEL') {
    validateCarousel(form, errors, passes)
  } else if (form.templateType === 'CATALOG') {
    validateCatalog(form, errors, passes)
  } else {
    validateStandard(form, errors, passes)
  }

  return { errors, passes, isValid: errors.length === 0 }
}

function StepReview({ form, submitting, onSubmit }) {
  const payload = useMemo(
    () => ({
      name: form.name,
      language: form.language || 'en_US',
      category: form.category,
      components: buildComponents(form),
    }),
    [form],
  )

  const validation = useMemo(() => validate(form), [form])

  const categoryLabels = { UTILITY: 'Utility', MARKETING: 'Marketing', AUTHENTICATION: 'Authentication' }
  const typeLabels = { STANDARD: 'Standard', CAROUSEL: 'Carousel', CATALOG: 'Catalog' }
  const isCarousel = form.templateType === 'CAROUSEL'
  const isCatalog = form.templateType === 'CATALOG'
  const thumbnailPreview = form.catalogThumbnailPreviewUrl || form.catalogThumbnailUrl

  return (
    <div className="af-step-content">
      <h3 className="af-step-title">Review & Submit</h3>
      <p className="af-step-description">
        Review your template configuration and submit it to Meta for approval.
      </p>

      <div className="af-review-grid">
        <div>
          <div className="af-review-section">
            <h4>Template Details</h4>
            <div className="af-review-item">
              <span className="af-review-label">Name</span>
              <span className="af-review-value">{form.name || '-'}</span>
            </div>
            <div className="af-review-item">
              <span className="af-review-label">Language</span>
              <span className="af-review-value">{form.language || 'en_US'}</span>
            </div>
            <div className="af-review-item">
              <span className="af-review-label">Category</span>
              <span className="af-review-value">{categoryLabels[form.category] || form.category}</span>
            </div>
            <div className="af-review-item">
              <span className="af-review-label">Template Type</span>
              <span className="af-review-value">{typeLabels[form.templateType] || 'Standard'}</span>
            </div>
            {isCarousel ? (
              <div className="af-review-item">
                <span className="af-review-label">Cards Count</span>
                <span className="af-review-value">{form.carouselCards?.length || 0}</span>
              </div>
            ) : null}
            {!isCarousel && !isCatalog ? (
              <>
                <div className="af-review-item">
                  <span className="af-review-label">Header</span>
                  <span className="af-review-value">{form.headerFormat === 'NONE' ? 'None' : form.headerFormat}</span>
                </div>
                <div className="af-review-item">
                  <span className="af-review-label">Buttons</span>
                  <span className="af-review-value">{form.buttons?.filter((button) => button.text?.trim()).length || 0}</span>
                </div>
              </>
            ) : null}
          </div>

          {isCatalog ? (
            <div className="af-review-section" style={{ marginTop: 16 }}>
              <h4>Catalog Summary</h4>
              <div className="af-catalog-review-thumb">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Catalog thumbnail" />
                ) : (
                  <span>No thumbnail selected</span>
                )}
              </div>
              <div className="af-review-item">
                <span className="af-review-label">Thumbnail</span>
                <span className="af-review-value">{form.catalogThumbnailFilename || 'Required'}</span>
              </div>
              <div className="af-review-item">
                <span className="af-review-label">Body</span>
                <span className="af-review-value">{form.bodyText || '-'}</span>
              </div>
              <div className="af-review-item">
                <span className="af-review-label">Footer</span>
                <span className="af-review-value">{form.footerText || 'None'}</span>
              </div>
              <div className="af-review-item">
                <span className="af-review-label">Button</span>
                <span className="af-review-value">View Catalog (auto)</span>
              </div>
            </div>
          ) : null}

          <div className="af-validation-summary" style={{ marginTop: 16 }}>
            {validation.passes.map((message, index) => (
              <div className="af-validation-ok" key={`ok-${index}`}>OK {message}</div>
            ))}
            {validation.errors.map((message, index) => (
              <div className="af-validation-error" key={`err-${index}`}>ERROR {message}</div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              className="af-btn af-btn-primary"
              disabled={!validation.isValid || submitting}
              onClick={onSubmit}
              style={{ width: '100%', justifyContent: 'center', padding: '14px 24px' }}
            >
              {submitting
                ? 'Submitting...'
                : form._editingName
                  ? 'Update Template'
                  : 'Submit to Meta'}
            </button>
          </div>
        </div>

        <div className="af-review-section" style={{ maxHeight: 500, overflow: 'auto' }}>
          <h4>API Payload</h4>
          <pre className="af-review-json">{prettyJson(payload)}</pre>
        </div>
      </div>
    </div>
  )
}

export { buildComponents, validate }
export default StepReview
