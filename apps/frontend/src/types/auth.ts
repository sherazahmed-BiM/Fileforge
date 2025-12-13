/**
 * Auth Types for FileForge
 *
 * TypeScript types for authentication API.
 */

export interface User {
  id: number;
  email: string;
  name: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignupResponse {
  message: string;
  user_id: number;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface LogoutResponse {
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyOTPRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  message: string;
  verified: boolean;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface AuthError {
  detail: string;
  code?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
