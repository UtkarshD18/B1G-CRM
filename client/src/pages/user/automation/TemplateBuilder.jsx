import { useState, useEffect } from 'react'
import StepBasicInfo from './StepBasicInfo'
import StepHeader from './StepHeader'
import StepBody from './StepBody'
import StepButtons from './StepButtons'
import StepVariables from './StepVariables'
import StepReview from './StepReview'
import StepCarouselCards from './StepCarouselCards'
import StepCatalog from './StepCatalog'

const STANDARD_STEPS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'header', label: 'Header' },
  { id: 'body', label: 'Body' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'variables', label: 'Variables' },
  { id: 'review', label: 'Review & Submit' },
]

const CAROUSEL_STEPS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'cards', label: 'Cards' },
  { id: 'review', label: 'Review & Submit' },
]

const CATALOG_STEPS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'review', label: 'Review & Submit' },
]

function TemplateBuilder({ form, setForm, submitting, onSubmit, onStatus, selectedCardIndex, setSelectedCardIndex }) {
  const [currentStep, setCurrentStep] = useState(0)

  const isCarousel = form.templateType === 'CAROUSEL'
  const isCatalog = form.templateType === 'CATALOG'
  const steps = isCarousel ? CAROUSEL_STEPS : isCatalog ? CATALOG_STEPS : STANDARD_STEPS

  // Reset card index when template type changes
  useEffect(() => {
    setSelectedCardIndex(0)
  }, [form.templateType, setSelectedCardIndex])

  useEffect(() => {
    if (!isCarousel) return
    const lastCardIndex = Math.max(0, (form.carouselCards?.length || 1) - 1)
    if (selectedCardIndex > lastCardIndex) {
      setSelectedCardIndex(lastCardIndex)
    }
  }, [form.carouselCards?.length, isCarousel, selectedCardIndex, setSelectedCardIndex])

  // Reset step index if it exceeds the steps length of the chosen type
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(steps.length - 1)
    }
  }, [form.templateType, steps.length, currentStep])

  function goNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Go to step
  function goPrev() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  function goToStep(index) {
    if (index < steps.length) {
      setCurrentStep(index)
    }
  }

  function renderStep() {
    if (isCarousel) {
      switch (currentStep) {
        case 0:
          return <StepBasicInfo form={form} setForm={setForm} />
        case 1:
          return (
            <StepCarouselCards
              form={form}
              setForm={setForm}
              selectedCardIndex={selectedCardIndex}
              setSelectedCardIndex={setSelectedCardIndex}
            />
          )
        case 2:
          return <StepReview form={form} submitting={submitting} onSubmit={onSubmit} />
        default:
          return null
      }
    }

    if (isCatalog) {
      switch (currentStep) {
        case 0:
          return <StepBasicInfo form={form} setForm={setForm} />
        case 1:
          return <StepCatalog form={form} setForm={setForm} onStatus={onStatus} />
        case 2:
          return <StepReview form={form} submitting={submitting} onSubmit={onSubmit} />
        default:
          return null
      }
    }

    // Standard steps
    switch (currentStep) {
      case 0:
        return <StepBasicInfo form={form} setForm={setForm} />
      case 1:
        return <StepHeader form={form} setForm={setForm} onStatus={onStatus} />
      case 2:
        return <StepBody form={form} setForm={setForm} />
      case 3:
        return <StepButtons form={form} setForm={setForm} />
      case 4:
        return <StepVariables form={form} setForm={setForm} />
      case 5:
        return <StepReview form={form} submitting={submitting} onSubmit={onSubmit} />
      default:
        return null
    }
  }

  return (
    <div>
      {/* Stepper */}
      <div className="af-stepper">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`af-step-item${index === currentStep ? ' active' : ''}${index < currentStep ? ' completed' : ''}`}
          >
            <div className="af-step-circle-wrapper">
              <button
                type="button"
                className="af-step-circle"
                onClick={() => goToStep(index)}
              >
                {index < currentStep ? '✓' : index + 1}
              </button>
              {index < steps.length - 1 ? (
                <div className={`af-step-line${index < currentStep ? ' completed' : ''}`} />
              ) : null}
            </div>
            <span className="af-step-title-label">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div key={currentStep}>
        {renderStep()}
      </div>

      {/* Step Navigation */}
      <div className="af-step-nav">
        <button
          type="button"
          className="af-btn af-btn-secondary"
          onClick={goPrev}
          disabled={currentStep === 0}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#607481' }}>
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {currentStep < steps.length - 1 ? (
          <button
            type="button"
            className="af-btn af-btn-primary"
            onClick={goNext}
          >
            Next →
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}

export default TemplateBuilder
