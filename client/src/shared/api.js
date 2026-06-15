export const API_BASE =
  typeof window !== 'undefined' && typeof window.__B1GCRM_API_URL__ === 'string'
    ? window.__B1GCRM_API_URL__.replace(/\/$/, '')
    : ''

export async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const headers = {}

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  return response.json()
}

export async function apiFormRequest(path, { token, formData } = {}) {
  const headers = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  return response.json()
}
