import { useState } from 'react'

function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const HEADER_TYPES = [
  { value: 'NONE', label: 'None', icon: 'None', hint: 'No template header' },
  { value: 'TEXT', label: 'Text', icon: 'Text', hint: 'Short text header' },
  { value: 'IMAGE', label: 'Image', icon: 'Image', hint: 'JPG or PNG media header' },
  { value: 'VIDEO', label: 'Video', icon: 'Video', hint: 'MP4 media header' },
  { value: 'DOCUMENT', label: 'Document', icon: 'PDF', hint: 'PDF media header' },
]

function isAllowedThumbnail(file) {
  const allowedTypes = ['image/jpeg', 'image/png']
  const ext = file.name?.split('.').pop()?.toLowerCase()
  return allowedTypes.includes(file.type) || ['jpg', 'jpeg', 'png'].includes(ext)
}

function StepCatalog({ form, setForm, onStatus }) {
  const [thumbnailDragActive, setThumbnailDragActive] = useState(false)
  const [headerDragActive, setHeaderDragActive] = useState(false)

  const bodyLen = form.bodyText?.length || 0
  const footerLen = form.footerText?.length || 0
  const thumbnailPreview = form.catalogThumbnailPreviewUrl || form.catalogThumbnailUrl
  const hasThumbnail = !!(form.catalogThumbnailFile || thumbnailPreview || form.catalogThumbnailFilename)
  const hasHeaderMedia = !!(form.selectedMediaFile || form.mediaHash)

  function selectHeaderFormat(headerFormat) {
    setForm((prev) => ({
      ...prev,
      headerFormat,
      headerText: headerFormat === 'TEXT' ? prev.headerText : '',
      headerExampleValues: {},
      mediaHash: '',
      mediaUrl: '',
      selectedMediaFile: null,
      mediaPreviewUrl: '',
      mediaFilename: '',
      mediaFilesize: '',
    }))
  }

  function handleHeaderFile(file) {
    if (!file) return
    const format = form.headerFormat
    if (format === 'IMAGE' && !isAllowedThumbnail(file)) {
      onStatus?.('Please select a JPG or PNG image for the catalog header.')
      return
    }
    if (format === 'VIDEO' && file.type !== 'video/mp4') {
      onStatus?.('Please select an MP4 video for the catalog header.')
      return
    }
    if (format === 'DOCUMENT' && file.type !== 'application/pdf') {
      onStatus?.('Please select a PDF document for the catalog header.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    if (form.mediaPreviewUrl) URL.revokeObjectURL(form.mediaPreviewUrl)
    setForm((prev) => ({
      ...prev,
      selectedMediaFile: file,
      mediaPreviewUrl: previewUrl,
      mediaFilename: file.name,
      mediaFilesize: formatBytes(file.size),
      mediaHash: '',
      mediaUrl: '',
    }))
    onStatus?.(`Header file "${file.name}" added locally for preview.`)
  }

  function removeHeaderFile() {
    if (form.mediaPreviewUrl) URL.revokeObjectURL(form.mediaPreviewUrl)
    setForm((prev) => ({
      ...prev,
      selectedMediaFile: null,
      mediaPreviewUrl: '',
      mediaFilename: '',
      mediaFilesize: '',
      mediaHash: '',
      mediaUrl: '',
    }))
  }

  function handleThumbnailFile(file) {
    if (!file) return
    if (!isAllowedThumbnail(file)) {
      onStatus?.('Catalog thumbnail must be a JPG, JPEG, or PNG file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      onStatus?.('Catalog thumbnail must be 5 MB or smaller.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    if (form.catalogThumbnailPreviewUrl) URL.revokeObjectURL(form.catalogThumbnailPreviewUrl)
    setForm((prev) => ({
      ...prev,
      catalogThumbnailFile: file,
      catalogThumbnailPreviewUrl: previewUrl,
      catalogThumbnailFilename: file.name,
      catalogThumbnailFilesize: formatBytes(file.size),
    }))
    onStatus?.(`Catalog thumbnail "${file.name}" added locally. It will not be uploaded to Meta.`)
  }

  function removeThumbnailFile() {
    if (form.catalogThumbnailPreviewUrl) URL.revokeObjectURL(form.catalogThumbnailPreviewUrl)
    setForm((prev) => ({
      ...prev,
      catalogThumbnailFile: null,
      catalogThumbnailPreviewUrl: '',
      catalogThumbnailUrl: '',
      catalogThumbnailFilename: '',
      catalogThumbnailFilesize: '',
    }))
  }

  function handleThumbnailDrag(event) {
    event.preventDefault()
    event.stopPropagation()
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setThumbnailDragActive(true)
    } else if (event.type === 'dragleave') {
      setThumbnailDragActive(false)
    }
  }

  function handleHeaderDrag(event) {
    event.preventDefault()
    event.stopPropagation()
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setHeaderDragActive(true)
    } else if (event.type === 'dragleave') {
      setHeaderDragActive(false)
    }
  }

  function dropThumbnail(event) {
    event.preventDefault()
    event.stopPropagation()
    setThumbnailDragActive(false)
    handleThumbnailFile(event.dataTransfer.files?.[0] || null)
  }

  function dropHeader(event) {
    event.preventDefault()
    event.stopPropagation()
    setHeaderDragActive(false)
    handleHeaderFile(event.dataTransfer.files?.[0] || null)
  }

  return (
    <div className="af-step-content">
      <h3 className="af-step-title">Catalog Configuration</h3>
      <p className="af-step-description">
        Configure the catalog message, local thumbnail preview, footer, and the automatic catalog button.
      </p>

      <div className="af-form-group">
        <div className="af-field">
          <label className="af-field-label">Catalog Header</label>
          <div className="af-type-grid af-catalog-header-grid">
            {HEADER_TYPES.map((type) => (
              <button
                type="button"
                key={type.value}
                className={`af-type-card${form.headerFormat === type.value ? ' selected' : ''}`}
                onClick={() => selectHeaderFormat(type.value)}
              >
                <span className="af-type-card-icon">{type.icon}</span>
                <span className="af-type-card-label">{type.label}</span>
                <span className="af-type-card-hint">{type.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {form.headerFormat === 'TEXT' && (
          <div className="af-field af-sub-section-animate">
            <label className="af-field-label">Header Text</label>
            <input
              className="af-input"
              value={form.headerText}
              onChange={(event) => setForm((prev) => ({ ...prev, headerText: event.target.value }))}
              placeholder="e.g. Healthy One Gram"
              maxLength={60}
            />
            <div className={`af-char-counter${(form.headerText?.length || 0) > 50 ? ' warning' : ''}`}>
              {form.headerText?.length || 0} / 60
            </div>
          </div>
        )}

        {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat) && (
          <div className="af-field af-sub-section-animate">
            <label className="af-field-label">Header Media</label>
            {!hasHeaderMedia ? (
              <div
                className={`af-dropzone${headerDragActive ? ' drag-active' : ''}`}
                onDragEnter={handleHeaderDrag}
                onDragOver={handleHeaderDrag}
                onDragLeave={handleHeaderDrag}
                onDrop={dropHeader}
              >
                <input
                  type="file"
                  id="af-catalog-header-upload"
                  style={{ display: 'none' }}
                  accept={
                    form.headerFormat === 'IMAGE'
                      ? 'image/png, image/jpeg'
                      : form.headerFormat === 'VIDEO'
                      ? 'video/mp4'
                      : 'application/pdf'
                  }
                  onChange={(event) => handleHeaderFile(event.target.files?.[0] || null)}
                />
                <label htmlFor="af-catalog-header-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <div className="af-dropzone-icon">{form.headerFormat}</div>
                  <div className="af-dropzone-text">
                    Drag & Drop or <strong>Click to Upload</strong>
                  </div>
                  <div className="af-dropzone-hint">
                    Used only when a catalog header media component is selected.
                  </div>
                </label>
              </div>
            ) : (
              <div className="af-media-details-card">
                <div className="af-media-details-preview-side">
                  {form.headerFormat === 'IMAGE' && (form.mediaPreviewUrl || form.mediaUrl) ? (
                    <img
                      src={form.mediaPreviewUrl || form.mediaUrl}
                      alt="Catalog header"
                      className="af-media-details-thumbnail"
                    />
                  ) : (
                    <span>{form.headerFormat}</span>
                  )}
                </div>
                <div className="af-media-details-info">
                  <span className="af-media-filename">{form.mediaFilename || 'Header media persisted'}</span>
                  {form.mediaFilesize ? <span className="af-media-filesize">{form.mediaFilesize}</span> : null}
                </div>
                <div className="af-media-details-actions">
                  <button type="button" className="af-btn af-btn-danger af-btn-sm" onClick={removeHeaderFile}>
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="af-field">
          <label className="af-field-label">
            Catalog Thumbnail <span style={{ color: '#dc2626' }}>*</span>
          </label>
          {!hasThumbnail ? (
            <div
              className={`af-dropzone${thumbnailDragActive ? ' drag-active' : ''}`}
              onDragEnter={handleThumbnailDrag}
              onDragOver={handleThumbnailDrag}
              onDragLeave={handleThumbnailDrag}
              onDrop={dropThumbnail}
            >
              <input
                type="file"
                id="af-catalog-thumbnail-upload"
                style={{ display: 'none' }}
                accept="image/png, image/jpeg"
                onChange={(event) => handleThumbnailFile(event.target.files?.[0] || null)}
              />
              <label htmlFor="af-catalog-thumbnail-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <div className="af-dropzone-icon">Image</div>
                <div className="af-dropzone-text">
                  Drag & Drop or <strong>Click to Upload Thumbnail</strong>
                </div>
                <div className="af-dropzone-hint">
                  JPG, JPEG, or PNG. Max 5 MB. Stored locally for preview only.
                </div>
              </label>
            </div>
          ) : (
            <div className="af-media-details-card">
              <div className="af-media-details-preview-side">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Catalog thumbnail" className="af-media-details-thumbnail" />
                ) : (
                  <span>Image</span>
                )}
              </div>
              <div className="af-media-details-info">
                <span className="af-media-filename">{form.catalogThumbnailFilename || 'Catalog thumbnail'}</span>
                {form.catalogThumbnailFilesize ? (
                  <span className="af-media-filesize">{form.catalogThumbnailFilesize}</span>
                ) : null}
                <span className="af-field-hint">Local preview only. Not uploaded to Meta.</span>
              </div>
              <div className="af-media-details-actions">
                <input
                  type="file"
                  id="af-catalog-thumbnail-replace"
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg"
                  onChange={(event) => handleThumbnailFile(event.target.files?.[0] || null)}
                />
                <label htmlFor="af-catalog-thumbnail-replace" className="af-btn af-btn-secondary af-btn-sm">
                  Replace
                </label>
                <button type="button" className="af-btn af-btn-danger af-btn-sm" onClick={removeThumbnailFile}>
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="af-field">
          <label className="af-field-label">
            Message Body <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            className="af-textarea"
            rows={7}
            value={form.bodyText}
            onChange={(event) => setForm((prev) => ({ ...prev, bodyText: event.target.value }))}
            placeholder="Browse our latest Healthy One Gram products."
            maxLength={1024}
            style={{ minHeight: 160 }}
          />
          <div className={`af-char-counter${bodyLen > 900 ? ' warning' : ''}`}>
            {bodyLen} / 1024
          </div>
        </div>

        <div className="af-field">
          <label className="af-field-label">Footer</label>
          <input
            className="af-input"
            value={form.footerText}
            onChange={(event) => setForm((prev) => ({ ...prev, footerText: event.target.value }))}
            placeholder="Limited stock available"
            maxLength={60}
          />
          <div className={`af-char-counter${footerLen > 50 ? ' warning' : ''}`}>
            {footerLen} / 60
          </div>
        </div>

        <div className="af-catalog-auto-button">
          <span className="af-catalog-auto-button-label">Catalog Button</span>
          <strong>View Catalog</strong>
          <span>Automatically generated in preview, review, and Meta payload.</span>
        </div>
      </div>
    </div>
  )
}

export default StepCatalog
