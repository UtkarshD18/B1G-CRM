/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const STORAGE_KEY = 'b1gcrm-auth'
const AuthContext = createContext(null)

function loadStoredAuth() {
  if (typeof window === 'undefined') {
    return { admin: '', user: '', agent: '' }
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      admin: parsed.admin || '',
      user: parsed.user || '',
      agent: parsed.agent || '',
    }
  } catch {
    return { admin: '', user: '', agent: '' }
  }
}

function saveStoredAuth(next) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(loadStoredAuth)

  const value = useMemo(
    () => ({
      tokens,
      setRoleToken(role, token) {
        const next = { ...tokens, [role]: token }
        setTokens(next)
        saveStoredAuth(next)
      },
      clearRoleToken(role) {
        const next = { ...tokens, [role]: '' }
        setTokens(next)
        saveStoredAuth(next)
      },
    }),
    [tokens],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  const location = useLocation()
  if (!ctx) {
    throw new Error('Auth context unavailable')
  }
  
  const proxyTokens = new Proxy(ctx.tokens, {
    get(target, prop) {
      if (prop === 'user' && location.pathname.startsWith('/agent')) {
        return target.agent
      }
      return target[prop]
    }
  })

  return {
    ...ctx,
    tokens: proxyTokens
  }
}

export function RoleGate({ role, children }) {
  const { tokens } = useAuth()
  const location = useLocation()

  if (!tokens[role]) {
    return <Navigate to={`/${role}/login`} replace state={{ from: location.pathname }} />
  }

  return children
}

export function useActiveToken() {
  const { tokens } = useAuth()
  const location = useLocation()
  return location.pathname.startsWith('/agent') ? tokens.agent : tokens.user
}
