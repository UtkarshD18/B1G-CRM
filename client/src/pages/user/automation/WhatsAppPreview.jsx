import { useMemo } from 'react';

function renderBodyWithVariables(text, exampleValues) {
  if (!text) return null;
  const parts = text.split(/({{\s*\d+\s*}})/g);
  return parts.map((part, i) => {
    const match = part.match(/{{\s*(\d+)\s*}}/);
    if (match) {
      const varNum = match[1];
      const example = exampleValues?.[varNum];
      return (
        <span className="af-wa-bubble-var" key={i}>
          {example || `{{${varNum}}}`}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const EMPTY_CARD = {
  mediaPreviewUrl: '',
  mediaUrl: '',
  bodyText: '',
  buttons: [],
};

function WhatsAppPreview({ form, selectedCardIndex, setSelectedCardIndex }) {
  const isCarousel = form?.templateType === 'CAROUSEL';
  const isCatalog = form?.templateType === 'CATALOG';
  const carouselCards = form?.carouselCards || [];
  const activeCarouselCard = carouselCards[selectedCardIndex] || carouselCards[0] || EMPTY_CARD;
  const activeCardImage = activeCarouselCard.mediaPreviewUrl || activeCarouselCard.mediaUrl;
  const activeCardButtons = (activeCarouselCard.buttons || []).filter((button) =>
    button.text?.trim(),
  );
  const catalogThumbnail = form?.catalogThumbnailPreviewUrl || form?.catalogThumbnailUrl;

  const goToCarouselCard = (index) => {
    if (typeof setSelectedCardIndex !== 'function') return;
    const nextIndex = Math.min(Math.max(0, index), Math.max(0, carouselCards.length - 1));
    setSelectedCardIndex(nextIndex);
  };

  const headerContent = useMemo(() => {
    if (!form || isCarousel || isCatalog) return null;

    if (form.headerFormat === 'TEXT' && form.headerText?.trim()) {
      return (
        <div className="af-wa-bubble-header">
          {renderBodyWithVariables(form.headerText, form.headerExampleValues)}
        </div>
      );
    }

    if (form.headerFormat === 'IMAGE') {
      const src = form.mediaPreviewUrl || form.mediaUrl;
      return (
        <div className="af-wa-bubble-header-media image">
          {src ? (
            <img src={src} alt="Header Preview" className="af-wa-preview-img" />
          ) : (
            <div className="af-wa-media-placeholder">
              <span>Image Header</span>
            </div>
          )}
        </div>
      );
    }

    if (form.headerFormat === 'VIDEO') {
      const src = form.mediaPreviewUrl || form.mediaUrl;
      return (
        <div className="af-wa-bubble-header-media video">
          {src ? (
            <div className="af-wa-video-wrapper">
              <video src={src} muted autoPlay loop playsInline className="af-wa-preview-video" />
              <div className="af-wa-video-overlay-play">▶</div>
            </div>
          ) : (
            <div className="af-wa-media-placeholder">
              <span>Video Header</span>
              <div className="af-wa-video-overlay-play">▶</div>
            </div>
          )}
        </div>
      );
    }

    if (form.headerFormat === 'DOCUMENT') {
      return (
        <div className="af-wa-bubble-header-media document">
          <div className="af-wa-doc-bubble">
            <span className="af-wa-doc-icon">PDF</span>
            <div className="af-wa-doc-info">
              <span className="af-wa-doc-name">{form.mediaFilename || 'document.pdf'}</span>
              <span className="af-wa-doc-size">{form.mediaFilesize || 'PDF document'}</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }, [
    form,
    form?.headerFormat,
    form?.headerText,
    form?.headerExampleValues,
    form?.mediaPreviewUrl,
    form?.mediaUrl,
    form?.mediaFilename,
    form?.mediaFilesize,
    isCarousel,
    isCatalog,
  ]);

  const buttons = useMemo(() => {
    if (isCarousel || isCatalog || !form?.buttons?.length) return [];
    return form.buttons
      .filter((button) => button.text?.trim())
      .slice(0, 3)
      .map((button, index) => {
        let icon = '↩';
        if (button.type === 'URL') icon = '↗';
        if (button.type === 'PHONE_NUMBER') icon = '☎';
        return (
          <div className="af-wa-button" key={index}>
            <span className="af-wa-btn-icon">{icon}</span>
            {button.text}
          </div>
        );
      });
  }, [form, isCarousel, isCatalog]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="af-preview-wrapper">
      <div className="af-phone">
        <div className="af-phone-notch">
          <div className="af-phone-notch-pill" />
        </div>

        <div className="af-phone-wa-header">
          <div className="af-phone-wa-back">←</div>
          <div className="af-phone-wa-avatar">
            <span>B</span>
            <div className="af-phone-wa-avatar-badge" />
          </div>
          <div className="af-phone-wa-meta">
            <div className="af-phone-wa-name">Business Name</div>
            <div className="af-phone-wa-status">online</div>
          </div>
          <div className="af-phone-wa-actions">
            <span>▣</span>
            <span>☎</span>
            <span>⋮</span>
          </div>
        </div>

        <div className="af-phone-chat">
          <div className="af-wa-chat-timestamp">TODAY</div>

          {isCarousel ? (
            <div className="af-carousel-preview-container">
              {form?.bodyText?.trim() && (
                <div className="af-wa-bubble" style={{ marginBottom: 8, width: 'fit-content' }}>
                  <div className="af-wa-bubble-body">
                    {renderBodyWithVariables(form.bodyText, form.bodyExampleValues)}
                  </div>
                  <div className="af-wa-bubble-time">{timeStr}</div>
                </div>
              )}

              <div className="af-carousel-slider-outer">
                {carouselCards.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="af-carousel-arrow left"
                      onClick={() => goToCarouselCard(selectedCardIndex - 1)}
                      style={{ opacity: selectedCardIndex > 0 ? 1 : 0.3 }}
                      disabled={selectedCardIndex === 0}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="af-carousel-arrow right"
                      onClick={() => goToCarouselCard(selectedCardIndex + 1)}
                      style={{ opacity: selectedCardIndex < carouselCards.length - 1 ? 1 : 0.3 }}
                      disabled={selectedCardIndex === carouselCards.length - 1}
                    >
                      ›
                    </button>
                  </>
                )}

                <div className="af-carousel-slider-inner af-carousel-slider-single">
                  <div className="af-carousel-preview-card af-carousel-preview-card-active">
                    <div className="af-carousel-preview-card-img-wrap">
                      {activeCardImage ? (
                        <img
                          src={activeCardImage}
                          alt="Card"
                          className="af-carousel-preview-card-img"
                        />
                      ) : (
                        <div className="af-carousel-card-img-placeholder">
                          <span>Image</span>
                        </div>
                      )}
                    </div>

                    <div className="af-carousel-preview-card-body">
                      <p className="af-carousel-preview-card-text">
                        {activeCarouselCard.bodyText?.trim() || 'Describe this card...'}
                      </p>
                    </div>

                    {activeCardButtons.length > 0 && (
                      <div className="af-carousel-preview-card-buttons">
                        {activeCardButtons.map((button, index) => {
                          let icon = '↩';
                          if (button.type === 'URL') icon = '↗';
                          if (button.type === 'PHONE_NUMBER') icon = '☎';
                          return (
                            <div
                              key={index}
                              className="af-wa-button"
                              style={{ padding: '6px 4px' }}
                            >
                              <span style={{ marginRight: 4, fontSize: '0.78rem' }}>{icon}</span>
                              {button.text}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {carouselCards.length > 1 && (
                <div className="af-carousel-dots">
                  {carouselCards.map((_, idx) => (
                    <button
                      type="button"
                      key={idx}
                      className={`af-carousel-dot${idx === selectedCardIndex ? ' active' : ''}`}
                      aria-label={`Preview card ${idx + 1}`}
                      onClick={() => goToCarouselCard(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : isCatalog ? (
            <div className="af-wa-bubble af-catalog-bubble">
              <div className="af-catalog-preview-image">
                {catalogThumbnail ? (
                  <img src={catalogThumbnail} alt="Catalog thumbnail" />
                ) : (
                  <span>Catalog thumbnail</span>
                )}
              </div>

              <div className="af-wa-bubble-body">
                {form?.bodyText?.trim()
                  ? renderBodyWithVariables(form.bodyText, form.bodyExampleValues)
                  : 'Browse our latest Healthy One Gram products.'}
              </div>

              {form?.footerText?.trim() ? (
                <div className="af-wa-bubble-footer">{form.footerText}</div>
              ) : null}

              <div className="af-wa-bubble-time">
                {timeStr}
                <span className="af-wa-ticks">✓✓</span>
              </div>

              <div className="af-wa-buttons">
                <div className="af-wa-button">
                  <span className="af-wa-btn-icon">▣</span>
                  View Catalog
                </div>
              </div>
            </div>
          ) : (
            <>
              {form?.bodyText?.trim() ||
              form?.headerText?.trim() ||
              form?.headerFormat !== 'NONE' ? (
                <div className="af-wa-bubble">
                  {headerContent}

                  {form?.bodyText?.trim() ? (
                    <div className="af-wa-bubble-body">
                      {renderBodyWithVariables(form.bodyText, form.bodyExampleValues)}
                    </div>
                  ) : null}

                  {form?.footerText?.trim() ? (
                    <div className="af-wa-bubble-footer">{form.footerText}</div>
                  ) : null}

                  <div className="af-wa-bubble-time">
                    {timeStr}
                    <span className="af-wa-ticks">✓✓</span>
                  </div>

                  {buttons.length > 0 ? <div className="af-wa-buttons">{buttons}</div> : null}
                </div>
              ) : (
                <div className="af-wa-bubble empty">
                  <div className="af-wa-bubble-body" style={{ opacity: 0.5, fontStyle: 'italic' }}>
                    Start building your template to see a live preview here...
                  </div>
                  <div className="af-wa-bubble-time">{timeStr}</div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="af-phone-input-bar">
          <div className="af-phone-input-placeholder">Type a message</div>
          <div className="af-phone-input-send">▶</div>
        </div>

        <div className="af-phone-bottom">
          <div className="af-phone-home-indicator" />
        </div>
      </div>
      <div className="af-preview-label">Live WhatsApp Preview</div>
    </div>
  );
}

export default WhatsAppPreview;
