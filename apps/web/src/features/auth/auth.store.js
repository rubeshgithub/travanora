import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api.js';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    member: null,
    accessToken: null,
    isAuthenticated: false,
    setAuth({ user, member, accessToken }) {
        apiClient.setToken(accessToken);
        set({ user, member, accessToken, isAuthenticated: true });
    },
    updateToken(token) {
        apiClient.setToken(token);
        set({ accessToken: token });
    },
    clearAuth() {
        apiClient.setToken(null);
        set({ user: null, member: null, accessToken: null, isAuthenticated: false });
    },
}), {
    name: 'travanora-auth',
    partialize: (s) => ({
        user: s.user,
        member: s.member,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
    }),
}));
// Wire up callbacks so the api client can update the store after a silent refresh
apiClient.onTokenRefreshed((token) => {
    useAuthStore.getState().updateToken(token);
});
apiClient.onSessionExpired(() => {
    useAuthStore.getState().clearAuth();
});
// Restore persisted token into the api client on module load
const { accessToken } = useAuthStore.getState();
if (accessToken) {
    apiClient.setToken(accessToken);
}
//# sourceMappingURL=auth.store.js.map