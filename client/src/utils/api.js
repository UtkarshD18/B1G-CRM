import axios from "axios";
import { useAuthStore } from "../store";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Create axios instance with default configuration
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor - add token to all requests
 */
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor - handle token refresh and errors
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResult = await useAuthStore
          .getState()
          .refreshAccessToken();
        if (refreshResult.success) {
          const token = useAuthStore.getState().token;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Error handler utility
 */
export const handleApiError = (error) => {
  if (error.response?.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = "/login";
    return "Session expired. Please login again.";
  }

  if (error.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (error.response?.status === 404) {
    return "Resource not found.";
  }

  if (error.response?.status === 500) {
    return "Server error. Please try again later.";
  }

  return error.response?.data?.msg || error.message || "An error occurred";
};

export default api;
