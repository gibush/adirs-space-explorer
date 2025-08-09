import axios, { AxiosResponse } from 'axios';

// Import all interfaces
import {

  Source,
  SignupRequest,
  LoginRequest,
  ValidateTokenRequest,
  SignupResponse,
  LoginResponse,
  ValidateTokenResponse,
  MeResponse,
  SearchHistoryResponse,
  DeleteResponse,
  SearchHistoryParams,
  SourcesParams,
} from './interfaces';

// Base API configuration
const VITE_BASE_API_HOST = import.meta.env.VITE_BASE_API_HOST;

// Create axios instance with default config
const api = axios.create({
  baseURL: VITE_BASE_API_HOST,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors globally
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Could dispatch logout action here if using Redux/Context
    }
    return Promise.reject(error);
  }
);

// API functions

// Authentication endpoints
export const authAPI = {
  /**
   * Register a new user account
   */
  signup: async (data: SignupRequest): Promise<AxiosResponse<SignupResponse>> => {
    return api.post('/api/signup', data);
  },

  /**
   * Authenticate user and get JWT token
   */
  login: async (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> => {
    return api.post('/api/login', data);
  },

  /**
   * Validate JWT token
   */
  validateToken: async (data: ValidateTokenRequest): Promise<AxiosResponse<ValidateTokenResponse>> => {
    return api.post('/api/auth/validate', data);
  },

  /**
   * Get current user details using stored JWT token
   */
  getCurrentUser: async (): Promise<AxiosResponse<MeResponse>> => {
    return api.get('/api/auth/me');
  },
};

// Search history endpoints
export const searchAPI = {
  /**
   * Get user's search history with pagination
   */
  getHistory: async (params?: SearchHistoryParams): Promise<AxiosResponse<SearchHistoryResponse>> => {
    return api.get('/api/search/history', { params });
  },

  /**
   * Delete a specific search history entry
   */
  deleteSearchEntry: async (searchId: string): Promise<AxiosResponse<DeleteResponse>> => {
    return api.delete(`/api/search/${searchId}`);
  },

  /**
   * Delete all search history for the user
   */
  deleteAllHistory: async (): Promise<AxiosResponse<DeleteResponse>> => {
    return api.delete('/api/search/history');
  },
};

// Sources endpoints
export const sourcesAPI = {
  /**
   * Get space images and sources from NASA with optional search and pagination
   */
  getSources: async (params?: SourcesParams): Promise<AxiosResponse<Source[]>> => {
    return api.get('/api/sources', { params });
  },
};

// Utility functions
export const apiUtils = {
  /**
   * Set authentication token in localStorage and axios headers
   */
  setAuthToken: (token: string) => {
    localStorage.setItem('authToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  /**
   * Remove authentication token from localStorage and axios headers
   */
  removeAuthToken: () => {
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  },

  /**
   * Get current auth token from localStorage
   */
  getAuthToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },
};

// Export the configured axios instance for custom requests
export { api };

// Export BASE_API for reference
export { VITE_BASE_API_HOST };

// Re-export all interfaces for convenience
export * from './interfaces';
