import { create } from 'zustand'
import api from '../utils/api'

function decodeToken(token) {
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

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  userType: localStorage.getItem('userType') || null,
  isAuthenticated: Boolean(localStorage.getItem('accessToken')),
  isLoading: false,
  error: null,

  login: async (email, password, userType = 'user') => {
    set({ isLoading: true, error: null })

    try {
      const endpoint =
        userType === 'admin'
          ? '/api/admin/login'
          : userType === 'agent'
            ? '/api/agent/login'
            : '/api/user/login'

      const response = await api.post(endpoint, { email, password })
      const payload = response.data?.data || response.data || {}
      const accessToken = payload.accessToken || payload.token || response.data?.token
      const refreshToken = payload.refreshToken || ''
      const user = payload.user || payload.decode || decodeToken(accessToken)

      if (!response.data?.success || !accessToken) {
        throw new Error(response.data?.msg || 'Login failed')
      }

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('userType', userType)
      localStorage.setItem('user', JSON.stringify(user))

      set({
        user,
        token: accessToken,
        refreshToken,
        userType,
        isAuthenticated: true,
        isLoading: false,
      })

      return { success: true }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message || 'Login failed'
      set({ error: errorMsg, isLoading: false })
      return { success: false, error: errorMsg }
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userType')
    localStorage.removeItem('user')

    set({
      user: null,
      token: null,
      refreshToken: null,
      userType: null,
      isAuthenticated: false,
      error: null,
    })
  },

  checkAuth: async () => Boolean(get().token),
}))

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  darkMode: localStorage.getItem('darkMode') === 'true',
  modals: {},
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleTheme: () =>
    set((state) => {
      localStorage.setItem('darkMode', String(!state.darkMode))
      return { darkMode: !state.darkMode }
    }),
  openModal: (name) =>
    set((state) => ({ modals: { ...state.modals, [name]: true } })),
  closeModal: (name) =>
    set((state) => ({ modals: { ...state.modals, [name]: false } })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: Date.now(), ...notification },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    })),
}))

export const useAppStore = create((set) => ({
  conversations: [],
  contacts: [],
  agents: [],
  campaigns: [],
  loading: false,

  setConversations: (conversations) => set({ conversations }),
  setContacts: (contacts) => set({ contacts }),
  setAgents: (agents) => set({ agents }),
  setCampaigns: (campaigns) => set({ campaigns }),
  setLoading: (loading) => set({ loading }),
}))
