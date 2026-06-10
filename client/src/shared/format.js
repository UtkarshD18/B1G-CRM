export function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function formatMoney(value) {
  if (!value) {
    return 'Free'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatMonthSeries(series) {
  if (!Array.isArray(series)) {
    return []
  }

  return series
    .map((entry, index) => ({
      label: entry?.month || `M${index + 1}`,
      value: Number(entry?.count || entry?.value || 0),
    }))
    .slice(-6)
}

export function decodeTokenPayload(token) {
  if (!token) {
    return null
  }

  try {
    const [, payload] = token.split('.')
    return JSON.parse(window.atob(payload))
  } catch {
    return null
  }
}

export function createFlowId() {
  return globalThis.crypto?.randomUUID?.() || `flow-${Date.now()}`
}

export function prettyJson(value) {
  return JSON.stringify(value, null, 2)
}

export function parseJsonField(value, label) {
  try {
    const parsed = JSON.parse(value)
    return { success: true, data: parsed }
  } catch {
    return { success: false, error: `${label} must be valid JSON.` }
  }
}

export function normalizeConversationMessage(message) {
  if (message?.type === 'text') {
    return message?.msgContext?.text?.body || ''
  }

  if (message?.type === 'image') {
    return message?.msgContext?.image?.caption || 'Image'
  }

  if (message?.type === 'video') {
    return message?.msgContext?.video?.caption || 'Video'
  }

  if (message?.type === 'document') {
    return message?.msgContext?.document?.caption || 'Document'
  }

  if (message?.type === 'audio') {
    return 'Audio'
  }

  return message?.type || 'Message'
}

export function formatRelativeTimestamp(value) {
  if (!value) {
    return 'N/A'
  }

  const timestamp = Number(value)
  if (!Number.isFinite(timestamp)) {
    return String(value)
  }

  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}
