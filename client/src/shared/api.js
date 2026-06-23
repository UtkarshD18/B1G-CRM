export const API_BASE =
  typeof window !== 'undefined' && typeof window.__B1GCRM_API_URL__ === 'string'
    ? window.__B1GCRM_API_URL__.replace(/\/$/, '')
    : ''

async function parseApiResponse(response) {
  if (typeof response.text === 'function') {
    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch {
      return { success: false, msg: text || 'Invalid server response' }
    }
  }

  // Keep the helper compatible with lightweight fetch mocks and response
  // adapters that expose json() without implementing the full Response API.
  if (typeof response.json === 'function') {
    try {
      return await response.json()
    } catch {
      return { success: false, msg: 'Invalid server response' }
    }
  }

  return { success: false, msg: 'Invalid server response' }
}

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

  return parseApiResponse(response)
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

  return parseApiResponse(response)
}

export function apiFormRequestWithProgress(path, { token, formData, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}${path}`)

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress(percent)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          resolve({ success: false, msg: 'Invalid server response' })
        }
      } else {
        reject(new Error(`Request failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error'))
    }

    xhr.send(formData)
  })
}
