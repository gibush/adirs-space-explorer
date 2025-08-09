// Basic interfaces
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface SearchHistoryEntry {
  id: string;
  search_term: string;
  timestamp: string;
  created_at: string;
}

export interface Source {
  id: string;
  name: string;
  type: string;
  launch_date: string;
  description: string;
  image_url?: string;
  canonical_url?: string;
  keywords: string[];
  photographer: string;
  search: boolean;
  confidence_score?: number;
}

// Request interfaces
export interface SignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ValidateTokenRequest {
  token: string;
}

// Response interfaces
export interface SignupResponse {
  success: boolean;
  message: string;
  user: User;
  token?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface ValidateTokenResponse {
  valid: boolean;
  message: string;
  user?: User;
}

export interface MeResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface SearchHistoryResponse {
  success: boolean;
  data: SearchHistoryEntry[];
  total: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// Parameter interfaces for API calls
export interface SearchHistoryParams {
  offset?: number;
  limit?: number;
}

export interface SourcesParams {
  offset?: number;
  limit?: number;
  q?: string;
}
