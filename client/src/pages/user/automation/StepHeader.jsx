import { useState } from 'react'

function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

function StepHeader({ form, setForm, onStatus }) {
  const [dragActive, setDragActive] = useState(false)

  // Determine active high-level format
  const activeFormatTab = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat)
    ? 'MEDIA'
    : form.headerFormat

  function selectFormat(value) {
    let nextFormat = value
    if (value === 'MEDIA') {
      nextFormat = 'IMAGE' // Default to Image media type
    }
    setForm({
      ...form,
      headerFormat: nextFormat,
      mediaHash: '',
      mediaUrl: '',
      headerText: nextFormat === 'TEXT' ? form.headerText : '',
      headerExampleValues: {},
      selectedMediaFile: null,
      mediaPreviewUrl: '',
      mediaFilename: '',
      mediaFilesize: '',
    })
  }

  function selectMediaType(type) {
    setForm({
      ...form,
      headerFormat: type,
      mediaHash: '',
      mediaUrl: '',
      headerExampleValues: {},
      selectedMediaFile: null,
      mediaPreviewUrl: '',
      mediaFilename: '',
      mediaFilesize: '',
    })
  }

  function handleFileChange(file) {
    if (!file) return

    // Validation
    const format = form.headerFormat
    if (format === 'IMAGE' && !file.type.startsWith('image/')) {
      onStatus?.('Please select an image file (PNG or JPG).')
      return
    }
    if (format === 'VIDEO' && !file.type.startsWith('video/')) {
      onStatus?.('Please select a video file (MP4).')
      return
    }
    if (format === 'DOCUMENT' && file.type !== 'application/pdf') {
      onStatus?.('Please select a PDF document.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setForm({
      ...form,
      selectedMediaFile: file,
      mediaPreviewUrl: previewUrl,
      mediaFilename: file.name,
      mediaFilesize: formatBytes(file.size),
    })
    onStatus?.(`File "${file.name}" added locally for preview.`)
  }

  function handleRemove() {
    if (form.mediaPreviewUrl) {
      URL.revokeObjectURL(form.mediaPreviewUrl)
    }
    setForm({
      ...form,
      selectedMediaFile: null,
      mediaPreviewUrl: '',
      mediaFilename: '',
      mediaFilesize: '',
      mediaHash: '',
      mediaUrl: '',
    })
    onStatus?.('Media file removed.')
  }

  // Drag & drop handlers
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

  const isMediaSelected = form.selectedMediaFile || form.mediaHash

  return (
    <div className="af-step-content">
      <h3 className="af-step-title">Header Configuration</h3>
      <p className="af-step-description">
        Choose how the template header appears. Text headers support variables. Media headers let you share images, videos, or documents.
      </p>

      <div className="af-form-group">
        {/* Step 1: Format Selector (None, Text, Media) */}
        <div className="af-field">
          <label className="af-field-label">Header Format</label>
          <div className="af-type-grid text-media-grid">
            {[
              { value: 'NONE', label: 'None', icon: '🚫' },
              { value: 'TEXT', label: 'Text', icon: '📝' },
              { value: 'MEDIA', label: 'Media', icon: '🖼️' },
            ].map((tab) => (
              <button
                type="button"
                key={tab.value}
                className={`af-type-card${activeFormatTab === tab.value ? ' selected' : ''}`}
                onClick={() => selectFormat(tab.value)}
              >
                <span className="af-type-card-icon">{tab.icon}</span>
                <span className="af-type-card-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Media Type Selector (Image, Video, Document) - Only shown if Media is active */}
        {activeFormatTab === 'MEDIA' && (
          <div className="af-field af-sub-section-animate">
            <label className="af-field-label">Media Type</label>
            <div className="af-type-grid media-types-grid">
              {[
                { value: 'IMAGE', label: 'Image', icon: '📷', hint: 'PNG, JPG up to 5MB' },
                { value: 'VIDEO', label: 'Video', icon: '🎬', hint: 'MP4 up to 16MB' },
                { value: 'DOCUMENT', label: 'Document', icon: '📄', hint: 'PDF up to 100MB' },
              ].map((type) => (
                <button
                  type="button"
                  key={type.value}
                  className={`af-type-card${form.headerFormat === type.value ? ' selected' : ''}`}
                  onClick={() => selectMediaType(type.value)}
                >
                  <span className="af-type-card-icon">{type.icon}</span>
                  <span className="af-type-card-label">{type.label}</span>
                  <span className="af-type-card-hint" style={{ fontSize: '0.68rem', opacity: 0.7 }}>
                    {type.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Header Field */}
        {form.headerFormat === 'TEXT' && (
          <div className="af-field">
            <label className="af-field-label">Header Text</label>
            <input
              className="af-input"
              value={form.headerText}
              onChange={(e) => setForm({ ...form, headerText: e.target.value })}
              placeholder="e.g. Order Update for {{1}}"
            />
            <span className="af-field-hint">
              Use {'{{1}}'} for dynamic variables. Max 60 characters.
            </span>
            <div className={`af-char-counter${form.headerText.length > 50 ? ' warning' : ''}${form.headerText.length > 60 ? ' danger' : ''}`}>
              {form.headerText.length} / 60
            </div>
          </div>
        )}

        {/* Media Upload card / Dropzone (Image, Video, Document) */}
        {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat) && (
          <div className="af-field">
            <label className="af-field-label">
              Upload {form.headerFormat === 'IMAGE' ? 'Image' : form.headerFormat === 'VIDEO' ? 'Video' : 'Document'}
            </label>

            {!isMediaSelected ? (
              <div
                className={`af-dropzone${dragActive ? ' drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                  id="af-media-upload"
                  accept={
                    form.headerFormat === 'IMAGE'
                      ? 'image/png, image/jpeg'
                      : form.headerFormat === 'VIDEO'
                      ? 'video/mp4'
                      : 'application/pdf'
                  }
                />
                <label htmlFor="af-media-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <div className="af-dropzone-icon">
                    {form.headerFormat === 'IMAGE' ? '🖼️' : form.headerFormat === 'VIDEO' ? '🎬' : '📄'}
                  </div>
                  <div className="af-dropzone-text">
                    Drag & Drop or <strong>Click to Upload</strong>
                  </div>
                  <div className="af-dropzone-hint">
                    {form.headerFormat === 'IMAGE'
                      ? 'Supports PNG, JPG (Max 5MB)'
                      : form.headerFormat === 'VIDEO'
                      ? 'Supports MP4 (Max 16MB)'
                      : 'Supports PDF (Max 100MB)'}
                  </div>
                </label>
              </div>
            ) : (
              /* After file selected state card */
              <div className="af-media-details-card">
                <div className="af-media-details-preview-side">
                  {form.headerFormat === 'IMAGE' && (form.mediaPreviewUrl || form.mediaUrl) && (
                    <img
                      src={form.mediaPreviewUrl || form.mediaUrl}
                      alt="Thumbnail preview"
                      className="af-media-details-thumbnail"
                    />
                  )}
                  {form.headerFormat === 'VIDEO' && (
                    <div className="af-media-details-thumbnail video-placeholder">
                      <span>🎬</span>
                      <div className="play-icon-overlay">▶</div>
                    </div>
                  )}
                  {form.headerFormat === 'DOCUMENT' && (
                    <div className="af-media-details-thumbnail doc-placeholder">
                      <span>📄</span>
                    </div>
                  )}
                </div>

                <div className="af-media-details-info">
                  <div className="af-media-filename">
                    ✓ {form.mediaFilename || (form.mediaHash ? `Media ID: ${form.mediaHash.slice(0, 16)}...` : 'file')}
                  </div>
                  {form.mediaFilesize && (
                    <div className="af-media-filesize">{form.mediaFilesize}</div>
                  )}
                  {form.mediaHash && (
                    <div className="af-media-meta-tag">Meta ID Persisted</div>
                  )}
                </div>

                <div className="af-media-details-actions">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                    id="af-media-upload-replace"
                    accept={
                      form.headerFormat === 'IMAGE'
                        ? 'image/png, image/jpeg'
                        : form.headerFormat === 'VIDEO'
                        ? 'video/mp4'
                        : 'application/pdf'
                    }
                  />
                  <label htmlFor="af-media-upload-replace" className="af-btn af-btn-secondary af-btn-sm">
                    🔄 Replace
                  </label>
                  <button type="button" className="af-btn af-btn-danger af-btn-sm" onClick={handleRemove}>
                    🗑 Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StepHeader
