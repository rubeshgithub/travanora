import { api } from '@/lib/api.js';
import type { AuthResponse, LoginInput, RegisterInput, ForgotPasswordInput } from '@travanora/shared';

export async function register(input: RegisterInput): Promise<AuthResponse> {
  return api.post<AuthResponse>('/api/auth/register', input);
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  return api.post<AuthResponse>('/api/auth/login', input);
}

export async function logout(): Promise<void> {
  return api.post<void>('/api/auth/logout');
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<{ ok: boolean; message: string }> {
  return api.post('/api/auth/forgot-password', input);
}
