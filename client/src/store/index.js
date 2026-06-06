import axios from "axios";
import { create } from "zustand";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Authentication Store
 * Manages user login state, tokens, and permissions
 */
export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  userType: localStorage.getItem("userType") || null, // 'user', 'agent', or 'admin'
  isAuthenticated: !!localStorage.getItem("accessToken"),
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),

  /**
   * Login user with email and password
   */
  login: async (email, password, userType = "user") => {
    set({ isLoading: true, error: null });
    try {
      const endpoint =
        userType === "admin"
          ? "/admin/login"
          : userType === "agent"
            ? "/agent/login"
            : "/user/login";

      const response = await axios.post(`${API_URL}${endpoint}`, {
        email,
        password,
      });

      if (response.data.success) {
        const { accessToken, refreshToken, user, decode } = response.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("userType", userType);
        localStorage.setItem("user", JSON.stringify(decode));

        set({
          user: decode,
          token: accessToken,
          refreshToken,
          userType,
          isAuthenticated: true,
          isLoading: false,
        });

        // Set default axios header
        axios.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;

        return { success: true };
      } else {
        throw new Error(response.data.msg || "Login failed");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.msg || error.message || "Login failed";
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Register new user
   */
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/user/register`, userData);

      if (response.data.success) {
        set({ isLoading: false });
        return { success: true };
      } else {
        throw new Error(response.data.msg || "Registration failed");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.msg || error.message || "Registration failed";
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userType");
    localStorage.removeItem("user");

    delete axios.defaults.headers.common["Authorization"];

    set({
      user: null,
      token: null,
      refreshToken: null,
      userType: null,
      isAuthenticated: false,
      error: null,
    });
  },

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken: async () => {
    try {
      const refreshToken = get().refreshToken;
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await axios.post(`${API_URL}/auth/refresh_token`, {
        refreshToken,
      });

      if (response.data.success) {
        const { accessToken } = response.data.data;

        localStorage.setItem("accessToken", accessToken);

        set({ token: accessToken });

        axios.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;

        return { success: true };
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      // If refresh fails, logout user
      get().logout();
      return { success: false, error: error.message };
    }
  },

  /**
   * Check authentication status
   */
  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      return false;
    }

    try {
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        set({ user: response.data.data });
        return true;
      }
    } catch (error) {
      // Try to refresh token
      const refreshResult = await get().refreshAccessToken();
      return refreshResult.success;
    }

    return false;
  },
}));

/**
 * UI Store
 * Manages sidebar, modals, notifications, etc.
 */
export const useUIStore = create((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Modals
  modals: {},
  openModal: (name) =>
    set((state) => ({
      modals: { ...state.modals, [name]: true },
    })),
  closeModal: (name) =>
    set((state) => ({
      modals: { ...state.modals, [name]: false },
    })),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: Date.now(), ...notification },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // Theme
  darkMode: localStorage.getItem("darkMode") === "true",
  toggleTheme: () =>
    set((state) => {
      localStorage.setItem("darkMode", !state.darkMode);
      return { darkMode: !state.darkMode };
    }),
}));

/**
 * App Store
 * Manages global app data (conversations, contacts, etc.)
 */
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
}));
