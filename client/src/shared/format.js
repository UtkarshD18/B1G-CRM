export function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function formatMoney(value) {
  if (!value) {
    return 'Free';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMonthSeries(series) {
  if (!Array.isArray(series)) {
    return [];
  }

  return series
    .map((entry, index) => ({
      label: entry?.month || `M${index + 1}`,
      value: Number(entry?.count || entry?.value || 0),
    }))
    .slice(-6);
}

export function decodeTokenPayload(token) {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split('.');
    return JSON.parse(window.atob(payload));
  } catch {
    return null;
  }
}

export function createFlowId() {
  return globalThis.crypto?.randomUUID?.() || `flow-${Date.now()}`;
}

export function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}

export function parseJsonField(value, label) {
  try {
    const parsed = JSON.parse(value);
    return { success: true, data: parsed };
  } catch {
    return { success: false, error: `${label} must be valid JSON.` };
  }
}

export function normalizeConversationMessage(message) {
  if (message?.type === 'text') {
    return message?.msgContext?.text?.body || '';
  }

  if (message?.type === 'image') {
    return message?.msgContext?.image?.caption || 'Image';
  }

  if (message?.type === 'video') {
    return message?.msgContext?.video?.caption || 'Video';
  }

  if (message?.type === 'document') {
    return message?.msgContext?.document?.caption || 'Document';
  }

  if (message?.type === 'audio') {
    return 'Audio';
  }

  return message?.type || 'Message';
}

export function formatRelativeTimestamp(value) {
  if (!value) {
    return 'N/A';
  }

  const date = toMessageDate(value);
  return date ? date.toLocaleString() : String(value);
}

export function formatDateTime(value) {
  if (!value) {
    return 'N/A';
  }

  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

export function parseStoredJson(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function summarizePlan(value) {
  const plan = parseStoredJson(value, null);
  if (!plan) {
    return 'Unassigned';
  }

  return (
    plan.title ||
    (plan.plan_duration_in_days ? `${plan.plan_duration_in_days} days` : 'Active Plan')
  );
}

export function toMessageDate(value) {
  if (!value) return null;
  const numeric = Number(value);
  const date = new Date(
    Number.isFinite(numeric) ? (Math.abs(numeric) < 1e12 ? numeric * 1000 : numeric) : value,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatChatTimestamp(value) {
  const date = toMessageDate(value);
  if (!date) return '';
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
