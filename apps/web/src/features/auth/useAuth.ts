import { useCallback } from 'react';
import { useAuthStore } from './auth.store.js';
import { login as loginApi, register as registerApi, logout as logoutApi } from './auth.api.js';
import type { LoginInput, RegisterInput } from '@travanora/shared';

export function useAuth() {
  const { user, member, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await loginApi(input);
      setAuth(result);
      return result;
    },
    [setAuth],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await registerApi(input);
      setAuth(result);
      return result;
    },
    [setAuth],
  );

  const logout = useCallback(async () => {
    await logoutApi().catch(() => undefined);
    clearAuth();
  }, [clearAuth]);

  return { user, member, isAuthenticated, login, register, logout };
}
