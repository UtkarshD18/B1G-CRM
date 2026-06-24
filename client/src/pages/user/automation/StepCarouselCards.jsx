import { useState } from 'react'

function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const BUTTON_TYPES = [
  { value: 'QUICK_REPLY', label: 'Quick Reply', icon: '↩️' },
  { value: 'URL', label: 'Website URL', icon: '🌐' },
  { value: 'PHONE_NUMBER', label: 'Phone Number', icon: '📞' },
]

function StepCarouselCards({ form, setForm, selectedCardIndex, setSelectedCardIndex }) {
  const [dragActive, setDragActive] = useState(false)

  const cards = form.carouselCards || []

  const activeCard = cards[selectedCardIndex] || {
    selectedMediaFile: null,
    mediaPreviewUrl: '',
    mediaFilename: '',
    mediaFilesize: '',
    mediaHash: '',
    mediaUrl: '',
    bodyText: '',
    buttons: []
  }

  // Sync button structures across all cards
  function syncButtons(updatedButtons) {
    setForm((prev) => {
      const prevCards = prev.carouselCards || []
      const nextCards = prevCards.map((c) => {
        const nextButtons = updatedButtons.map((btnTemplate, btnIdx) => {
          const existingBtn = c.buttons?.[btnIdx]
          if (existingBtn && existingBtn.type === btnTemplate.type) {
            return existingBtn
          }
          return {
            type: btnTemplate.type,
            text: '',
            url: '',
            phone_number: '',
          }
        })
        return { ...c, buttons: nextButtons }
      })
      return { ...prev, carouselCards: nextCards }
    })
  }

  function updateActiveCard(changes) {
    setForm((prev) => {
      const prevCards = prev.carouselCards || []
      const nextCards = prevCards.map((c, i) => (i === selectedCardIndex ? { ...c, ...changes } : c))
      return { ...prev, carouselCards: nextCards }
    })
  }

  function handleFileChange(file) {
    if (!file) return
    const ext = file.name?.split('.').pop()?.toLowerCase()
    const isAllowedImage = ['image/jpeg', 'image/png'].includes(file.type) || ['jpg', 'jpeg', 'png'].includes(ext)
    if (!isAllowedImage) {
      alert('Please upload an image file (PNG or JPG) only.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB.')
      return
    }

    if (activeCard.mediaPreviewUrl) {
      URL.revokeObjectURL(activeCard.mediaPreviewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    updateActiveCard({
      selectedMediaFile: file,
      mediaPreviewUrl: previewUrl,
      mediaFilename: file.name,
      mediaFilesize: formatBytes(file.size),
    })
  }

  function handleRemoveFile() {
    if (activeCard.mediaPreviewUrl) {
      URL.revokeObjectURL(activeCard.mediaPreviewUrl)
    }
    updateActiveCard({
      selectedMediaFile: null,
      mediaPreviewUrl: '',
      mediaFilename: '',
      mediaFilesize: '',
      mediaHash: '',
      mediaUrl: '',
    })
  }

  // Card list actions
  function addCard() {
    if (cards.length >= 10) return
    const firstCardButtons = cards[0]?.buttons || []
    const newButtons = firstCardButtons.map((btn) => ({
      type: btn.type,
      text: '',
      url: '',
      phone_number: '',
    }))

    const newCard = {
      selectedMediaFile: null,
      mediaPreviewUrl: '',
      mediaFilename: '',
      mediaFilesize: '',
      mediaHash: '',
      mediaUrl: '',
      bodyText: '',
      buttons: newButtons,
    }

    const nextCards = [...cards, newCard]
    setForm((prev) => ({ ...prev, carouselCards: nextCards }))
    setSelectedCardIndex(nextCards.length - 1)
  }

  function deleteCard(index) {
    if (cards.length <= 2) return
    const cardToDelete = cards[index]
    if (cardToDelete.mediaPreviewUrl) {
      URL.revokeObjectURL(cardToDelete.mediaPreviewUrl)
    }
    const nextCards = cards.filter((_, i) => i !== index)
    setForm((prev) => ({ ...prev, carouselCards: nextCards }))
    setSelectedCardIndex(Math.max(0, index - 1))
  }

  function duplicateCard(index) {
    if (cards.length >= 10) return
    const cardToCopy = cards[index]
    if (!cardToCopy) return

    // Deep clone the card object
    const clonedCard = structuredClone(cardToCopy)

    // structuredClone clones most values, but manually preserve the File reference and generate a new object URL
    clonedCard.selectedMediaFile = cardToCopy.selectedMediaFile
    if (cardToCopy.selectedMediaFile) {
      clonedCard.mediaPreviewUrl = URL.createObjectURL(cardToCopy.selectedMediaFile)
    }

    const nextCards = [...cards]
    nextCards.splice(index + 1, 0, clonedCard)
    setForm((prev) => ({ ...prev, carouselCards: nextCards }))
    setSelectedCardIndex(index + 1)
  }

  // Button actions
  function addButton() {
    if ((activeCard.buttons || []).length >= 2) return
    const nextButtons = [
      ...(activeCard.buttons || []),
      { type: 'QUICK_REPLY', text: '', url: '', phone_number: '' },
    ]
    syncButtons(nextButtons)
  }

  function removeButton(btnIndex) {
    const nextButtons = (activeCard.buttons || []).filter((_, i) => i !== btnIndex)
    syncButtons(nextButtons)
  }

  function updateButtonValue(btnIndex, changes) {
    setForm((prev) => {
      const prevCards = prev.carouselCards || []
      const nextCards = prevCards.map((c, i) => {
        if (i !== selectedCardIndex) return c
        const nextButtons = (c.buttons || []).map((btn, j) => (j === btnIndex ? { ...btn, ...changes } : btn))
        return { ...c, buttons: nextButtons }
      })
      return { ...prev, carouselCards: nextCards }
    })
  }

  function handleButtonTypeChange(btnIndex, type) {
    const nextButtons = (activeCard.buttons || []).map((btn, j) => {
      if (j !== btnIndex) return btn
      return { type, text: '', url: '', phone_number: '' }
    })
    syncButtons(nextButtons)
  }

  // Drag handlers
  function handleDrag(e) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="af-step-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 className="af-step-title">Carousel Cards Configuration</h3>
          <p className="af-step-description">
            Customize cards for the carousel (2 to 10 cards required).
          </p>
        </div>
        <button
          type="button"
          className="af-btn af-btn-primary"
          onClick={addCard}
          disabled={cards.length >= 10}
        >
          + Add Card
        </button>
      </div>

      {/* Tabs list for selecting active card */}
      <div className="af-tab-bar" style={{ marginBottom: 16, overflowX: 'auto', flexWrap: 'nowrap' }}>
        {cards.map((c, idx) => {
          const hasImage = !!c.selectedMediaFile || !!c.mediaHash
          const hasBody = !!c.bodyText?.trim()
          const isValid = hasImage && hasBody
          return (
            <button
              key={idx}
              type="button"
              className={`af-tab${selectedCardIndex === idx ? ' active' : ''}`}
              onClick={() => setSelectedCardIndex(idx)}
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              Card {idx + 1} {!isValid && <span style={{ color: '#dc2626', marginLeft: 4 }}>●</span>}
            </button>
          )
        })}
      </div>

      {/* Card Editor */}
      <div className="af-button-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Card Editor Header */}
        <div className="af-button-card-header">
          <span className="af-button-card-number" style={{ fontSize: '1rem', fontWeight: 800 }}>
            Editing Card {selectedCardIndex + 1} of {cards.length}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="af-btn af-btn-secondary af-btn-sm"
              onClick={() => duplicateCard(selectedCardIndex)}
              disabled={cards.length >= 10}
            >
              👥 Duplicate
            </button>
            <button
              type="button"
              className="af-button-remove"
              onClick={() => deleteCard(selectedCardIndex)}
              disabled={cards.length <= 2}
              style={{ opacity: cards.length <= 2 ? 0.3 : 1 }}
            >
              ✕ Delete Card
            </button>
          </div>
        </div>

        {/* Media Upload Area */}
        <div className="af-field">
          <label className="af-field-label">Card Image <span style={{ color: '#dc2626' }}>*</span></label>
          {!(activeCard.selectedMediaFile || activeCard.mediaHash) ? (
            <div
              className={`af-dropzone${dragActive ? ' drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{ padding: '24px 16px' }}
            >
              <input
                type="file"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                id={`af-carousel-upload-${selectedCardIndex}`}
                accept="image/png, image/jpeg"
              />
              <label htmlFor={`af-carousel-upload-${selectedCardIndex}`} style={{ cursor: 'pointer', display: 'block' }}>
                <div className="af-dropzone-icon" style={{ fontSize: '1.5rem', marginBottom: 4 }}>🖼️</div>
                <div className="af-dropzone-text" style={{ fontSize: '0.82rem' }}>
                  Drag & Drop or <strong>Click to Upload Image</strong>
                </div>
                <div className="af-dropzone-hint" style={{ fontSize: '0.7rem' }}>
                  PNG, JPG up to 5MB
                </div>
              </label>
            </div>
          ) : (
            <div className="af-media-details-card" style={{ marginTop: 0 }}>
              <div className="af-media-details-preview-side" style={{ width: 60, height: 60 }}>
                {activeCard.mediaPreviewUrl || activeCard.mediaUrl ? (
                  <img
                    src={activeCard.mediaPreviewUrl || activeCard.mediaUrl}
                    alt="Thumbnail"
                    className="af-media-details-thumbnail"
                  />
                ) : (
                  <span>🖼️</span>
                )}
              </div>
              <div className="af-media-details-info">
                <span className="af-media-filename" style={{ fontSize: '0.8rem' }}>
                  ✓ {activeCard.mediaFilename || (activeCard.mediaHash ? `Media Persisted` : 'image')}
                </span>
                {activeCard.mediaFilesize && (
                  <span className="af-media-filesize" style={{ fontSize: '0.72rem' }}>
                    {activeCard.mediaFilesize}
                  </span>
                )}
              </div>
              <div className="af-media-details-actions">
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                  id={`af-carousel-replace-${selectedCardIndex}`}
                  accept="image/png, image/jpeg"
                />
                <label
                  htmlFor={`af-carousel-replace-${selectedCardIndex}`}
                  className="af-btn af-btn-secondary af-btn-sm"
                >
                  Replace
                </label>
                <button
                  type="button"
                  className="af-btn af-btn-danger af-btn-sm"
                  onClick={handleRemoveFile}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card Body Text */}
        <div className="af-field">
          <label className="af-field-label">Card Body Text <span style={{ color: '#dc2626' }}>*</span></label>
          <textarea
            className="af-textarea"
            rows={3}
            value={activeCard.bodyText}
            onChange={(e) => updateActiveCard({ bodyText: e.target.value })}
            placeholder="Peanut Butter crunchy..."
            maxLength={160}
          />
          <div className="af-char-counter">
            {activeCard.bodyText?.length || 0} / 160
          </div>
        </div>

        {/* Card Buttons */}
        <div className="af-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="af-field-label">Card Buttons ({activeCard.buttons?.length || 0}/2)</label>
            <button
              type="button"
              className="af-btn af-btn-secondary af-btn-sm"
              onClick={addButton}
              disabled={activeCard.buttons?.length >= 2}
            >
              + Add Button
            </button>
          </div>

          {(activeCard.buttons || []).map((btn, btnIdx) => (
            <div
              key={btnIdx}
              className="af-button-card"
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-color)',
                padding: 12,
                marginTop: 8,
              }}
            >
              <div className="af-button-card-header" style={{ marginBottom: 8 }}>
                <span className="af-button-card-number">Button {btnIdx + 1}</span>
                <button
                  type="button"
                  className="af-button-remove"
                  onClick={() => removeButton(btnIdx)}
                  style={{ fontSize: '0.72rem', padding: '2px 6px' }}
                >
                  Remove
                </button>
              </div>

              <div className="af-button-card-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10 }}>
                {/* Button Type selection */}
                <div className="af-field">
                  <label className="af-field-label" style={{ fontSize: '0.72rem' }}>Type</label>
                  <select
                    className="af-select"
                    value={btn.type}
                    onChange={(e) => handleButtonTypeChange(btnIdx, e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                  >
                    {BUTTON_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Button label */}
                <div className="af-field">
                  <label className="af-field-label" style={{ fontSize: '0.72rem' }}>Label</label>
                  <input
                    className="af-input"
                    value={btn.text}
                    onChange={(e) => updateButtonValue(btnIdx, { text: e.target.value })}
                    placeholder="e.g. Shop Now"
                    maxLength={20}
                    style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                  />
                  <div className="af-char-counter" style={{ fontSize: '0.65rem' }}>
                    {btn.text?.length || 0} / 20
                  </div>
                </div>
              </div>

              {/* Dynamic URL / Phone fields */}
              {btn.type === 'URL' && (
                <div className="af-field" style={{ marginTop: 8 }}>
                  <label className="af-field-label" style={{ fontSize: '0.72rem' }}>Target Website URL</label>
                  <input
                    className="af-input"
                    value={btn.url}
                    onChange={(e) => updateButtonValue(btnIdx, { url: e.target.value })}
                    placeholder="https://example.com"
                    style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                  />
                </div>
              )}

              {btn.type === 'PHONE_NUMBER' && (
                <div className="af-field" style={{ marginTop: 8 }}>
                  <label className="af-field-label" style={{ fontSize: '0.72rem' }}>Phone Number</label>
                  <input
                    className="af-input"
                    value={btn.phone_number}
                    onChange={(e) => updateButtonValue(btnIdx, { phone_number: e.target.value })}
                    placeholder="+919876543210"
                    style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Guidelines info card */}
      <div
        className="af-field"
        style={{
          marginTop: 20,
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 14,
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <strong>📌 Carousel Guidelines:</strong>
        <ul style={{ margin: '6px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>Provide between 2 and 10 cards.</li>
          <li>Every card requires a JPG/PNG image under 5MB.</li>
          <li>Card body text has a maximum limit of 160 characters.</li>
          <li>All cards in the carousel must use identical button types and orders (Auto-synced).</li>
        </ul>
      </div>
    </div>
  )
}

export default StepCarouselCards
